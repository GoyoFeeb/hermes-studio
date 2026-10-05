/**
 * mail.ts — enviar una prueba de la newsletter por correo (2026-10-05).
 *
 * Con Resend (https://resend.com), por su API HTTP: sin dependencias nuevas. Se activa con dos variables en
 * Railway: RESEND_API_KEY y MAIL_FROM (p. ej. «Hermes Studio <pruebas@feebbodigital.com>», de un dominio
 * verificado en Resend). Sin ellas la web lo dice y no deja enviar. Solo pruebas internas: pocas direcciones,
 * asunto con «[Prueba]» y un límite por hora en index.ts.
 */
export const MAX_TEST_RECIPIENTS = 5;
const EMAIL_RE = /^[^\s@<>(),;:"]{1,64}@[^\s@<>(),;:"]{1,190}\.[a-z]{2,24}$/i;

export function mailEnabled(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

/** Direcciones de una caja de texto (comas, espacios o saltos de línea): las válidas, sin repetir, y las que no. */
export function parseRecipients(raw: unknown): { valid: string[]; invalid: string[] } {
  const parts = (Array.isArray(raw) ? raw.join(',') : String(raw || ''))
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    if (EMAIL_RE.test(p)) {
      if (!valid.some((v) => v.toLowerCase() === p.toLowerCase())) valid.push(p);
    } else invalid.push(p);
  }
  return { valid, invalid };
}

export class MailError extends Error {}

export async function sendTestEmail(opts: { to: string[]; subject: string; html: string }): Promise<{ id: string | null }> {
  if (!mailEnabled()) throw new MailError('El envío de pruebas no está configurado (faltan RESEND_API_KEY y MAIL_FROM).');
  let res: globalThis.Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: opts.to, subject: opts.subject, html: opts.html }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new MailError('No se pudo contactar con el servicio de correo. Inténtalo de nuevo.');
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    // El mensaje de Resend ayuda (dominio sin verificar, clave mal puesta); la clave nunca va en él.
    throw new MailError(`El servicio de correo rechazó el envío${data.message ? `: ${String(data.message).slice(0, 200)}` : ` (HTTP ${res.status})`}.`);
  }
  return { id: data.id || null };
}
