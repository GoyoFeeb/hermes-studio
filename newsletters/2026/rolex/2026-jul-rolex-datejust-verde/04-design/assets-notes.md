# Assets Notes — Rolex Datejust "Una fecha para recordar"

## Assets necesarios

| Asset | Estado | Especificaciones | Responsable |
|-------|--------|-----------------|-------------|
| Logo Rolex (corona, PNG/SVG) | 🔴 **Pendiente** | Ancho 90px, altura proporcional ~32px. Dorado/negro sobre fondo transparente. SVG inline en el header real (no CDN localizable esta ronda) — Q-004 | Usuario/cliente |
| Hero banner (generado) | 🔴 **Pendiente de generación** | 1200×760 → 600×380px. PNG sin texto (arte + tratamiento fotográfico Rolex). Lo genera 06 vía `npm run generate-hero-image` | 06 / usuario (sandbox sin salida de red, ver `06-data/campaign-data.json` notas) |
| Subida al CDN del hero | 🔴 **Pendiente de confirmación del usuario** | URL final tipo `https://feebbodigital.com/creativities-library/rolex/hero-banner.png` | Usuario |

## Variante de icono por módulo (decisión de 04, con motivo)

| Módulo | Campo de icono | Variante elegida | Motivo |
|---|---|---|---|
| `columns-3-beneficios-sin-icono` | `items[].icon` (ausente en esta variante) | **Sin icono** | `iconography.style: "none"` en el pack — el sitio real de Rolex no usa NINGÚN icono de contenido, ni siquiera de línea. Usar `iconGlyph`/emoji o la variante `-img` habría contradicho una observación directa, no una inferencia |

Ningún otro módulo de esta campaña tiene campo de icono (`header-logo`, `hero-imagen`, `intro-cta-asimetrico` y `banda-cierre-asimetrico` no lo llevan en su contrato de datos).

## Especificación del prompt de fotografía (para `hero.bannerSrc`)

Trazado directamente desde `photography.treatment` del pack — no una descripción genérica de "reloj sobre fondo blanco":

- **Sujeto:** Rolex Datejust, esfera verde oliva, caja y brazalete Jubilee en acero Oystersteel y oro Everose (bicolor plata/oro rosado).
- **Encuadre:** macro/producto, el reloj ocupa la mayoría del encuadre, ángulo ligeramente lateral que muestra el perfil del bisel estriado.
- **Luz:** una única fuente direccional dura, sombra diagonal larga y suave proyectada sobre la superficie.
- **Fondo:** superficie neutra gris-azulada/blanca, nunca blanco plano de estudio genérico.
- **Profundidad de campo:** muy reducida — bisel/esfera en foco nítido, el resto se desvanece en desenfoque suave.
- **Prohibido explícitamente:** ilustración, estilo editorial plano, screen-print/riso, personas, contexto lifestyle, fondo blanco infinito sin sombra.
- **Fuente de anclaje:** `https://www.rolex.com/es/watches/datejust` (mismo mecanismo `--source landing --url` ya usado en Worn Wear/Nike/BMW).

## Especificaciones técnicas

- **Formato:** PNG para el hero, PNG/SVG para el logo.
- **Dimensiones hero:** 600×380px en email (1200×760 nativo para retina).
- **Modo de color:** RGB.
- **Fondo:** transparente para el logo; el arte del hero lleva su propio fondo (gris-azulado, parte del tratamiento fotográfico).
- **Alt text:** siempre descriptivo, nunca vacío (ver `hero.bannerAlt` en `04-design/desktop-spec.md`).

## Assets NO necesarios

- Iconos para beneficios: `iconography.style: "none"` — cero dependencia de CDN para iconos en este pack, a diferencia de BMW/Nike que sí usan emoji como fallback.
- Pattern tile de header: Rolex no usa patrones de fondo decorativos (fondo plano blanco en header, `assets.headerPatternTile` queda vacío).
- Grid de variantes del modelo (`category-grid`): omitido deliberadamente por 03 — no hay fotografía real por variante disponible sin fabricar assets, ver `03-strategy/module-selection.md`.
