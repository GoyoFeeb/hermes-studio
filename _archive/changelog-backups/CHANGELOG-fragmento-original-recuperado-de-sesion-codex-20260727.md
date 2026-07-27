# Fragmento ORIGINAL recuperado de `engine/CHANGELOG.md` (no reescritura, no reconstrucción)

> Recuperado por Claude el 2026-07-27 leyendo directamente el log de sesión de Codex
> (`~/.codex/sessions/2026/07/27/rollout-2026-07-27T10-17-56-019fa2a6-eca3-7ea0-9638-9a71b9c31df3.jsonl`),
> concretamente la salida de dos comandos `sed -n` que Codex ejecutó ANTES de su primera edición
> al archivo (primer `apply_patch` sobre `engine/CHANGELOG.md` a las 10:19:40 UTC del 2026-07-27).
> Este es texto literal del archivo tal como existía en ese momento — no está reescrito ni
> parafraseado.
>
> **Cobertura conocida**: líneas 1–80 y 136–152 del archivo original (que, según nota posterior
> de Codex, tenía ~2.777 líneas / ~189 KB en total). Faltan las líneas 81–135 y todo lo posterior
> a la línea 152 — no se encontró ningún otro comando en el log de sesión que leyera el resto del
> archivo antes de que empezara a editarse.

---

## Líneas 1–80 (fuente: `sed -n '1,80p' engine/CHANGELOG.md`, ejecutado 2026-07-27T10:18:13Z, antes de cualquier edición)

# Changelog — engine/

## Prompt 11 — Extracción de la biblioteca de componentes (2026-07-20)

