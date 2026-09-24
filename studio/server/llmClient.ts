/**
 * llmClient.ts — envoltorio fino sobre el modelo de texto. Cada fase del pipeline se llama como
 * una función de generación de contenido sin estado (una llamada, sin herramientas de
 * filesystem/navegador para el modelo) — ver la decisión de diseño en el plan de esta
 * funcionalidad. El backend es quien decide qué texto/imágenes entran y qué hace con el texto
 * que sale.
 *
 * Proveedor configurable (2026-09-24): LLM_PROVIDER=openai usa la API de chat completions
 * "compatible con OpenAI" por fetch (sin dependencia nueva) — sirve para OpenAI y, cambiando
 * LLM_BASE_URL, para cualquier proveedor que exponga ese formato (Gemini, OpenRouter...).
 * Sin LLM_PROVIDER se mantiene Anthropic, el comportamiento original.
 */
import Anthropic from '@anthropic-ai/sdk';

type Provider = 'anthropic' | 'openai';

export const PROVIDER: Provider = process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'anthropic';

export const MODEL =
  process.env.LLM_MODEL ||
  process.env.STUDIO_MODEL ||
  (PROVIDER === 'openai' ? 'gpt-5.4-mini' : 'claude-sonnet-5');

/** Los modelos de razonamiento de OpenAI gastan parte de max_completion_tokens en razonar antes
 *  de escribir; sin este margen, una fase que pide 8000 tokens de salida podría cortarse. */
const REASONING_HEADROOM = 8000;

export interface ImageInput {
  base64: string;
  mediaType: string;
}

interface CallOpts {
  systemPrompt: string;
  userText: string;
  images?: ImageInput[];
  maxTokens?: number;
}

export async function callAgent(opts: CallOpts): Promise<string> {
  return PROVIDER === 'openai' ? callOpenAI(opts) : callAnthropic(opts);
}

let anthropic: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY no configurada (ver studio/.env.example).');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

async function callAnthropic(opts: CallOpts): Promise<string> {
  const content: Array<Record<string, unknown>> = [];

  for (const img of opts.images || []) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
    });
  }
  content.push({ type: 'text', text: opts.userText });

  const resp = await getAnthropic().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.systemPrompt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: [{ role: 'user', content: content as any }],
  });

  return resp.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

async function callOpenAI(opts: CallOpts): Promise<string> {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_PROVIDER=openai pero no hay LLM_API_KEY ni OPENAI_API_KEY configurada.');
  }
  const baseUrl = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');

  const content: Array<Record<string, unknown>> = [];
  for (const img of opts.images || []) {
    content.push({ type: 'image_url', image_url: { url: `data:${img.mediaType};base64,${img.base64}` } });
  }
  content.push({ type: 'text', text: opts.userText });

  const body: Record<string, unknown> = {
    model: MODEL,
    max_completion_tokens: (opts.maxTokens ?? 8000) + REASONING_HEADROOM,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content },
    ],
  };
  if (process.env.LLM_REASONING_EFFORT) body.reasoning_effort = process.env.LLM_REASONING_EFFORT;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${MODEL} (${baseUrl}) ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ finish_reason?: string; message?: { content?: string | null } }>;
  };
  const choice = data.choices?.[0];
  const text = choice?.message?.content || '';
  // Una salida cortada rompería el parseo de bloques de archivo más adelante con un error
  // confuso; mejor fallar aquí diciendo el motivo real.
  if (choice?.finish_reason === 'length') {
    throw new Error(`${MODEL} cortó la respuesta por límite de tokens — sube maxTokens de esta fase o baja LLM_REASONING_EFFORT.`);
  }
  if (!text) throw new Error(`${MODEL} devolvió una respuesta vacía.`);
  return text;
}

/**
 * Modo standalone (2026-09-24): llamada larga con búsqueda web, vía la Responses API de OpenAI
 * en modo background (se crea la respuesta y se consulta hasta que termina). Sin background, una
 * generación de varios minutos puede cortarse por el timeout de cabeceras de fetch (~5 min).
 * Solo OpenAI: es el proveedor configurado en producción y el que tiene la herramienta web_search.
 */
export async function callResearchAgent(opts: {
  instructions: string;
  input: string;
  maxOutputTokens: number;
  reasoningEffort?: string;
  onProgress?: (elapsedSeconds: number) => void;
  timeoutMs?: number;
}): Promise<{ text: string; webSearches: number }> {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('El modo standalone necesita OPENAI_API_KEY (o LLM_API_KEY).');
  const baseUrl = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = PROVIDER === 'openai' ? MODEL : process.env.STANDALONE_MODEL || 'gpt-5.5';
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  const createRes = await fetch(`${baseUrl}/responses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      instructions: opts.instructions,
      input: opts.input,
      tools: [{ type: 'web_search' }],
      reasoning: { effort: opts.reasoningEffort || 'medium' },
      max_output_tokens: opts.maxOutputTokens,
      background: true,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`${model} (${baseUrl}/responses) ${createRes.status}: ${(await createRes.text()).slice(0, 500)}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resp: any = await createRes.json();
  const started = Date.now();
  const timeoutMs = opts.timeoutMs ?? 30 * 60 * 1000;
  let lastProgress = 0;
  while (resp.status === 'queued' || resp.status === 'in_progress') {
    if (Date.now() - started > timeoutMs) {
      await fetch(`${baseUrl}/responses/${resp.id}/cancel`, { method: 'POST', headers }).catch(() => undefined);
      throw new Error(`${model} no terminó en ${Math.round(timeoutMs / 60000)} minutos — cancelado.`);
    }
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(`${baseUrl}/responses/${resp.id}`, { headers });
    if (!pollRes.ok) continue; // un fallo puntual de red no debe tumbar un trabajo de minutos
    resp = await pollRes.json();
    const elapsed = Math.round((Date.now() - started) / 1000);
    if (opts.onProgress && elapsed - lastProgress >= 60) {
      lastProgress = elapsed;
      opts.onProgress(elapsed);
    }
  }

  if (resp.status !== 'completed') {
    const why = resp.error?.message || resp.incomplete_details?.reason || resp.status;
    throw new Error(
      why === 'max_output_tokens'
        ? `${model} se quedó sin tokens de salida antes de terminar el HTML.`
        : `${model} no completó la respuesta: ${why}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any[] = resp.output || [];
  const text = output
    .filter((o) => o.type === 'message')
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === 'output_text')
    .map((c) => c.text)
    .join('\n');
  if (!text) throw new Error(`${model} devolvió una respuesta vacía.`);
  return { text, webSearches: output.filter((o) => o.type === 'web_search_call').length };
}
