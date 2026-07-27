# Brand Visual Analysis — BMW M4

## Resumen

Análisis de identidad visual de BMW para la campaña del M4 Competition Coupé. El brand pack existente (`brands/bmw/tokens/brand-tokens.json` v2.3.1) es la fuente de verdad operativa. Proviene de observación real con getComputedStyle sobre bmw.es (2026-07-24). Se documentan discrepancias entre la guía visual del usuario y el brand pack real.

## Discrepancias documentadas

| Aspecto | Solicitado por usuario | Brand pack real (v2.3.1) | Decisión |
|---|---|---|---|
| 🔴 Azul BMW | `#0066B1` | `#1C69D4` (ctaBackground) | **Prevalece brand pack.** `#0066B1` fue rechazado explícitamente en el changelog como "inventado" del incidente anterior (v2.2.0). |
| Color negro | `#111111` | `#000000` (primary) | 🟡 Diferencia menor, prevalece pack |
| Gris oscuro | `#3A3A3A` | `#262626` (darkBg, textBody) | 🟡 Prevalece pack |
| Gris medio | `#6D6D6D` | `#6F6F6F` (textSecondary) | 🟡 Diferencia menor, prevalece pack |
| Gris claro | `#E6E6E6` | — | 🟡 Pack no tiene este tono exacto |
| Gris apoyo | `#F7F7F7` | `#F4F4F4` (lightBg, sectionLila) | 🟡 Prevalece pack |
| Tipografía | BMW Type Next / Helvetica Neue → Helvetica → Arial | Titillium Web (sustituto de BMW TypeNext para email) + Arial | 🟡 Prevalece pack. Titillium Web es un sans geométrico con el mismo carácter que BMW TypeNext |
| Pesos tipografía | 300, 400, 500 (sin bold) | 300, 400, 700 (700 para cabeceras y énfasis) | 🟡 Prevalece pack — el bold (700) es necesario para jerarquía en email |
| Hero H1 tamaño | 60–72 px | 32 px (hero.h1.size) | 🟡 Prevalece pack. El email tiene 600 px de ancho → 60-72 px no es viable |
| Títulos sección | 42–48 px | 22 px (h2Section.size) | 🟡 Prevalece pack |
| Subtítulos | 30–34 px | 16 px (hero.subtitle.size) | 🟡 Prevalece pack |
| Texto cuerpo | 18–20 px | 14-16 px (body.normal/large) | 🟡 Prevalece pack |
| Botón border-radius | 0 px (recto) | 3 px (radius.ctaPill: 3) | 🟡 Prevalece pack |
| Botón padding | amplio | 12 px 28 px (components.cta.padding) | 🟡 Prevalece pack |
| Tarjetas border-radius | 0 px o bordes muy discretos | 0 px (radius.card: 0) | ✅ Coincide |
| Tarjetas sombras | sin sombras | "none" (shadows.card: "none") | ✅ Coincide |
| Layout | centrado, max 1320 px adaptado | centrado, max 600 px (emailWidth) | ✅ Coincide para email |
| Espaciado | escala múltiplo de 8 | Parcial: 4, 8, 16, 24, 40, 48 | 🟡 Coincide parcialmente |

## Color azul BMW: por qué prevalece #1C69D4

El changelog del brand pack (v2.2.0) documenta:
"Colores y tipografía COMPUTADOS con getComputedStyle sobre https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html."
"**NOTA**: el brand-tokens.json previo (del incidente 2026-07-24) fue puesto en cuarentena por no estar verificado: contenía colores inventados (#0066B1) y notas falsas."

El CTA #1C69D4 se observó del botón real "Configuración y precio" (clase css cmp-button) en bmw.es.

## Tokens clave usados

| Token | Valor | Uso |
|---|---|---|
| colors.primary | #000000 | Fondos oscuros, texto hero |
| colors.ctaBackground | #1C69D4 | Botón CTA principal |
| colors.ctaText | #FFFFFF | Texto sobre botón CTA |
| colors.textBody | #262626 | Cuerpo de texto |
| colors.textSecondary | #6F6F6F | Texto secundario |
| colors.lightBg / surfaces.sectionLila | #F4F4F4 | Fondo sección beneficios |
| typography.displayFont | 'Titillium Web', Arial, Helvetica, sans-serif | Títulos |
| typography.hero.h1 | 32 px, weight 300, #FFFFFF | Hero H1 |
| radius.ctaPill | 3 | Border-radius del CTA |
| shadows.card | "none" | Sin sombras en tarjetas |
