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

