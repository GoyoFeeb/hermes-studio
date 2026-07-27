# Visual QA — BMW Newsletter "Diseñado para emocionar"

> Campaña: BMW — "Diseñado para emocionar"
> Fecha QA: Julio 2026
> Responsable: [NOMBRE]
> Estado: ⬜ Pendiente / ✅ Aprobado / ❌ Rechazado

---

## Checklist de validación visual y funcional

### 1. ESTRUCTURA GENERAL

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 1.1 | Doctype | `<!DOCTYPE html>` con XHTML namespace | ⬜ | |
| 1.2 | Responsive meta | `meta name="viewport"` presente | ⬜ | |
| 1.3 | Apple meta | `x-apple-disable-message-reformatting` presente | ⬜ | |
| 1.4 | Format detection | `telephone=no,address=no,date=no,url=no` | ⬜ | |
| 1.5 | Width | Max-width 600px, centrado | ⬜ | |
| 1.6 | Table layout | Tablas anidadas con `role="presentation"` | ⬜ | |
| 1.7 | Sin JS | Sin JavaScript de ningún tipo | ⬜ | |
| 1.8 | Sin CSS externo | Sin hojas de estilo externas | ⬜ | |

### 2. PREHEADER

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 2.1 | Visible en código | Preheader `<div>` presente | ⬜ | |
| 2.2 | Oculto visualmente | `display:none; mso-hide:all; opacity:0;` | ⬜ | |
| 2.3 | Texto gancho | "Descubre una nueva forma de disfrutar cada trayecto. BMW — Diseñado para emocionar." | ⬜ | |
| 2.4 | Sin caracteres rotos | Sin caracteres especiales visibles en preheader | ⬜ | |

