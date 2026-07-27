# Email Compatibility Rules

- Ancho máximo: 600px
- Outlook: bulletproof buttons, VML, conditional MSO comments
- Fuentes: web-safe + fallbacks
- Responsive: media queries para mobile
- addVmlToButtons en export-html.tsx solo detecta CTAs con background-color:#FF5A3C y border-radius:30px (los de Para y Compara) — no es agnóstico de marca. Para reutilizar este script con otro color de CTA hay que actualizar el patrón de detección a mano.
- **VML bulletproof confirmado en reconciliación v5-premium:** el CTA bulletproof correcto usa VML con `width:280px` (no 100%), `<a>` con `display:block` (no `inline-block`), y `mso-line-height-rule:exactly` en los textos que contienen. Ver `final-premium.html` líneas 114-141 para el patrón exacto. Para móvil, el CTA se expande a ancho completo vía la clase `mobile-full`.
