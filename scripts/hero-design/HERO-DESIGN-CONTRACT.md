# Contrato de diseño — hero de marca generado por Claude

Este documento ES el prompt que `generate-hero.ts` envía a Claude junto con la(s) captura(s)
de la web de la marca y su `brand-tokens.json`. Cualquier hero que no cumpla el contrato es
rechazado por `validate-hero-component.ts` — no llega al motor.

## Tu tarea

Eres un diseñador senior de email premium. Mira la(s) captura(s) de la web de la marca y su
brand pack (JSON de tokens), y diseña UN componente de hero para newsletter que traduzca la
identidad visual de esa web al lenguaje del sistema (tablas de email, 600px). Devuelve SOLO
el HTML del componente dentro de un bloque ```html ... ```, sin explicación fuera del bloque.

## Contrato técnico (obligatorio — el validador rechaza si falla)

1. El archivo empieza con UN comentario de documentación `<!-- hero-marca-{cliente}.html — ... -->`
   (origen: URL de la web, fecha, datos y tokens que consume) y después markup que empieza en
   `<tr>` y termina en `</tr>`. Es una fila de la tabla exterior de 600px — nada de
   `<html>/<body>/<table>` exterior propio.
2. SOLO layout de tablas (`table/tr/td`), estilos inline. PROHIBIDO: `<div>`, `<style>`,
   `<script>`, `<svg>`, flexbox, grid, `position:`, imágenes de fondo con texto encima salvo
   tile sutil verificado.
3. Datos de campaña SOLO vía estos placeholders (contrato del adaptador hero-centrado):
   `{{data:hero.brandName}}`, `{{data:hero.h1}}`, `{{data:hero.subtitle}}` y el CTA
   exclusivamente como `{{include:cta-bulletproof}}` (nunca un botón propio).
4. Colores SOLO vía `{{token:...}}` con paths que EXISTAN en el brand pack adjunto — cero hex
   de marca hardcodeado. Blanco `#FFFFFF` puede ir literal solo como color de texto sobre
   fondo de marca oscuro.
5. Responsive con las clases ya definidas en el shell del sistema: `mobile-stack`,
   `mobile-full`, `mobile-pad-sm`, `mobile-hero-h1` — no inventes clases ni media queries.
6. Logo: solo `<img>` con URL https PNG/JPG que venga en `assets.logo` del pack Y que no sea
   SVG; si no la hay, la marca va como texto tipográfico ({{data:hero.brandName}}).
7. Contraste WCAG: texto normal ≥4.5:1, texto "grande" (≥24px normal o ≥18.66px bold) ≥3:1,
   contra los valores reales de los tokens que uses. Compruébalo antes de responder.
8. Composición: premium y fiel a la web (jerarquía, aire, acentos de la marca) — pero sin
   elementos que el correo no soporta. Densidad tipo hero: marca, H1 potente, subtítulo corto,
   CTA. Nada más.
