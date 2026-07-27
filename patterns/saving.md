# Patrón de género: saving

Fecha: 2026-07-20 (prompt 12 — `prompts-fase1-motor/12-schema-y-patron-saving.md`)

Este documento hace explícita la estructura premium que hoy vive implícita en
`newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html`.
Es el primer patrón de género del motor — se escribe "gratis" porque es literalmente la pieza
piloto, ya validada con 15+ rondas de refinamiento. Los demás géneros (educational,
retargeting...) se documentan cuando haya una campaña real que los necesite — no antes (regla
anti-aspiracional del plan de transformación, §5).

## 1. Secuencia de componentes

En este orden exacto (el orden del array `modules` en `campaign-data.json` DEBE seguir esta
secuencia):

| # | Componente (`engine/components/`) | Fondo | Obligatorio |
|---|---|---|---|
| — | `_shell.html` (envoltorio, no es un módulo) | — | Siempre |
| 1 | `hero-asimetrico.html` (incluye logo) — o `hero-centrado.html` si la marca no tiene cifra confirmada ni logo PNG (variante 2026-07-21) | `colors.primary` | Sí |
| 2 | `trust-bar.html` | `colors.background.white` + pill `surfaces.sectionLila` | Opcional (ver §3) |
| 3 | `card-tarifa.html` (4 tarjetas, 2×2) — o `card-tarifa-3.html` (3 tarjetas, fila 33/33/33; variante 2026-07-21) | `colors.background.white` | Sí |
| 4 | `pasos.html` | `colors.background.white` | Sí |
| 5 | `lista-premium.html` | `surfaces.sectionLila` | Opcional (ver §3) |
| 6 | `banda-cierre.html` | `colors.deep` (#3E244D) | Sí |
| 7 | `footer.html` | `surfaces.global` (#F4F3F9) | Siempre |

`preheader` no es un módulo — es un campo de `metadata` que `_shell.html` consume
directamente (`{{data:preheader}}`).

<!-- PATTERN_SEQUENCE (bloque parseable por engine/build-newsletter.js — prompt 13. GRAMÁTICA,
     no lista rígida, desde 2026-07-24 — ver la cabecera de engine/lib/pattern.js:
       "N. alternativas (required|optional[, max N])"  → ANCLA (posición fija)
       "-  alternativas (required|optional[, max N])"  → ZONA LIBRE (orden libre, repetible)
     Las líneas "-" consecutivas forman una zona. Debe mantenerse sincronizado a mano con la
     tabla de arriba, que es la versión legible.
     NOTA: `banda-cierre-asimetrico` se añade aquí como alternativa del cierre — existía en el
     motor desde Nivel 2 pero este patrón nunca lo había listado, así que las marcas `saving`
     con `layout.sectionStyle:"asimetrico"` (paraycompara, tarifalo — las dos) no podían usarlo.
     Era un hueco real del patrón, no una decisión. -->
1. hero-asimetrico|hero-centrado|hero-imagen|hero-marca-* (required)
- trust-bar (optional, max 1)
- card-tarifa|card-tarifa-3 (required, max 2)
- pasos (required, max 1)
- lista-premium (optional, max 2)
2. banda-cierre|banda-cierre-asimetrico (required)
3. footer (required)
<!-- /PATTERN_SEQUENCE -->

## 2. Reglas de ritmo

Fuente: ronda de ritmo editorial (`v5-premium/rondas/ritmo/qa-report-ritmo.md`, 2026-07-15) y
`component-patterns.md`. Verificado contra la pieza real (09-exports/final.html) en el
prompt 11 — los fondos de esta tabla son los de los componentes ya extraídos, no una copia de
la ronda original (que describía un estado anterior a G4-G8.1):

| # | Sección | Fondo real (verificado) | Alineación | Densidad |
|---|---|---|---|---|
| 1 | Hero | `#5E2E91` (primary) | Asimétrica (H1 izq / stat der) | Media |
| 2 | Trust bar | `#FFFFFF` sección, pill `#F8F5FC` | Centrada | Baja |
| 3 | Tarjetas | `#FFFFFF` | Centro (header) / grid | Alta (2×2) |
| 4 | Pasos | `#FFFFFF` | Centrada | Baja (círculos sueltos, sin conector) |
| 5 | Lista ("antes de decidir") | `#F8F5FC` (lila) | Izquierda | Alta (4 tarjetas apiladas) |
| 6 | Banda de cierre | `#3E244D` (deep) | Centrada | Media |
| 7 | Footer | `#F4F3F9` (global) | Centrada | Baja |

**Regla dura: ninguna sección consecutiva puede repetir la misma combinación
fondo+alineación+densidad.** Verificado que la secuencia de arriba la cumple: 1→2 cambia todo,
2→3 cambia fondo y densidad, 3→4 mantiene fondo pero invierte densidad (grid denso → círculos
sueltos — la única pareja que comparte fondo, y lo hace a propósito, documentado en la ronda
de ritmo como contraste deliberado de densidad), 4→5 cambia fondo y alineación, 5→6 cambia
fondo y densidad, 6→7 cambia fondo y densidad.

**Otras reglas de ritmo:**
- El CTA principal aparece en el primer tercio (hero) y se repite en el cierre — nunca solo
  una vez, nunca más de dos.
- Alternancia blanco/lila en las secciones de contenido (no dos fondos claros idénticos
  seguidos): tarjetas (blanco) → pasos (blanco, permitido por la excepción de densidad
  invertida de arriba) → lista (lila) rompe la posible monotonía antes del cierre morado.
- Disciplina de sombras (ronda G7, "prompt maestro premium-conversión"): la sombra se reserva
  para elementos con función de foco — tarjetas de tarifa, tarjetas de la lista premium y CTAs.
  Ningún otro elemento (trust bar, badges circulares, halos de pasos) lleva sombra. Ver
  `shadows` en brand-tokens.json — solo existen `card` y `cta` como sombras activas
  (`statPill` está marcada `verified:false`, no se usa en esta pieza).
- Acento de color único (`accentSignature`, ronda G4): el mismo `colors.light` (#7B1FA2) se
  reutiliza en 3 orientaciones (kicker rule sobre eyebrows, franja superior de tarjetas, halo
  de pasos) en vez de introducir colores nuevos por sección.
- Composición asimétrica permitida en secciones puntuales para romper el eje centrado (hero y
  lista premium ya lo hacen) — no se generaliza a todas las secciones, es una variación, no la
  norma.

## 3. Obligatorio vs. opcional

| Módulo | Regla |
|---|---|
| Hero, tarjetas, pasos, banda de cierre, footer | **Obligatorios.** No hay pieza `saving` sin estos 5. |
| Trust bar | **Opcional.** Solo se incluye si el brief confirma 3 claims de confianza reales (no inventados — ver `pipeline-skill/references/agent-roles.md`, contrato del agente 01 Briefing, sobre no fabricar datos). Si hay menos de 3 claims confirmados, se omite el módulo completo — el componente `trust-bar.html` no admite menos de 3 ítems (`minItems:3` en el schema). |
| Lista premium | **Opcional con mínimo 3.** Se incluye si el brief aporta 3 o 4 puntos de "qué revisar antes de decidir". El componente admite 3-4 (`{{#each}}`, sin el layout fijo de tarjetas/pasos). Con menos de 3 no hay suficiente contenido para justificar una sección propia — se omite. |
| Tarjetas de producto | **Obligatorio, 3 o 4 ítems**: `card-tarifa` (4, grid 2×2) o `card-tarifa-3` (3, fila) — la variante de 3 se añadió el 2026-07-21 (incidente tarifalo). Para 2 tarjetas sigue sin existir variante (pendiente, no se improvisa). |

## 4. Criterios de contenido por módulo

| Módulo | Qué dato del brief lo alimenta | Si falta |
|---|---|---|
| Hero | Propuesta de valor principal + 1 cifra de marca confirmada (ej. "+30 compañías") | Usar `hero-centrado` (variante 2026-07-21: H1 centrado sin stat, marca como texto) — el asimétrico exige cifra confirmada (el patrón heroEditorialNoPhoto exige un dato propio de marca, nunca inventado — ver `components.patterns.heroEditorialNoPhoto.fallbackForOtherBrands` en brand-tokens.json) |
| Trust bar | 3 claims de confianza verificables del brief | Omitir el módulo entero (ver §3) |
| Tarjetas | 2-4 líneas de producto/servicio con su propia URL de comparación | Bloquear si hay menos de 2 — no hay pieza "saving" sin al menos 2 opciones que comparar |
| Pasos | El proceso real (3 pasos) que sigue el usuario | Bloquear — es estructural al género "saving" (ahorrar siguiendo un proceso), no se puede omitir |
| Lista premium | 3-4 puntos de atención/checklist del brief | Omitir el módulo entero (ver §3) |
| Banda de cierre | Mismo CTA del hero, copy de urgencia/cierre sin inventar plazos o descuentos no confirmados | Bloquear — no hay pieza sin cierre con CTA |
| Footer | Datos legales de la marca (dirección, enlaces de baja/preferencias) | Bloquear en producción (`productionReady:false` hasta tenerlos) — permitido placeholder textual SOLO si `metadata.isTestCampaign:true` |

## 5. Contrastes mínimos (WCAG) — umbrales correctos

**Regla de "texto grande" (la lección del CTA):** un texto cuenta como "grande" a efectos de
WCAG (umbral 3:1 en vez de 4.5:1) solo si es **≥24px con peso normal** o **≥18.66px con peso
bold/semibold** (equivalente a 24pt/18.66pt, no hay redondeo generoso). El CTA a 19px/700 SÍ
califica; un enlace secundario a 13px/700 NO, aunque comparta el mismo peso.

Todos los valores de la tabla se recalcularon con la fórmula de luminancia relativa de WCAG
2.x contra los tokens reales de `brand-tokens.json` v2.2.2 — no se copiaron de documentos de
rondas anteriores sin verificar (varios de esos documentos, aunque bien intencionados,
arrastraban valores desactualizados; ver hallazgos abajo).

| Combinación | Contexto | Tamaño/peso | Umbral aplicable | Ratio real | Resultado |
|---|---|---|---|---|---|
| `#FFFFFF` / `#5E2E91` | H1 hero, check trust-bar, badge lista | 28px/800 (H1) | Grande (3:1) | 9.23:1 | ✅ PASS |
| `colors.onBrandSecondary` (#D9C2E6) / `#5E2E91` | Subtítulo del hero | 15px/400 | Normal (4.5:1) | 5.63:1 | ✅ PASS |
| `colors.onBrandSecondary` (#D9C2E6) / `#3E244D` | Subtítulo banda de cierre | 15px/400 | Normal (4.5:1) | 8.19:1 | ✅ PASS |
| `#FFFFFF` / `#FF5A3C` | Texto del CTA principal | 19px/700 | **Grande** (3:1) | 3.10:1 | ✅ PASS (justo, solo por calificar como texto grande) |
| `#7B1FA2` / `#FFFFFF` | Eyebrow sobre blanco | 12px/700 | Normal (4.5:1) | 8.20:1 | ✅ PASS |
| `#7B1FA2` / `#F8F5FC` | Eyebrow sobre lila | 12px/700 | Normal (4.5:1) | 7.60:1 | ✅ PASS |
| `#5E2E91` / `#FFFFFF` | h2Section | 22px/800 | Grande (3:1) | 9.23:1 | ✅ PASS |
| `#66616A` / `#FFFFFF` | Body sobre blanco | 14px/400 | Normal (4.5:1) | 6.03:1 | ✅ PASS |
| `#66616A` / `#F8F5FC` | Body sobre lila | 14px/400 | Normal (4.5:1) | 5.59:1 | ✅ PASS |
| `#FFFFFF` / `#3E244D` | h2OnBrand cierre | 26px/800 | Grande (3:1) | 13.42:1 | ✅ PASS |
| `#66616A` / `#F4F3F9` | Footer disclosure | 12px/400 | Normal (4.5:1) | 5.47:1 | ✅ PASS |
| `#5E2E91` / `#F4F3F9` | Footer brand | 12px/600 | Normal (4.5:1) | 8.36:1 | ✅ PASS |
| `#5E2E91` / `#F8F5FC` | Texto trust-bar | 12px/600 | Normal (4.5:1) | 8.55:1 | ✅ PASS |

### Hallazgos durante la construcción de esta tabla (2 fallos reales)

1. **`typography.footerTagline` — CORREGIDO en brand-tokens.json v2.2.2.** El color original
   (`#99939B`) sobre `#F4F3F9` daba **2.72:1**, por debajo del mínimo de 4.5:1 (texto de
   12px/400). Es el mismo fallo que ya se había corregido una vez en la línea de disclosure
   del footer en una ronda anterior (2.72→5.47, ver `redesign-summary.md`), pero la corrección
   nunca se propagó a la línea de tagline. Se corrigió reutilizando `colors.text.secondary`
   (#66616A, 5.47:1, AA pass) — mismo color ya validado, no se inventó uno nuevo.

2. **Enlace secundario de `card-tarifa*` — CORREGIDO 2026-07-27.** El enlace "Ver tarifas →"
   ya no usa `colors.ctaBackground`; ahora usa `colors.primary` a 13px/700 sobre blanco. Motivo:
   `colors.ctaBackground` no era estable como texto (Spotify y Tarifalo no alcanzan 3:1 sobre
   blanco), mientras que `colors.primary` pasa AA normal en todos los brand packs activos. La
   combinación queda automatizada en `scripts/check-contrast.ts` como "Enlace secundario de
   tarjeta sobre blanco".

## 6. Límites conocidos de este patrón (no resueltos aquí, fuera de alcance del prompt 12)

- El bug de la sección "Antes de decidir" en la campaña piloto (2 de 4 títulos ausentes en el
  HTML histórico) es un defecto de ESA campaña, no del patrón — `lista-premium.html` y
  `campaign-data.example.json` ya usan la estructura/títulos correctos.
- `card-tarifa` soporta 4 tarjetas (`card-tarifa.html`) y 3 tarjetas (`card-tarifa-3.html`).
  La única variante pendiente es la de 2 tarjetas, condicionada a una campaña real.
- Los títulos de `banda-cierre` deben tener 45 caracteres o menos; `check-column-balance.ts`
  bloquea valores superiores desde 2026-07-27.
