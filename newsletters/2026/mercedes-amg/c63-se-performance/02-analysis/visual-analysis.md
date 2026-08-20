# Visual Analysis — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 02 (Brand Visual Analyst). Fecha: 2026-08-20. Fuente de observación:
> https://www.mercedes-amg.com/en/c-class-sedan (navegación real + getComputedStyle) y el
> brand pack v2.3.0.

## 1. Paleta

| Rol | Hex | Origen |
|---|---|---|
| Primario / deep | #000000 | OBSERVADO (body del sitio: rgb(0,0,0)) |
| Rojo AMG (acento + CTA) | #B21E23 | OBSERVADO (rgb(178,30,35) en CTA y CSS, 67 apariciones en v2.2.0) |
| Hover rojo | #D8383D | OBSERVADO (v2.2.0) |
| Texto cuerpo | #4F4F4F | OBSERVADO (v2.2.0; en el sitio el cuerpo es blanco sobre negro — el gris del pack es para email sobre fondo claro) |
| Texto secundario | #9F9F9F | OBSERVADO (v2.2.0) |
| Blanco | #FFFFFF | OBSERVADO |
| Superficie oscura alt | #1A1A1A | OBSERVADO (v2.2.0) |
| Superficie global / sectionLila | #F2F2F2 | INFERIDO (v2.2.0; gris neutro de soporte para el lienzo exterior — el sitio no expone un gris de página equivalente) |
| Borde tarjeta/footer | #DDDDDD | INFERIDO (v2.2.0) |

Regla de uso (v2.2.0, mustAvoid): el rojo es el ÚNICO acento cromático; la pieza es
mayoritariamente negra con el coche como acento. Sin degradados decorativos sobre negro.

## 2. Tipografía

- Familias reales del sitio: `MBCorpoSText_Regular_Web` (cuerpo), `MBCorpoSTitle_*_Web`
  (titulares) — propietarias, NO email-safe, no embebibles.
- Fallback email-safe del pack: **Helvetica Neue / Helvetica / Arial** (neo-grotesca de caja
  estrecha; deliberadamente sin serif). Sin webFont (no se sustituye por una Google Font
  «parecida» — decisión documentada v2.2.0).
- Jerarquía tokenizada: h1 34/800 lh 1.08; h2 24/800; h3 17/700; body 16/400 lh 1.5 (corregido
  en v2.3.0); eyebrow 11/700 ls 2px uppercase; CTA 16/500 ls 0.5px (corregido en v2.3.0).
- Observación del sitio: titulares en mayúsculas (`text-transform: uppercase`) — coherente con
  la voz de marca; CTA en caja normal (NO uppercase) — el motor lo respeta (no aplica
  transform al CTA).

## 3. Composición y ritmo (página real)

- Hero: fotografía a sangre con titular + CTA integrados sobre la imagen (el brandStructure
  documenta que el hero del sitio NO es banda de color + foto encima; el motor `hero-imagen`
  pone el banner en su fila y el copy debajo — aceptado como traducción del patrón, la variante
  «a sangre» quedó documentada como pendiente para el motor en v2.2.0).
- 4 bloques editoriales repetidos (eyebrow + titular + 1 párrafo + foto) — la traducción honesta
  es UNA aparición de editorial-foto-texto en el email (el brief prohíbe repetir la misma
  composición; dos bloques en espejo foto-izq/foto-der es el máximo permitido y el que se usa).
