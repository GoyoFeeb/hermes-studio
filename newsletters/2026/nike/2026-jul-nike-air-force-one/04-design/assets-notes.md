# Assets Notes — Nike Air Force One

## Logo

| Asset | Detalle |
|---|---|
| Archivo | brands/nike/design-input/logo-nike-email.png |
| Formato | PNG (160×56px original, render a 120×42px en email) |
| Procedencia | SVG capturado de nike.com (nav principal, clase swoosh-svg) el 2026-07-29 |
| Alt text | "Nike" |
| **Regla** | Este PNG es el único logo válido. Ningún módulo puede reconstruir "Nike" con tipografía + CSS a modo de logotipo. Es un defecto de marca, no una variante de diseño. |

## Hero image

| Asset | Detalle |
|---|---|
| Tipo | Generación AI (vía generate-hero-image o alternativa) |
| Prompt base | Nike Air Force 1 '07 con tratamiento fotográfico Nike: fondo blanco infinito, perfil lateral, iluminación high-key, zapatilla aislada centrada, silueta chunky, cuero blanco, swoosh visible. Sin texto en la imagen. |
| Output | brands/nike/design-input/hero-banner.png → compressed JPG |
| En email | 600×350px (desktop), 100% auto (mobile) |
| Alt text | "Nike Air Force 1 '07" |

## Editorial image

| Asset | Detalle |
|---|---|
| Tipo | Generación AI o asset oficial |
| Prompt base | Detalle del Nike Air Force 1 '07: primer plano del upper de cuero blanco, textura del material, costuras visibles, swoosh lateral. Estilo fotografía de producto Nike. |
| Output | brands/nike/design-input/editorial-af1-detail.png |
| En email | 276×276px (desktop, columna 46%), 100% mobile stack |
| Alt text | "Detalle del upper de cuero del Air Force 1" |

## Slots de CTA (cada uno debe tener copy distinto)

| Módulo | Slot | Propósito | Tipo de CTA |
|---|---|---|---|
| hero-imagen | CTA 1 | Descubrimiento / "Saber más" | Pill principal (#111111 bg, #FFFFFF text) |
| editorial-foto-texto | CTA 2 | Contextual / "Ver detalle" | Text link (#111111, subrayado o flecha) |
| banda-cierre | CTA 3 | Compra / "Explorar colores" | Pill principal (#111111 bg, #FFFFFF text) |

Los CTAs 1, 2 y 3 deben tener copy distinto. No reutilizar el mismo string en dos slots.

## Slots de texto con cifras (formato frase, no ficha)

| Módulo | Dato | Formato del slot |
|---|---|---|
| intro-cta | 1982 (año de lanzamiento) | Frase: "Lanzado en 1982..." (no "1982" como número suelto) |
| intro-cta | Tecnología Nike Air | Frase: "...como la primera zapatilla con tecnología Nike Air" |
| columns-3 | Materiales | Frase con verbo: "Upper de cuero que..." (no "Cuero: premium") |
