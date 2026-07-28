# Brand Visual Analysis — Metodología forense completa

Referencia profunda del agente `02-brand-visual-analyst` (ver `agents/02-brand-visual-analyst.md`
para el contrato conciso — objetivo, entradas/salidas, validaciones, bloquea-si). Este documento
es el detalle metodológico completo: las 17 fases de análisis, la taxonomía de confianza y los
checklists fase a fase. Igual que `agent-roles.md`/`phase-gates.md`/`script-usage.md`, es
material de referencia que el contrato invoca, no un contrato en sí — no tiene `Bloquea si` ni
`Entrega a` propios.

Añadido 2026-07-28 (evolución "Nivel 5" del brand pack, ver `engine/CHANGELOG.md`). Sustituye,
como nivel de rigor exigido, al flujo anterior descrito directamente en el cuerpo del contrato de
02 (revisiones Nivel 1-4, 2026-07-21 a 2026-07-24) — esas reglas siguen vigentes y están
integradas aquí, no reemplazadas.

## Principio fundamental

No describas lo que observas. Convierte cada observación en una especificación accionable con:

1. Valor observado.
2. Fuente/origen exacto (URL + fecha, o archivo/asset concreto).
3. Nivel de confianza (ver taxonomía abajo).
4. Interpretación.
5. Adaptación recomendada para newsletter (600px, compatible con Outlook/Gmail/Apple Mail).

Ejemplo incorrecto: *"La marca usa mucho espacio en blanco y titulares grandes."*
Ejemplo correcto: *"Los bloques principales usan 72-96px de separación vertical en desktop
(`getComputedStyle` sobre 4 secciones de `/home`, 2026-07-28). Traducido a
`spacing.section`/`spacing.hero` del brand pack: 48-64px en email (los componentes del motor no
soportan valores >64px de padding vertical sin verificar peso total del HTML, ver
`engine/lib/verify.js` límite de 90KB)."*

## Taxonomía de confianza

Elaboración de las 3 categorías que `agents/02-brand-visual-analyst.md` ya exige en cada valor
del pack (**documentado / observado / inferido**) — usa esta granularidad más fina en los
archivos de análisis (`02-analysis/visual-identity-report.md`); el pack (`brand-tokens.json`)
sigue usando solo las 3 categorías del contrato, no estas 6:

| Etiqueta fina | Mapea a | Cuándo usarla |
|---|---|---|
| `observed-high` | observado | `getComputedStyle`, variable CSS, o CSS/DOM leído directamente |
| `observed-medium` | observado | medido visualmente con consistencia repetida (regla, no una vez) |
| `inferred-medium` | inferido | deducido de un patrón repetido, sin medición directa |
| `inferred-low` | inferido | estimación con evidencia limitada — candidato directo a `[Q-NNN]` |
| `campaign-specific` | (nota aparte) | pertenece a una campaña/temporada concreta, no a la identidad permanente |
| `brand-core` | documentado u observado | forma parte de la identidad estable, confirmada en múltiples fuentes/fechas |

Nunca presentes como `observed-high` un valor que en realidad es `inferred-low`. Cuando falta
información: dilo explícitamente, explica por qué no se pudo verificar, propone un valor
provisional marcado como inferido, y usa la válvula de escape del contrato si bloquea la entrega.

## Fuentes a analizar (Fase 01 — inventario)

Antes de extraer ningún valor, registra en `02-analysis/source-inventory.md`: web oficial,
ecommerce, landing pages, guía de marca, redes sociales, `brand-tokens.json` previo si existe.
Prioriza fuentes oficiales; ante discrepancias, indica cuál es más reciente/representativa.
**No mezcles estilos de campañas distintas sin marcar la procedencia** — un color de campaña de
temporada no es la identidad permanente de la marca (ver `campaign-specific` en la taxonomía).

Tabla mínima por fuente: nombre, URL/archivo, tipo, fecha de consulta, contexto, relevancia,
fiabilidad, observaciones. Marca explícitamente qué recursos no se pudieron analizar (JS
bloqueado, requiere login, etc. — ver válvula de escape del contrato).

## Fase 02 — Estructura y arquitectura visual

