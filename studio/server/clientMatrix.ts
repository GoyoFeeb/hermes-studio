/**
 * clientMatrix.ts — la revisión automática agrupada por programa de correo (2026-10-01, como el "Email
 * Preflight" de Migma).
 *
 * No añade comprobaciones: reparte las que ya hace studio/worker/qualityCheck.ts según el programa al que
 * afectan, para leer "¿se verá bien en Outlook / Gmail / Apple Mail / móvil?" de un vistazo. No son capturas
 * reales de cada programa (eso exigiría un servicio de pago tipo Litmus o Email on Acid): la página lo dice.
 *
 * Qué afecta a cada uno (soporte según caniemail.com):
 *  - Outlook de escritorio (Windows, motor de Word): <!--[if mso]>, VML, tablas, width en imágenes, 96 ppp.
 *  - Gmail: recorta los correos de más de ~102 KB; ignora prefers-color-scheme e invierte colores por su cuenta.
 *  - Apple Mail (iPhone y Mac): respeta color-scheme y prefers-color-scheme → el modo oscuro de la pieza.
 *  - Móvil: la medición a 375 px del worker.
 *  - Todos: enlaces, imágenes publicadas, alt, logo arriba y abajo, baja, preheader y claims (contenido, igual en cualquier programa).
 */
import type { CheckStatus, QualityReport } from '../worker/qualityCheck';

export type ClientId = 'outlook' | 'gmail' | 'apple' | 'mobile' | 'all';
export type RowStatus = CheckStatus | 'unknown';

export interface ClientItem {
  checkId: string;
  label: string;
  /** Posición del detalle en el check (para "Ver" en la vista previa); -1 si el check no tiene detalles. */
  detailIndex: number;
  text: string;
  level: 'error' | 'warning' | 'ok';
}

export interface ClientRow {
  id: ClientId;
  name: string;
  scope: string;
  status: RowStatus;
  items: ClientItem[];
  /** Lo que no se puede comprobar en el código pero conviene saber de ese programa. */
  notes: string[];
}

const CLIENTS: { id: ClientId; name: string; scope: string; checks: string[]; notes: string[] }[] = [
  {
    id: 'outlook',
    name: 'Outlook de escritorio',
    scope: 'Windows (Microsoft 365, 2016–2021)',
    checks: ['outlook'],
    notes: ['En modo oscuro, Outlook de Windows invierte los colores a su manera y no se puede controlar desde el código: conviene revisarla invertida (en Studio, vista previa «Invertido»).'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    scope: 'Web, app de iPhone y de Android',
    checks: ['size'],
    notes: ['Gmail no aplica los estilos de modo oscuro de la pieza: en la app invierte los colores por su cuenta. Conviene revisarla invertida (en Studio, vista previa «Invertido»).'],
  },
  {
    id: 'apple',
    name: 'Apple Mail',
    scope: 'iPhone, iPad y Mac',
    checks: ['dark-mode'],
    notes: [],
  },
  {
    id: 'mobile',
    name: 'Móvil',
    scope: 'Pantallas de 375 px (iPhone y Android)',
    checks: ['mobile'],
    notes: [],
  },
  {
    id: 'all',
    name: 'Todos los programas',
    scope: 'Enlaces, imágenes, logo, baja, preheader y textos',
    checks: [], // el resto de comprobaciones, incluidas las que se añadan en el futuro
    notes: [],
  },
];

const RANK: Record<CheckStatus, number> = { ok: 0, warning: 1, error: 2 };

export function clientMatrix(report: QualityReport): ClientRow[] {
  const assigned = new Set(CLIENTS.flatMap((c) => c.checks));
  return CLIENTS.map((client) => {
    const checks = report.checks.filter((c) => (client.checks.length ? client.checks.includes(c.id) : !assigned.has(c.id)));
    const items: ClientItem[] = checks.flatMap((c) =>
      c.details.length
        ? c.details.map((text, i) => ({
            checkId: c.id,
            label: c.label,
            detailIndex: i,
            text,
            level: (i < (c.errorCount || 0) ? 'error' : c.status === 'ok' ? 'ok' : 'warning') as ClientItem['level'],
          }))
        : [{ checkId: c.id, label: c.label, detailIndex: -1, text: c.status === 'ok' ? 'Correcto.' : '', level: c.status }]
    );
    const status: RowStatus = checks.length
      ? (checks.reduce((worst, c) => (RANK[c.status] > RANK[worst] ? c.status : worst), 'ok' as CheckStatus))
      : 'unknown';
    const notes = [...client.notes];
    if (client.id === 'mobile' && !checks.length) notes.push('No se midió en esta versión: es anterior a la medición o se hizo sin Hermes.');
    return { id: client.id, name: client.name, scope: client.scope, status, items, notes };
  });
}