### 3. HEADER

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 3.1 | Logo BMW | Presente, placeholder reemplazable | ⬜ | |
| 3.2 | Dimensiones logo | 60×60px con width/height explícitos | ⬜ | |
| 3.3 | Alt text | Alt descriptivo en logo | ⬜ | |
| 3.4 | Padding | 24px arriba, 12px abajo | ⬜ | |
| 3.5 | Fondo | Blanco (#FFFFFF) | ⬜ | |

### 4. HERO

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 4.1 | Imagen hero | Full-width (600px), display:block | ⬜ | |
| 4.2 | Dimensiones hero | 600×350px en newsletter (original 1200×700) | ⬜ | |
| 4.3 | Alt text hero | Alt descriptivo | ⬜ | |
| 4.4 | H1 hero | 44px, #000000, bold, editorial | ⬜ | |
| 4.5 | Subtítulo hero | 18px, #6F6F6F, regular weight | ⬜ | |
| 4.6 | CTA hero | "Descubre tu BMW" — azul #0066B1 rectangular | ⬜ | |
| 4.7 | Espaciado hero | 40px arriba del texto | ⬜ | |
| 4.8 | Sin bordes tarjeta | Cero bordes de tarjeta o sombras en hero | ⬜ | |
| 4.9 | Sin barras acento | Cero kicker rules o accent stripes | ⬜ | |

### 5. INTRO

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 5.1 | H2 intro | 28px, #000000, bold | ⬜ | |
| 5.2 | Texto intro | 16px, #262626, regular | ⬜ | |
| 5.3 | Fondo intro | Blanco (#FFFFFF) | ⬜ | |
| 5.4 | Texto correcto | "El placer de conducir, llevado más lejos." | ⬜ | |
| 5.5 | Párrafo cuerpo | 5 líneas de copy editorial presente | ⬜ | |

### 6. MODELOS (3 columnas)

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 6.1 | 3 columnas | Serie 1, X1, i4 en columnas iguales | ⬜ | |
| 6.2 | Imágenes modelos | 180×135px cada una | ⬜ | |
| 6.3 | Nombres modelos | H3: 18px, #000000, bold | ⬜ | |
| 6.4 | Descripciones modelos | 14px, #6F6F6F | ⬜ | |
| 6.5 | Alt text modelos | Alt descriptivo por modelo | ⬜ | |
| 6.6 | Sin bordes tarjeta | Cero bordes, sombras o fondos de tarjeta | ⬜ | |
| 6.7 | Espaciado entre modelos | 24px padding entre columnas | ⬜ | |
| 6.8 | Serie 1 texto | "Carácter deportivo para el día a día." | ⬜ | |
| 6.9 | X1 texto | "Versatilidad, presencia y tecnología." | ⬜ | |
| 6.10 | i4 texto | "Dinamismo eléctrico sin renunciar a la emoción." | ⬜ | |

### 7. TECNOLOGÍA

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 7.1 | Fondo sección | #F4F4F4 (light gray) | ⬜ | |
| 7.2 | Título tecnología | "Tecnología que se anticipa a ti." | ⬜ | |
| 7.2 | H2 tecnología | 28px, #000000, bold | ⬜ | |
| 7.3 | 3 atributos | Curved Display, Asistencia, ConnectedDrive | ⬜ | |
| 7.4 | Iconos | 60×60px, tono azul #0066B1 | ⬜ | |
| 7.5 | Alt text iconos | Alt descriptivo por icono | ⬜ | |
| 7.6 | Subtítulos atributos | 16px, #000000, bold | ⬜ | |
| 7.7 | Descripciones atributos | 14px, #6F6F6F | ⬜ | |
| 7.8 | Sin bordes tarjeta | Cero bordes o sombras en atributos | ⬜ | |
| 7.9 | Espaciado | 32px padding entre columnas de atributos | ⬜ | |

### 8. ELECTRIFICADO (fondo oscuro)

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 8.1 | Imagen electrificado | 600×300px, display:block | ⬜ | |
| 8.2 | Fondo sección | #262626 (dark gray) | ⬜ | |
| 8.3 | Título | "Conduce el futuro." en 32px, #FFFFFF | ⬜ | |
| 8.4 | Subtítulo | 16px, #CCCCCC | ⬜ | |
| 8.5 | CTA | "Explora BMW eléctricos" — azul #0066B1 rectangular | ⬜ | |
| 8.6 | Espaciado | 40px arriba, 48px abajo del contenido | ⬜ | |
| 8.7 | Contraste texto/fondo | Suficiente (blanco sobre #262626) | ⬜ | |
| 8.8 | Sin bordes | Cero bordes decorativos | ⬜ | |

### 9. TEST DRIVE

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 9.1 | H2 | 28px, #000000, bold | ⬜ | |
| 9.2 | Texto | "Hay sensaciones que no se pueden explicar." | ⬜ | |
| 9.3 | Párrafo cuerpo | 16px, #6F6F6F, explicativo | ⬜ | |
| 9.4 | CTA | "Solicita una prueba" — azul #0066B1 rectangular | ⬜ | |
| 9.5 | Fondo | Blanco (#FFFFFF) | ⬜ | |

### 10. BOTONES CTA

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 10.1 | VML bulletproof | `v:roundrect` presente para Outlook | ⬜ | |
| 10.2 | Fallback HTML | `<a>` con inline styles presente | ⬜ | |
| 10.3 | Color CTA | Fondo #0066B1, texto #FFFFFF | ⬜ | |
| 10.4 | Border-radius | 2px (rectangular, no pill) | ⬜ | |
| 10.5 | Font-size | 15px | ⬜ | |
| 10.6 | Font-weight | 700 (bold) | ⬜ | |
| 10.7 | Padding | 14px 36px | ⬜ | |
| 10.8 | Número de CTAs | 3: "Descubre tu BMW", "Explora BMW eléctricos", "Solicita una prueba" | ⬜ | |
| 10.9 | arcsize VML | 4% para botones ligeramente rectangulares | ⬜ | |
| 10.10 | Hover state | `:hover` presente en @media screen | ⬜ | |

### 11. FOOTER

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 11.1 | Fondo | #F4F4F4 (light grey) | ⬜ | |
| 11.2 | Logo pequeño | 24×24px, gris (#6F6F6F) | ⬜ | |
| 11.3 | Copyright | Presente con [COMPANY_NAME] placeholder | ⬜ | |
| 11.4 | Dirección | "[DIRECCIÓN_COMPLETA]" placeholder | ⬜ | |
| 11.5 | Texto suscripción | Explica por qué reciben el email | ⬜ | |
| 11.6 | Unsubscribe | Enlace con href="[UNSUBSCRIBE_LINK]" | ⬜ | |
| 11.7 | Privacidad | Enlace con href="[PRIVACY_URL]" | ⬜ | |
| 11.8 | Términos | Enlace con href="[TERMS_URL]" | ⬜ | |
| 11.9 | Disclaimer | Texto en 10px sobre placeholders | ⬜ | |
| 11.10 | Color texto footer | #6F6F6F en todos los textos | ⬜ | |

### 12. TIPOGRAFÍA

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 12.1 | Font stack | `Arial, Helvetica, sans-serif` | ⬜ | |
| 12.2 | H1 hero | 44px, bold, #000000, tracking negativo | ⬜ | |
| 12.3 | H2 secciones | 28px, bold, #000000 | ⬜ | |
| 12.4 | H2 electrificado | 32px, bold, #FFFFFF | ⬜ | |
| 12.5 | H3 modelos | 18px, bold, #000000 | ⬜ | |
| 12.6 | H4 tecnología | 16px, bold, #000000 | ⬜ | |
| 12.7 | Subtítulos | 18px (hero) / 16px (resto), #6F6F6F | ⬜ | |
| 12.8 | Texto cuerpo | 16px, regular, #262626 | ⬜ | |
| 12.9 | Texto modelos/tecnología | 14px, regular, #6F6F6F | ⬜ | |
| 12.10 | Legal | 12px, regular, #6F6F6F | ⬜ | |
| 12.11 | Disclaimer | 10px, regular, #A0A0A0 | ⬜ | |
| 12.12 | MSO font | Outlook conditional para font-family | ⬜ | |

### 13. IMÁGENES

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 13.1 | display:block | Todas las imágenes con `display:block` | ⬜ | |
| 13.2 | width/height | Dimensiones explícitas en todas las imágenes | ⬜ | |
| 13.3 | Alt text | Alt text descriptivo en todas las imágenes | ⬜ | |
| 13.4 | Border none | `border:0; outline:none` en todas las imágenes | ⬜ | |
| 13.5 | Placeholders | Todos los placeholders son de placehold.co | ⬜ | |
| 13.6 | Imagen hero responsive | `width:100%; max-width:600px; height:auto` | ⬜ | |
| 13.7 | Imágenes modelos responsive | `width:100%; max-width:180px; height:auto` | ⬜ | |
| 13.8 | Iconos tecnología responsive | Mantienen 60×60 en desktop, escalan en mobile | ⬜ | |

### 14. RESPONSIVE

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 14.1 | @media queries | Presentes con breakpoint 599px | ⬜ | |
| 14.2 | Mobile H1 | 36px en mobile (↓ desde 44px) | ⬜ | |
| 14.3 | Mobile H2 | 24px en mobile (↓ desde 28px) | ⬜ | |
| 14.4 | Mobile H2 electrificado | 26px en mobile (↓ desde 32px) | ⬜ | |
| 14.5 | Mobile stack modelos | Columnas se apilan verticalmente en mobile | ⬜ | |
| 14.6 | Mobile stack tecnología | Columnas se apilan verticalmente en mobile | ⬜ | |
| 14.7 | Mobile width | 100% + padding 20px lateral | ⬜ | |
| 14.8 | Mobile spacers | Se reducen (48→28px, 40→24px, etc.) | ⬜ | |
| 14.9 | Sin overflow | No hay scroll horizontal en mobile | ⬜ | |

### 15. OUTLOOK

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 15.1 | VML buttons | `v:roundrect` en los 3 botones | ⬜ | |
| 15.2 | MSO conditional | `<!--[if mso]>` para bordes de tabla | ⬜ | |
| 15.3 | PixelsPerInch | 96 DPI configurado | ⬜ | |
| 15.4 | Anchorlock | `w:anchorlock` en todos los VML buttons | ⬜ | |
| 15.5 | Font fallback | Arial — compatible nativamente con Outlook | ⬜ | |
| 15.6 | VML arcsize | 4% para botones rectangulares (no pill) | ⬜ | |

### 16. DARK MODE

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 16.1 | prefers-color-scheme | `@media (prefers-color-scheme: dark)` presente | ⬜ | |
| 16.2 | Dark bg | `.bmw-dark-bg` con #1A1A1A | ⬜ | |
| 16.3 | Dark text | `.bmw-dark-text` con #F4F4F4 | ⬜ | |
| 16.4 | Dark links | `.bmw-dark-link` con #4DA3E0 | ⬜ | |

### 17. VALIDACIÓN TÉCNICA

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 17.1 | HTML válido | Sin errores de sintaxis HTML | ⬜ | |
| 17.2 | Enlaces rotos | Ningún enlace roto | ⬜ | |
| 17.3 | Placeholders | Todos los [PLACEHOLDER] identificados | ⬜ | |
| 17.4 | Codificación | UTF-8 especificado | ⬜ | |
| 17.5 | Sin CSS redundante | Sin estilos que se solapen o anulen | ⬜ | |
| 17.6 | Compatibilidad Gmail | Sin clases de hover (ignoradas en Gmail) | ⬜ | |
| 17.7 | Imágenes reales | placehold.co sustituido por imágenes reales | ⬜ | |

---

## Resumen de validación

| Categoría | Total | ✅ | ❌ | ⬜ | % Aprobado |
|-----------|-------|----|----|-----|------------|
| 1. Estructura general | 8 | | | | |
| 2. Preheader | 4 | | | | |
| 3. Header | 5 | | | | |
| 4. Hero | 9 | | | | |
| 5. Intro | 5 | | | | |
| 6. Modelos (3 col) | 10 | | | | |
| 7. Tecnología | 9 | | | | |
| 8. Electrificado | 8 | | | | |
| 9. Test drive | 5 | | | | |
| 10. Botones CTA | 10 | | | | |
| 11. Footer | 10 | | | | |
| 12. Tipografía | 12 | | | | |
| 13. Imágenes | 8 | | | | |
| 14. Responsive | 9 | | | | |
| 15. Outlook | 6 | | | | |
| 16. Dark mode | 4 | | | | |
| 17. Validación técnica | 7 | | | | |
| **TOTAL** | **129** | | | | |

---

## Hallazgos / Issues

| # | Severidad | Descripción | Estado |
|---|-----------|-------------|--------|
| | | | |

---

## Aprobación final

- [ ] Aprobado para envío
- [ ] Aprobado con correcciones (ver hallazgos)
- [ ] Rechazado — requiere rediseño

Firma QA: _________________

Fecha: _________________
