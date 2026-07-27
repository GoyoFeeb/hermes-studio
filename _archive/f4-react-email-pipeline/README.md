# Archivo — pipeline React Email

**Fecha de archivado:** 2026-07-21 (F4 del plan de transformación,
`docs/auditoria-total-y-plan-transformacion-2026-07-17.md` §1.3 y §4).

## Qué es esto

El primer motor de generación de HTML del sistema, basado en `@react-email/components` +
`@react-email/render`. Convertía `06-data/newsletter-data.json` (forma de módulos
`{type, content}`) en HTML vía componentes React (`HeaderBlock`, `HeroBlock`,
`CardsGridBlock`...) renderizados server-side.

## Por qué se retiró

Decisión ya tomada en el plan de transformación: **motor perdedor**. Su única producción real
en una campaña fue un `09-exports/final.html` con colores de marca incorrectos, ya identificado
y archivado en la auditoría del 2026-07-17 (`docs/re-auditoria-sistema-hermes-2026-07-17.md`).
La calidad premium real de la pieza piloto se construyó en paralelo, a mano, sobre HTML+juice
(`v5-premium/final-premium-v2.html`) — nunca a través de este pipeline. F1 formalizó ese camino
como `engine/` (JSON Schema + placeholders + `juice`), con paridad fuente/inline garantizada
por construcción — algo que este pipeline nunca tuvo.

## Qué lo sustituye

`engine/` (F1, `docs/f1-motor-cerrado.md`) + `agents/07-html-email-developer.md` (F2,
`docs/f2-agentes-cerrado.md`) — ver ahí el contrato completo del camino vigente.

## Contenido de este archivo

- `react-email-template/` — plantilla base, componentes (`ModuleRenderer.tsx`, `HeroBlock.tsx`,
  `CardsGridBlock.tsx`...), `newsletter-schema.json` (JSON Schema del formato de módulos React,
  distinto del schema del motor en `engine/schema/campaign-data.schema.json`).
- `campaigns/{ruta original}/07-code/react-email/` — el código React generado para cada
  campaña que llegó a pasar por este pipeline: `2026-jul-ahorra-fibra-movil`,
  `demo/2026-jul-test`, `_campaign-template`, `nombre-cliente/2026-jul-nombre-campana`.
- `export-html.tsx` — script que renderizaba el componente React a `final.html`.
- `prepare-react-email.ts` — script que copiaba la plantilla a una campaña nueva.

## Qué NO se tocó

`06-data/newsletter-data.json`, `09-exports/`, y cualquier otro artefacto de las campañas
reales fuera de `07-code/react-email/` — el histórico de cada campaña sigue intacto en su
carpeta original.