Ya cubierto por el contrato como "Ritmo estructural de la página real" (dimensión 5) y
"Estructura de marca traducible" (dimensión 6, `layout.brandStructure`) — este apartado añade el
nivel de detalle de módulo a módulo que alimenta `02-analysis/visual-identity-report.md` §4:
orden de módulos, jerarquía de secciones, anchura máxima de contenido, número de columnas,
alternancia de fondos, posición/frecuencia de CTAs, estructura de footer. Por cada módulo
relevante: nombre funcional, finalidad, anchura, alineación, espaciado, elementos, comportamiento
responsive, adaptación potencial a email (¿qué componente de `engine/components/*.html` lo
traduciría? Ver `engine/components/INVENTORY.md`).

## Fase 03 — Sistema de retícula (grid)

Nuevo campo del pack: `layout.grid` (informativo — el motor construye a 600px fijo, no consume
`layout.grid` en ningún `{{token:...}}` hoy; es documentación para el agente 04 al diseñar
proporciones de columna, no una restricción del motor). Estructura:

```json
"layout": {
  "grid": {
    "desktop": { "maxWidth": "1280px", "margin": "80px", "gutter": "24px", "columns": 12 },
    "tablet": { "maxWidth": "768px", "margin": "40px", "gutter": "16px", "columns": 8 },
    "mobile": { "maxWidth": "375px", "margin": "16px", "gutter": "12px", "columns": 4 },
    "emailAdaptation": "600px fijo, sin sistema de columnas variable — ver guía de adaptación",
    "source": "observado en {URL} el {fecha}"
  }
}
```

## Fase 04 — Espaciado

`spacing.*` YA existe en todo pack real (`micro/small/medium/large/section/hero/close/
innerSection/cta`) pero **hoy no lo consume ningún componente ni script** — es documentación
para 04/07, no un `{{token:...}}` resuelto por el motor. No inventes una escala nueva y paralela
(`2xs`/`xs`/`sm`...) que compita con esos 9 nombres semánticos ya usados por las 12 marcas reales.
Si necesitas registrar la escala numérica cruda observada en el sitio real (para calibrar,
distinta de los 9 valores semánticos que el pack ya declara), usa el campo nuevo
`spacing.webObserved`:

```json
"spacing": {
  "micro": "4px", "small": "8px", "medium": "16px", "large": "24px",
  "section": "64px", "hero": "96px", "close": "8px", "innerSection": "32px", "cta": "16px",
  "webObserved": {
    "scale": { "2xs": "4px", "xs": "8px", "sm": "12px", "md": "16px", "lg": "24px", "xl": "32px", "2xl": "48px", "3xl": "64px", "4xl": "96px" },
    "note": "escala cruda del sitio real, antes de mapearla a los 9 nombres semánticos de arriba",
    "source": "observado en {URL} el {fecha}"
  }
}
```

## Fase 05 — Alineaciones

Documenta la alineación dominante de titulares, párrafos, CTAs, imágenes (izquierda / centrada /
derecha / alterna / asimétrica / editorial), y cualquier corrección óptica visible (logo
ligeramente desplazado, texto que no sigue el eje exacto del contenedor). No confundas
alineación matemática con alineación óptica. Esto alimenta `layout.sectionStyle`
(`centrado`/`asimetrico`, ya existente en el pack) — si observas alternancia real entre ambas
según sección, documéntalo en `layout.grid`/`brandStructure`, no fuerces un único valor.

## Fase 06 — Sistema cromático

Ya cubierto en detalle por el contrato (§ color computado). Añade aquí: para cada color,
HEX + uso + frecuencia + contraste + `source` + nivel de confianza fino. Evalúa contraste real
(WCAG AA mínimo) para cada combinación texto/fondo y CTA — mismas combinaciones que
`scripts/check-contrast.ts` verificará después contra el pack final (ver ese script para la
lista exacta de combinaciones fijas que el motor usa: CTA sobre fondo de botón, cuerpo secundario
sobre blanco/sección lila, H1 hero sobre color primario, banda de cierre, footer). Diferencia
identidad estable de colores temporales de campaña.

## Fase 07 — Tipografía

