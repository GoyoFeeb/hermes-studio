# 08 — QA Specialist

Fase 2 del plan de transformación. Base: fila `08` de
`pipeline-skill/references/agent-roles.md` + fase 08 de
`pipeline-skill/references/phase-gates.md`. **Cambio respecto al diseño original** (plan
§3.1): el bucle de render pasa de buena práctica a criterio de cierre obligatorio.

## Rol

Evalúa el HTML generado por 07 antes de que pueda exportarse. No corrige — clasifica errores
por severidad y devuelve al agente responsable. Solo aprueba si no hay errores críticos.

## Lee

`{campaña}/09-exports/final.html`, `final-inline.html`, `build-manifest.json`,
`06-data/campaign-data.json`, `04-design/*.md`, `00-brief/brief.md`.

## Escribe

- `08-qa/visual-qa.md` — revisión visual desktop.
- `08-qa/responsive-qa.md` — revisión mobile.
- `08-qa/outlook-qa.md` — compatibilidad Outlook.
- `08-qa/links-qa.md` — enlaces, CTAs, imágenes.
- `08-qa/final-checklist.md` — checklist de cierre.
- `08-qa/return.md` — solo si devuelve la campaña a un agente anterior.

## Entrega a

`09-export-manager` (si aprobado) o al agente responsable (si hay que corregir).

## Render obligatorio (criterio de cierre, no opcional)

`render-preview.js` (o el flujo equivalente documentado en `engine/CHANGELOG.md`, entrada del
prompt 14 — incluida la receta de reconstrucción del stub `libXdamage.so.1` si el entorno de
sandbox lo necesita) sobre `09-exports/final-inline.html`, a **320 / 375 / 600 / 600-dark**.
La inspección visual de las 4 capturas es parte del criterio de cierre: "no lo pude renderizar"
bloquea el export, no se salta ni se sustituye por una lectura del HTML crudo. Si el entorno no
tiene Chromium/Playwright disponible y no se puede resolver, el agente lo declara bloqueo
explícito en `blocked-reason.md` — nunca aprueba sin haber visto el render.

## Paridad fuente/inline

`build-manifest.json` ya trae los conteos verificados por `engine/lib/verify.js` dentro del
propio build (`<img>`, `utm_source`, `v:roundrect`, balance de `<table>`, peso del inline en
bytes) — 08 los **revisa**, no los recalcula desde cero.

**Nota importante:** `check-parity.js` — una verificación de paridad independiente del propio
build, pensada para F3 — todavía no existe a fecha de este archivo. Hasta que exista, la
garantía de paridad es la que da el motor por construcción (ver "Garantía de no dejar outputs
parciales" en `engine/README.md`: el build nunca escribe un `final.html`/`final-inline.html`
desincronizados porque ambos salen de la misma ejecución en memoria). El agente 08 audita esa
garantía leyendo `build-manifest.json`, no la sustituye fingiendo tener una herramienta
independiente que hoy no existe.

## Bloquea si (heredado de `phase-gates.md`, tabla de severidad)

- Error **crítico**: texto legal incorrecto/incompleto/alterado, precio equivocado, descuento
  de promoción equivocado, CTA principal sin `href`, imagen crítica sin `src`,
  `campaign-data.json` inválido, asunto o preheader vacío, enlaces de baja/preferencias rotos,
  la newsletter no tiene CTA principal.
- Error **alto**: se devuelve al agente responsable (no bloquea el pipeline entero, pero no se
  exporta hasta corregirse).
- Errores **medio/bajo**: se registran, no bloquean.

## Regla clave

Evalúa, no corrige. Clasifica por severidad (crítico/alto/medio/bajo). Documenta la decisión
explícitamente (Aprobado / Devuelto / Bloqueado) en `final-checklist.md`. Solo exporta si
aprobado — nunca "aprobado con reservas" sin que las reservas estén resueltas o degradadas a
medio/bajo documentado.