- Sección oscura inmersiva (AMGFORCE S+ / cita) → traducible como escena oscura (banda-cierre
  del email, fondo #1A1A1A/#000000).
- El «Model overview» de cifras (500 kW / 1.020 Nm / 3,4 s / 280 km/h) existe en la web pero se
  decide NO traducirlo como tira de datos (prohibido por el brief y por mustAvoid del pack).
- `compositionProfile`: premium, densidad baja, alineación centrada.

## 4. Fotografía

- `photography.treatment` (v2.2.0): real, cinematográfica, oscura, alto contraste, negros
  profundos, reflejos especulares duros, el coche a sangre saliéndose del encuadre, desaturada
  hacia gris/negro con la carrocería como único acento.
- **Assets de la campaña (CDN oficial de la marca, imgix) — verificados HTTP 200 el 2026-08-20:**

| Escena | Imagen | URL con `?fm=jpg` |
|---|---|---|
| 1 hero | 21dfb48ef6fbbece446b2dfa183b6af940dba924 (1440×810) | `.../21dfb48e…-1440x810.jpg?fm=jpg&w=1200` (JPEG 149 KB) |
| 2 tren motriz | d3ff0fcc72190d9fd736095c52fbeaa786e49c5d (1440×1440) | `.../d3ff0fcc…-1440x1440.jpg?fm=jpg&w=700` (JPEG 98 KB) |
| 3 batería | 9be0cde698a14c7ee2039dfec4b8391d98ff6c54 (1440×1440) | `.../9be0cde6…-1440x1440.jpg?fm=jpg&w=700` (JPEG 81 KB) |

⚠️ Con `?auto=format` el CDN negocia webp según el cliente (verificado: 200 image/webp). El
motor/email debe pedir SIEMPRE `?fm=jpg`. Las imágenes 1440×1440 de las escenas 2-3 son
cuadradas: el agente 04 decidirá recorte (imgix `&fit=crop&w=&h=`) o presentación con altura
ajustada al contenedor email (máx. ~460px útiles en columna editorial 46%).

## 5. CTA (verificado, no inferido)

- Estilo: **bloque de esquina recta** (border-radius 0), rojo #B21E23, texto blanco, 16/500,
  letter-spacing 0.5px, sin mayúsculas, borde 1px del mismo rojo (invisible).
- El motor tiene la silueta `cta-block-bulletproof` (bloque sólido radio 0 fijo) activada con
  `components.cta.style: "block"`. El pack NO declara `components.cta.style` (v2.2.0 no se
  atrevió sin evidencia; ahora la hay: radius 0 observado). **Decisión:** el agente 04/07 debe
  activar `components.cta.style: "block"` en el campaign-data/build de esta campaña — o
  documentar el fallback a la píldora con `radius.ctaPill: 0` (radio 0 produce el mismo
  resultado visual en la mayoría de clientes; la diferencia real es el `arcsize` del VML:
  block = 0%, píldora con radio 0 = 0% igualmente). ⚠️ Bug conocido: `cta-secondary-bulletproof`
  tiene `arcsize="50%"` hardcodeado — en Outlook el CTA secundario saldría pastilla; en esta
  campaña los CTAs de editorial usan el secundario → verificar en QA/Outlook (agente 08).

## 6. Logo

- Lockup oficial: `https://www.mercedes-amg.com/amg-logo.svg` (estrella + MERCEDES-AMG, fill
  #fff, 294×69, HTTP 200 verificado en esta sesión). Confirmado como el logo real que usa el
  header del sitio (`<img alt="logo" src="https://www.mercedes-amg.com/amg-logo.svg">`,
  186×50 renderizado).
- Email: SVG no renderiza en Gmail/Outlook clásico → usar el raster del pack
  `brands/mercedes-amg/design-input/logo-mercedes-amg-white-588.png` (588×138, densidad 600),
  o el SVG local si el cliente sube un PNG a su CDN (Q-005/PENDIENTE).
- NUNCA reconstruir con texto/CSS (mustAvoid del pack).

## 7. Dark mode

- `darkMode.status: not-implemented`; metas color-scheme forzadas a light. La pieza ya es
  mayoritariamente negra por identidad → riesgo de inversión agresiva bajo.

## 8. Enlaces oficiales de CTA

| CTA | URL | Verificado |
|---|---|---|
| Descubrir (hero) | https://www.mercedes-benz.es/passengercars/models/saloon/c-class/amg.html | 200 (extracción parcial — antibots; enlace válido) |
| Contextuales (editorial) | https://www.mercedes-amg.com/en/c-class-sedan | 200 |
| Configurar (cierre) | http://amg4.me/configure_c63se_sedan | 200 sin redirect |

UTM: convención del pack `utm_source=newsletter&utm_medium=email&utm_campaign={campaignName}&utm_content={modulo}`.