Ya cubierto en detalle por el contrato (§ tipografía computada + sub-checklist de CTA
obligatorio, ver `typography.cta.{size,weight,letterSpacing}`). Verifica SIEMPRE si la fuente web
observada es segura para email (Arial/Helvetica/Georgia/Times/Verdana/Trebuchet/Courier); si no
lo es (Futura, Roboto, cualquier `@font-face`/Google Font), el pack usa el fallback system-safe en
`typography.family`/`typography.displayFont` y lo dice explícitamente. Registra también, si
existen y el motor las consume: `typography.webFont.family`/`.weights[]` (usado por
`buildFontFaceCSS()` en `engine/lib/assemble.js` — solo si la marca quiere intentar
`@font-face` real con fallback, no reemplaza el fallback system-safe).

## Fase 08 — Botones y CTAs

**No crear un árbol `components.button` nuevo.** El motor solo consume, hoy:
`components.cta.padding`, `components.cta.style`/`components.ctaSecondary.style` (silueta:
pastilla sólida/outline/text-link/block — ver `engine/components/INVENTORY.md`),
`typography.cta.{size,weight,letterSpacing}`, `radius.ctaPill`. Todo el análisis de botón se
mapea sobre esos campos exactos — el sub-checklist de 5 valores del contrato de 02 ES esta fase.
Estados hover/disabled observados en el sitio real son informativos únicamente (el email no
renderiza hover de forma fiable en la mayoría de clientes) — si se registran, van en
`components.cta.statesObserved` (nuevo, no consumido por el motor, solo documentación para
referencia de diseño futuro), nunca sustituyen los 5 valores estáticos que sí se usan.

## Fase 09 — Componentes (inventario del sitio real de la marca)

**No confundir con `engine/components/INVENTORY.md`** (catálogo de los componentes de EMAIL del
motor — cosa completamente distinta). Esta fase produce
`brands/{cliente}/guidelines/component-inventory.md`: catálogo de los componentes UI reales del
sitio de la marca (header, hero, tarjeta de producto, bloque de categorías, testimonial, footer,
etc.) con anatomía, variantes, dimensiones, espaciados, y — crítico — **qué componente del motor
lo traduce mejor** (columna "adaptación a newsletter" con el nombre exacto de
`engine/components/*.html`, o "sin traducción directa, ver `art-direction.md`" si no hay
equivalente).

## Fase 10 — Imágenes y dirección de arte

Ya cubierto por el contrato (§ tratamiento fotográfico, `photography.treatment`). Amplía en
`brands/{cliente}/guidelines/art-direction.md`: tipo de fotografía, encuadres, iluminación,
composición, tratamiento de color, patrones (producto aislado / lifestyle / editorial / full-bleed
/ split layout). Debe incluir instrucciones accionables y verificables para el prompt de
`npm run generate-hero-image` (ver `06-data-specialist.md` §"Generar el arte del hero") — no
adjetivos sueltos ("elegante", "premium") sino descripciones que un generador de imágenes pueda
usar literalmente.

## Fase 11 — Iconografía

Ya cubierto por el contrato (`iconography.style`/`.componentImplication`). Indica si cada patrón
gráfico puede reproducirse con CSS, requiere SVG, o debe usarse como `<img>` — decide directamente
si la campaña necesita la variante `-img` de un componente (`category-grid-img.html`,
`card-tarifa-3.html` vía `iconGlyph` vs. icono real) o la variante emoji/glifo.

## Fase 12 — Bordes, radios y sombras

Mapea sobre los campos ya consumidos: `radius.{card,cardStripe,ctaPill}`, `shadows.{card,cta}`.
Indica si la marca es diseño plano, tarjetas elevadas, bordes duros o esquinas redondeadas — esto
decide los valores numéricos, no crea campos nuevos.

## Fase 13 — Fondos, gradientes y superficies

