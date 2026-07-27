# Delivery Notes — Rolex Datejust "Una fecha para recordar"

## Qué se exporta

- `09-exports/final.html` — fuente
- `09-exports/final-inline.html` (21.1 KB) — CSS inline, listo para pruebas de envío
- `09-exports/build-manifest.json`

## Resumen por fase

| Fase | Resultado |
|---|---|
| 02 — Brand Visual Analyst | Brand pack Rolex creado desde cero, investigación Nivel 3 completa con Chrome real sobre rolex.com/es/watches/datejust (colores vía custom properties CSS, no aproximación) |
| 03 — Newsletter Architect | Patrón `fotografia-primero` elegido con evidencia (5/5 criterios cumplidos). `hero-imagen` elegido respondiendo explícitamente las 2 preguntas obligatorias |
| 04 — Email Designer | 2 combinaciones de contraste WCAG corregidas en el pack antes de avanzar (no aprobadas "por estar cerca") |
| 05 — Copywriter | Copy basado exclusivamente en hechos observados en la página fuente; 0 coincidencias contra las 29 reglas de `claim-rules.ts` |
| 06 — Data Specialist | `campaign-data.json` válido, build limpio, production gate 11/11 |
| 08 — QA Specialist | Aprobado para prueba interna — render real no disponible en este entorno (documentado, no disimulado), verificación exhaustiva del HTML fuente en su lugar |
| 09 — Export Manager | Este documento |

## Advertencias (campaña de prueba, no de producción)

`isTestCampaign: true`, `productionReady: false`. Ver `08-qa/final-checklist.md` → "Bloqueos de
producción" (B-001 a B-005) y `next-steps.md` para el detalle completo y accionable de cada uno.
Resumen: hero sin generar (sandbox sin salida de red), logo sin asset real, fromEmail/enlaces de
ESP son placeholders, sin aprobación comercial/legal de Rolex.

## Objetivo cumplido de esta campaña (contexto)

Campaña construida específicamente para poner a prueba, en una sola marca real y exigente, todos
los mecanismos añadidos al motor en la ronda "se sigue viendo genérico" (2026-07-25):

- `@font-face` real por marca (Archivo, pesos 300/700) — mecanismo ya usado en 3 marcas
  (Worn Wear, Nike, BMW), ejercitado aquí por primera vez en una 4ª marca nueva sin copiar
  ninguna decisión anterior.
- Fix de ancho del CTA (ya no fuerza `width:100%` en desktop) — verificado en el HTML compilado.
- Vocabulario de forma de CTA (`cta-text-link-bulletproof`/`cta-block-bulletproof`) — investigado
  honestamente y **no aplicado**: Rolex es 100% pastilla en su sitio real. Resultado válido de la
  prueba: el mecanismo por defecto (sin `components.cta.style`) sigue funcionando correctamente
  para una marca que no lo necesita.
- Ritmo estructural asimétrico (`layout.sectionStyle`) en 2 módulos distintos.
- Variante `-sin-icono` en el extremo superior del rango de ítems (4 de 4 posibles).
- Fotografía real (`hero-imagen` + `photography.treatment` específico) — pendiente de
  verificación visual real hasta que el usuario genere el asset (ver `next-steps.md`).
