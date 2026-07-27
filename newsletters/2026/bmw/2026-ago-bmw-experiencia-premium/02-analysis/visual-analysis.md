# Visual Analysis — BMW Experiencia Premium

## Paleta de color aplicada (brand pack v2.3.1)

| Token | Valor | Uso en componentes |
|-------|-------|-------------------|
| `colors.primary` | `#000000` | Texto principal, header |
| `colors.ctaBackground` | `#1C69D4` | Botón CTA |
| `colors.ctaText` | `#FFFFFF` | Texto del botón CTA |
| `colors.white` | `#FFFFFF` | Fondos de sección, tarjetas |
| `colors.lightBg` | `#F4F4F4` | Fondos alternos |
| `colors.textBody` | `#262626` | Texto de cuerpo |
| `colors.textSecondary` | `#6F6F6F` | Texto secundario, footer |
| `colors.darkBg` | `#262626` | Fondos oscuros |
| `colors.border` | `#D2D2D7` | Bordes de tarjetas y footer |

## Tipografía

| Contexto | Fuente | Tamaño | Peso | Color |
|----------|--------|--------|------|-------|
| Hero H1 | Titillium Web (display) / Arial, Helvetica, sans-serif | 32px / 26px mobile | 300 (light) | `#FFFFFF` |
| Hero subtitle | Titillium Web / Arial, Helvetica, sans-serif | 16px / 14px mobile | 400 (regular) | `#FFFFFF` |
| Section H2 | Titillium Web / Arial, Helvetica, sans-serif | 22px | 600 (semibold) | `#000000` |
| Card H3 | Titillium Web / Arial, Helvetica, sans-serif | 16px | 600 (semibold) | `#000000` |
| Body large | Arial, Helvetica, sans-serif | 16px | 400 | `#262626` |
| Body | Arial, Helvetica, sans-serif | 14px | 400 | `#262626` |
| CTA label | Arial, Helvetica, sans-serif | 15px | 500 (medium) | `#FFFFFF` |
| Footer legal | Arial, Helvetica, sans-serif | 11px | 400 | `#6F6F6F` |

## Botones (CTA)

| Propiedad | Valor | Fuente |
|-----------|-------|--------|
| Background | `#1C69D4` | getComputedStyle observado |
| Text color | `#FFFFFF` | getComputedStyle observado |
| Font size | 15px | getComputedStyle observado |
| Font weight | 500 | getComputedStyle observado |
| Letter spacing | 0.5px | getComputedStyle observado |
| Border radius | 3px | getComputedStyle observado |
| Padding | 12px 28px | getComputedStyle observado |
| Silhouette | `pill` (default — botón sólido con radio 3px) | Observado en bmw.es |
| VML | ✅ Activado (`components.cta.vml: true`) | Compatibilidad Outlook |

## Composición

| Aspecto | Especificación |
|---------|---------------|
| Ancho máximo | 600px |
| Estilo de sección | `centrado` — diseño editorial limpio, centrado |
| Ritmo visual | Fotografía → texto → fotografía/bloque informativo → CTA |
| Espaciado de sección | 40px |
| Espaciado interno | 28px 20px |
| Hero padding | 48px |
| CTA padding | 20px 0 |

## Fotografía

| Aspecto | Especificación |
|---------|---------------|
| Tipo | Fotografía real de alta calidad |
| Tratamiento | Luz natural dramática, saturación natural, composición regla de tercios, motion blur en fondos |
| Peso visual | Dominante — la fotografía lleva el peso de la comunicación |
| Hero | `hero-imagen` — banner sin texto, sin logotipo, sin claims |

## Componentes del motor aplicables

| Componente | Variante | Razón |
|------------|----------|-------|
| header-logo | default | Logo BMW (pendiente de capturar) |
| hero-imagen | default | Hero con banner generado + texto HTML |
| intro-cta | default | Bloque editorial fotografía+texto |
| columns-3-beneficios | `-sin-icono` | BMW usa iconDensity: nula — no usa iconos decorativos |
| banda-cierre | default | Cierre con CTA principal |
| footer | default | Legal, unsubscribe, branding |