Mapea sobre `surfaces.{global,sectionLila,white,...}` y `gradients.heroBackground` (ya existente,
opcional — ver nota del propio schema: "no es required, packs anteriores a esa fecha pueden no
tenerlo"). Cuando un efecto (textura, transparencia compleja) no sea seguro para email, documenta
la alternativa compatible en `brands/{cliente}/guidelines/email-adaptation.md`, no en el pack.

## Fase 14 — Responsive

Nuevo campo opcional del pack, `responsive` (informativo — las reglas responsive REALES del email
ya viven hardcodeadas y verificadas en el CSS bulletproof de cada componente del motor, esto es
solo contexto de cómo se comporta el sitio real de referencia):

```json
"responsive": {
  "breakpoints": { "tablet": "768px", "mobile": "480px" },
  "mobileBehavior": "apilado vertical, botones full-width, navegación colapsa a hamburguesa",
  "source": "observado en {URL} el {fecha}"
}
```

Documenta en `brands/{cliente}/guidelines/responsive.md` el detalle completo: qué patrones web
son inseguros para email (fondos con `background-image` fijo, animaciones, `position:sticky`) y
su alternativa — no copiar automáticamente comportamiento web inseguro para Outlook.

## Fase 15 — Extracción CSS

Produce `brands/{cliente}/styles/reference.css` (fiel al sitio original, para archivo/referencia
de diseño) y `brands/{cliente}/styles/email-safe.css` (solo patrones compatibles con Outlook/
Gmail/Apple Mail — tablas, estilos inline, sin `background-image` fijo salvo con fallback de
color sólido, sin `flexbox`/`grid` CSS). Clasifica cada regla: segura / parcialmente compatible /
no compatible / requiere fallback / requiere VML. Estos dos archivos son material de referencia
para 04/07 — el motor sigue generando el HTML real a partir de `engine/components/*.html`, estos
CSS no se inyectan directamente en ningún build.

## Fase 16 — Tokens de diseño

El entregable de primera clase sigue siendo `brands/{cliente}/tokens/brand-tokens.json` (ver
contrato de 02, estructura completa). Todo lo de las fases 01-15 se destila en ese archivo más
los 3 documentos de campaña (`02-analysis/visual-identity-report.md`,
`02-analysis/source-inventory.md`, `02-analysis/open-questions.md`) y los 5 documentos/CSS de
marca (`brands/{cliente}/styles/{reference,email-safe}.css`,
`brands/{cliente}/guidelines/{component-inventory,responsive,email-adaptation,art-direction}.md`
— nota: `component-inventory.md` vive junto a las guías, no en una carpeta `components/` propia,
para no sugerir que compite con `engine/components/INVENTORY.md`).

## Fase 17 — Reglas de replicación (handoff)

Cierra `02-analysis/visual-identity-report.md` con: qué debe hacerse siempre (patrones de
composición, jerarquía, tratamiento de imagen confirmados), qué debe evitarse (colores no
autorizados, radios/sombras ajenas, densidad excesiva), y grado de libertad (qué puede adaptarse
libremente a email vs. qué debe conservarse con máxima fidelidad). Ver `agents/
02-brand-visual-analyst.md` §"Entrega a" para el handoff formal a 03.

## Adaptación específica a newsletter — checklist final

Para cada patrón web relevante documentado en `email-adaptation.md`: (1) comportamiento original,
(2) riesgo en email, (3) adaptación recomendada, (4) estructura/CSS compatible, (5) fallback para
Outlook. Considera siempre: 600px de ancho base, tablas (no flexbox/grid), estilos inline, sin
`background-image` sin fallback sólido, fuentes web-safe con fallback explícito, botones
bulletproof (VML si aplica), modo oscuro, peso total (`engine/lib/verify.js`: error ≥90KB, aviso
≥80KB del inline).

## Criterio de finalización

No des por completo el análisis hasta haber: revisado todas las fuentes disponibles, extraído
color/tipografía/CTA computados, documentado estructura y `brandStructure`, medido espaciados,
identificado alineaciones, analizado componentes reales, reconstruido el CSS relevante en ambas
versiones (referencia y email-safe), generado/actualizado `brand-tokens.json`, clasificado cada
hallazgo por nivel de confianza, documentado incertidumbres en `open-questions.md`, y preparado el
handoff a 03. El objetivo no es una aproximación visual — es una especificación técnica completa
que permita replicar la identidad de la marca con la máxima fidelidad posible dentro del sistema
de newsletters de Hermes.
