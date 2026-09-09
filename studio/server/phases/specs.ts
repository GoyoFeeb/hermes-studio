/**
 * specs.ts — configuración concreta de las fases 01/03/04/05 para textPhase.ts: qué archivo de
 * agente usar, qué archivos debe producir cada una (según newsletters/_campaign-template/) y
 * qué contexto de fases previas leerle al modelo.
 */
import * as path from 'path';
import { readRepoFile, readRepoFilesGlobLike } from '../campaignFs';
import type { TextPhaseSpec } from './textPhase';

function section(title: string, body: string | null): string {
  if (!body) return '';
  return `\n\n--- ${title} ---\n${body}`;
}

function joinFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([p, c]) => `\n\n--- ${p} ---\n${c}`)
    .join('');
}

export const PHASE_01: TextPhaseSpec = {
  id: '01',
  label: 'Briefing Strategist',
  agentFile: 'agents/01-briefing-strategist.md',
  expectedFiles: (c) => [
    path.join(c, '00-brief/brief.md'),
    path.join(c, '00-brief/requirements.md'),
    path.join(c, '00-brief/source-links.md'),
    path.join(c, '00-brief/open-questions.md'),
  ],
  buildContext: (_c, input) =>
    [
      'Input crudo proporcionado por el compañero de equipo a través del formulario web de',
      'Hermes Studio. No hay más contexto que esto — no inventes nada que no esté aquí; si',
      'falta algo crítico, regístralo como [Q-NNN] tal como indica tu contrato.',
      '',
      `Cliente: ${input.clientName} (slug: ${input.clientSlug})`,
      `Brief / objetivo de la campaña: ${input.briefText}`,
      input.ctaLabel ? `CTA principal solicitado: ${input.ctaLabel}` : '',
      input.ctaUrl ? `Enlace principal: ${input.ctaUrl}` : '',
      input.legalNotes ? `Notas legales/restricciones indicadas: ${input.legalNotes}` : '',
      input.brandUrl ? `URL de la marca: ${input.brandUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
};

export const PHASE_03: TextPhaseSpec = {
  id: '03',
  label: 'Newsletter Architect',
  agentFile: 'agents/03-newsletter-architect.md',
  expectedFiles: (c) => [
    path.join(c, '03-strategy/campaign-angle.md'),
    path.join(c, '03-strategy/message-hierarchy.md'),
    path.join(c, '03-strategy/module-selection.md'),
    path.join(c, '03-strategy/structure.md'),
    path.join(c, '03-strategy/brand-structure-translation.md'),
  ],
  buildContext: (c, input) => {
    const brief = readRepoFilesGlobLike(path.join(c, '00-brief'));
    const analysis = readRepoFilesGlobLike(path.join(c, '02-analysis'));
    const tokens = readRepoFile(path.join('brands', input.clientSlug, 'tokens', 'brand-tokens.json'));
    const patterns = readRepoFilesGlobLike('patterns');
    return [
      'Documentos de fases previas de esta campaña:',
      joinFiles(brief),
      joinFiles(analysis),
      section(`brands/${input.clientSlug}/tokens/brand-tokens.json`, tokens),
      '\n\n--- Patrones de género disponibles (patterns/*.md) — elige uno y justifícalo ---',
      joinFiles(patterns),
    ].join('');
  },
};

export const PHASE_04: TextPhaseSpec = {
  id: '04',
  label: 'Email Designer',
  agentFile: 'agents/04-email-designer.md',
  expectedFiles: (c) => [
    path.join(c, '04-design/layout.md'),
    path.join(c, '04-design/desktop-spec.md'),
    path.join(c, '04-design/mobile-spec.md'),
    path.join(c, '04-design/assets-notes.md'),
  ],
  buildContext: (c, input) => {
    const strategy = readRepoFilesGlobLike(path.join(c, '03-strategy'));
    const analysis = readRepoFilesGlobLike(path.join(c, '02-analysis'));
    const tokens = readRepoFile(path.join('brands', input.clientSlug, 'tokens', 'brand-tokens.json'));
    const patterns = readRepoFilesGlobLike('patterns');
    return [joinFiles(strategy), joinFiles(analysis), section('brand-tokens.json', tokens), joinFiles(patterns)].join(
      ''
    );
  },
};

export const PHASE_05: TextPhaseSpec = {
  id: '05',
  label: 'Copywriter',
  agentFile: 'agents/05-copywriter.md',
  expectedFiles: (c) => [
    path.join(c, '05-copy/subject-lines.md'),
    path.join(c, '05-copy/preheaders.md'),
    path.join(c, '05-copy/body-copy.md'),
    path.join(c, '05-copy/cta-options.md'),
  ],
  buildContext: (c, input) => {
    const design = readRepoFilesGlobLike(path.join(c, '04-design'));
    const strategy = readRepoFilesGlobLike(path.join(c, '03-strategy'));
    const brief = readRepoFile(path.join(c, '00-brief/brief.md'));
    const tokens = readRepoFile(path.join('brands', input.clientSlug, 'tokens', 'brand-tokens.json'));
    return [
      joinFiles(design),
      joinFiles(strategy),
      section('00-brief/brief.md', brief),
      section('brand-tokens.json (usa voice.rhythm para el ritmo de escritura)', tokens),
    ].join('');
  },
};
