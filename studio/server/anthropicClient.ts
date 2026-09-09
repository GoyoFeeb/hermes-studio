/**
 * anthropicClient.ts — envoltorio fino sobre @anthropic-ai/sdk. Cada fase del pipeline se
 * llama como una función de generación de contenido sin estado (una llamada, sin herramientas
 * de filesystem/navegador para el modelo) — ver la decisión de diseño en el plan de esta
 * funcionalidad. El backend es quien decide qué texto/imágenes entran y qué hace con el texto
 * que sale.
 */
import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY no configurada (ver studio/.env.example).');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const MODEL = process.env.STUDIO_MODEL || 'claude-sonnet-5';

export interface ImageInput {
  base64: string;
  mediaType: string;
}

export async function callAgent(opts: {
  systemPrompt: string;
  userText: string;
  images?: ImageInput[];
  maxTokens?: number;
}): Promise<string> {
  const content: Array<Record<string, unknown>> = [];

  for (const img of opts.images || []) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
    });
  }
  content.push({ type: 'text', text: opts.userText });

  const resp = await getClient().messages.create({
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