Primer prompt de la Fase 1 (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`, §3.2).
Crea `engine/components/` a partir de la única pieza premium validada del sistema.

### Prerequisito verificado
`brands/paraycompara/tokens/brand-tokens.json` estaba en v2.2.0 (prompt 09 ejecutado el
2026-07-17) antes de empezar.

### Componentes creados
9 componentes activos + 1 parcial compartido (`cta-bulletproof.html`) + 1 stub no usado
(`header.html`, ver más abajo). Detalle completo, con orígenes de línea y tokens/datos de
cada uno, en `engine/components/INVENTORY.md`.

- `_shell.html` — envoltorio de página (doctype/head/preheader/tabla exterior)
- `hero-asimetrico.html` — logo + hero (fusionados, ver decisión abajo)
- `header.html` — **no usado**, stub de redirección a hero-asimetrico.html
- `cta-bulletproof.html` — parcial VML+fallback, usado por hero y banda de cierre
- `trust-bar.html`
- `card-tarifa.html`
- `pasos.html`
- `lista-premium.html`
- `banda-cierre.html`
- `footer.html`

### Convención de placeholders — extensión respecto al prompt
El prompt define `{{token:}}`, `{{data:}}` y `{{#each:}}`. Se añadió `{{include:nombre}}`
para el parcial compartido (`cta-bulletproof`), porque el inventario del prompt pide
explícitamente un componente "usado por hero y cierre" y eso no es representable con los 3
placeholders base. Cuando un padre usa `{{include:cta-bulletproof}}`, sus campos
`{{data:cta.href}}` / `{{data:cta.label}}` se resuelven en el ámbito de datos del PADRE
(`hero.cta` en el hero, `closing.cta` en la banda de cierre). **`build-newsletter.js`
(prompt 13) debe implementar esta resolución de `{{include:}}` con herencia de ámbito.**

### Decisión de diseño — logo fusionado dentro de hero-asimetrico.html
El inventario esperaba `header.html` (logo) y `hero-asimetrico.html` como 2 componentes
separados. En la fuente comparten una única `<table>` (líneas 75-166, 5 filas). Separarlos
exige duplicar la apertura de `<td>/<table>`, lo que rompe el criterio de aceptación "conteos
estructurales fuente vs suma de componentes: exactos" (51→52 tablas). Se priorizó el conteo
exacto sobre la forma del inventario (que el propio prompt marca como aproximado). El logo
vive dentro de `hero-asimetrico.html`; `header.html` quedó como stub documentado (no se pudo
eliminar el archivo — la carpeta montada no permitió el borrado en esta sesión — pero no
contiene markup real).

### Tokens añadidos a brand-tokens.json (v2.2.0 → v2.2.1)
Cada valor visual sin token encontrado durante la extracción se añadió al JSON en vez de
dejarlo hardcodeado, según instrucción del prompt. Detalle completo con verificación línea a
línea contra `09-exports/final.html` en el `_changelog` del propio `brand-tokens.json`.

**Adiciones limpias:** `colors.onBrandSecondary`, `colors.accentHaloLight`,
`colors.footerSeparator`, `assets.headerPatternTile`, y 10 tokens tipográficos nuevos
(`statLabel`, `stepNumber`, `stepTitle`, `cardLinkSecondary`, `trustBarText`, `footerBrand`,
`footerTagline`, `footerDisclosure`, `footerLegal`, `footerLinks`).

**Correcciones de valores stale encontrados durante la extracción** (no eran parte del
prompt 09, se descubrieron ahora):
- `typography.cta.size`: 16 → 19 (el CTA se subió a 19px en la ronda 10, el token nunca se
  actualizó)
- `components.trustBar.backgroundColor`: `#EAE0EA` → `#F8F5FC` (`#EAE0EA` no aparece en el
  HTML real ni una vez)
- `assets.logoWidth`/`logoHeight`: 200/55 → 176/48 (no coincidía con el `<img>` real)

### Hallazgo mayor — bug de producción en la campaña piloto (no corregido, solo documentado)
2 de los 4 ítems de la sección "Antes de decidir" en `09-exports/final.html` (la pieza hoy
marcada "Production Gate: ✅") están rotos: falta el `<h3>` del título y hay una tabla sin
cerrar que anida los ítems siguientes en vez de dejarlos como hermanos. Confirmado por conteo
real de `<h3>` (9 en la fuente, no 11) y verificado también en el HTML inline. Ninguna ronda
de QA anterior lo detectó por falta de verificación real en Outlook/Litmus (limitación ya
documentada en `handoff.md` de la campaña). `lista-premium.html` usa la estructura correcta
para las 4 repeticiones — no se reproduce el bug en el componente reutilizable. La fuente de
la campaña (`v5-premium/final-premium-v2.html`, `09-exports/final.html`) **no se tocó** —
recomendado abrir una corrección de campaña aparte antes de reenviar esa pieza. Detalle
técnico completo en la cabecera de `engine/components/lista-premium.html` y en
`engine/components/INVENTORY.md`.

### Otras anomalías normalizadas (documentadas en cada componente)
- Tarjeta "Móvil" con h3 a 19px (las otras 3 usan 16px) — normalizado a 16px en
  `card-tarifa.html` por ser componente repetible.

---

## [GAP: líneas 81–135 no recuperadas — no se encontró ninguna lectura de este rango antes de la primera edición]

---

## Líneas 136–152 (fuente: `sed -n '136,152p' engine/CHANGELOG.md`, ejecutado 2026-07-27T10:17:29Z, antes de cualquier edición)

**Adiciones limpias:** `colors.onBrandSecondary`, `colors.accentHaloLight`,
`colors.footerSeparator`, `assets.headerPatternTile`, y 10 tokens tipográficos nuevos
(`statLabel`, `stepNumber`, `stepTitle`, `cardLinkSecondary`, `trustBarText`, `footerBrand`,
`footerTagline`, `footerDisclosure`, `footerLegal`, `footerLinks`).

**Correcciones de valores stale encontrados durante la extracción** (no eran parte del
prompt 09, se descubrieron ahora):
- `typography.cta.size`: 16 → 19 (el CTA se subió a 19px en la ronda 10, el token nunca se
  actualizó)
- `components.trustBar.backgroundColor`: `#EAE0EA` → `#F8F5FC` (`#EAE0EA` no aparece en el
  HTML real ni una vez)
- `assets.logoWidth`/`logoHeight`: 200/55 → 176/48 (no coincidía con el `<img>` real)

### Hallazgo mayor — bug de producción en la campaña piloto (no corregido, solo documentado)
2 de los 4 ítems de la sección "Antes de decidir" en `09-exports/final.html` (la pieza hoy
marcada "Production Gate: ✅") están rotos: falta el `<h3>` del título y hay una tabla sin
cerrar que anida los ítems siguientes en vez de dejarlos como hermanos. Confirmado por conteo
real de `<h3>` (9 en la fuente, no 11) y verificado también en el HTML inline. Ninguna ronda
de QA anterior lo detectó por falta de verificación real en Outlook/Litmus (limitación ya
documentada en `handoff.md` de la campaña). `lista-premium.html` usa la estructura correcta
para las 4 repeticiones — no se reproduce el bug en el componente reutilizable. La fuente de
la campaña (`v5-premium/final-premium-v2.html`, `09-exports/final.html`) **no se tocó** —
recomendado abrir una corrección de campaña aparte antes de reenviar esa pieza. Detalle
técnico completo en la cabecera de `engine/components/lista-premium.html` y en
`engine/components/INVENTORY.md`.

## Prompt 14 — Prueba de fuego: regenerar la piloto desde el motor (2026-07-20)

Cuarto y último prompt de la Fase 1. Build con `campaign-data.example.json` →
`engine/_test-output/`. Informe completo en `engine/_test-output/parity-report.md`.

### Veredicto: APTO, 0 iteraciones

Todas las discrepancias de la primera pasada eran correcciones ya documentadas en los prompts
11-13, no defectos nuevos: balance de `<table>` (bug preexistente de la piloto, el motor
genera siempre balanceado), `<h3>` 9 vs 11 (bug "Antes de decidir" corregido), gris de footer
(fix WCAG v2.2.2 aplicado por token), altura total ~6-7% menor (fix de fuente móvil — título
del cierre en 1 línea).

### Paridad visual — método y hallazgo de proceso

Render con Chromium headless (stub `libXdamage.so.1` reconstruido: `objdump -T` para extraer
[...línea 152 cortada aquí, el read pedido llegaba solo hasta la línea 152...]
