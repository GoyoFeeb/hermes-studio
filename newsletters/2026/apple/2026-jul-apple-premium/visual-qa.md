# Visual QA — Apple Newsletter Premium

> Campaña: Apple — Campaña genérica premium
> Fecha QA: Julio 2026
> Reponsable: [NOMBRE]
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
| 2.3 | Texto gancho | "Descubre lo último en innovación y diseño..." | ⬜ | |
| 2.4 | Sin caracteres rotos | Sin caracteres especiales visibles en preheader | ⬜ | |

### 3. HEADER

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 3.1 | Logo Apple | Presente, placeholder reemplazable | ⬜ | |
| 3.2 | Dimensiones logo | 44×54px con width/height explícitos | ⬜ | |
| 3.3 | Alt text | Alt descriptivo en logo | ⬜ | |
| 3.4 | Padding | 20px arriba, 8px abajo (ligero) | ⬜ | |
| 3.5 | Fondo | Blanco (#FFFFFF) | ⬜ | |

### 4. HERO

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 4.1 | Imagen hero | Full-width (600px), display:block | ⬜ | |
| 4.2 | Dimensiones hero | 600×375px en newsletter (original 1200×750) | ⬜ | |
| 4.3 | Alt text hero | Alt descriptivo | ⬜ | |
| 4.4 | Product label | Texto pequeño (14px), #6E6E73, uppercase | ⬜ | |
| 4.5 | H1 hero | 48px, #1D1D1F, bold, sin bordes ni sombras | ⬜ | |
| 4.6 | Subtítulo hero | 21px, #6E6E73, regular weight | ⬜ | |
| 4.7 | Espaciado hero | 48px arriba del texto, generoso | ⬜ | |
| 4.8 | Sin bordes | Cero bordes de tarjeta o sombras en hero | ⬜ | |
| 4.9 | Sin barras de acento | Cero kicker rules o accent stripes | ⬜ | |

### 5. BOTONES CTA

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 5.1 | VML bulletproof | `v:roundrect` presente para Outlook | ⬜ | |
| 5.2 | Fallback HTML | `<a>` con inline styles presente | ⬜ | |
| 5.3 | Color CTA | Fondo #0071E3, texto #FFFFFF | ⬜ | |
| 5.4 | Border-radius | 50px (pill shape) | ⬜ | |
| 5.5 | Font-size | 17px | ⬜ | |
| 5.6 | Padding | 13px 32px | ⬜ | |
| 5.7 | Texto CTA hero | "Más información" | ⬜ | |
| 5.8 | Texto CTA compra | "Comprar" | ⬜ | |
| 5.9 | Texto CTA final | "Más información" | ⬜ | |
| 5.10 | Hover state | `:hover` presente en @media screen | ⬜ | |

### 6. BLOQUES DE BENEFICIOS

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 6.1 | Alternancia visual | Imagen | texto → texto | imagen → imagen | texto | ⬜ | |
| 6.2 | H2 beneficios | 32px, #1D1D1F, bold | ⬜ | |
| 6.3 | Texto beneficios | 18px, #6E6E73, regular | ⬜ | |
| 6.4 | Imágenes beneficios | 300×200px en desktop (fracional) | ⬜ | |
| 6.5 | Alt text beneficios | Alt descriptivo por imagen | ⬜ | |
| 6.6 | Sin bordes tarjeta | Cero bordes, sombras o fondos de tarjeta | ⬜ | |
| 6.7 | Espaciado entre bloques | 48px entre cada bloque de beneficio | ⬜ | |
| 6.8 | Beneficio 1 texto | "Rendimiento que se nota" + [chip] placeholder | ⬜ | |
| 6.9 | Beneficio 2 texto | "Diseñado para durar" | ⬜ | |
| 6.10 | Beneficio 3 texto | "Una experiencia conectada" (ecosistema) | ⬜ | |

### 7. BLOQUE COMERCIAL

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 7.1 | Precio presente | "Desde [PRECIO]" en 36px bold | ⬜ | |
| 7.2 | Financiación | "[FINANCIACIÓN]" presente | ⬜ | |
| 7.3 | CTA "Comprar" | Botón funcional con VML | ⬜ | |
| 7.4 | Texto legal | "[LEGAL_TEXT_PLACEHOLDER]" en 12px | ⬜ | |
| 7.5 | Separador | Línea delgada #E8E8ED antes del bloque | ⬜ | |

### 8. CTA FINAL

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 8.1 | H2 final | 34px, #1D1D1F, bold | ⬜ | |
| 8.2 | Subtítulo final | 21px, #6E6E73 | ⬜ | |
| 8.3 | CTA final | "Más información" con VML | ⬜ | |
| 8.4 | Fondo | Blanco (#FFFFFF) | ⬜ | |
| 8.5 | Espaciado | 56px antes/después | ⬜ | |

### 9. FOOTER

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 9.1 | Fondo | #F5F5F7 (light grey) | ⬜ | |
| 9.2 | Logo pequeño | 20×24px, gris (#6E6E73) | ⬜ | |
| 9.3 | Copyright | Presente con [COMPANY_NAME] placeholder | ⬜ | |
| 9.4 | Dirección | "[DIRECCIÓN_COMPLETA]" placeholder | ⬜ | |
| 9.5 | Texto suscripción | Explica por qué reciben el email | ⬜ | |
| 9.6 | Unsubscribe | Enlace con href="[UNSUBSCRIBE_LINK]" | ⬜ | |
| 9.7 | Privacidad | Enlace con href="[PRIVACY_URL]" | ⬜ | |
| 9.8 | Términos | Enlace con href="[TERMS_URL]" | ⬜ | |
| 9.9 | Disclaimer | Texto en 10px sobre placeholders | ⬜ | |
| 9.10 | Color texto footer | #6E6E73 en todos los textos | ⬜ | |

### 10. TIPOGRAFÍA

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 10.1 | Font stack | `-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif` | ⬜ | |
| 10.2 | H1 hero | 48px, bold, #1D1D1F, tracking negativo | ⬜ | |
| 10.3 | H2 beneficios | 32px, bold, #1D1D1F | ⬜ | |
| 10.4 | H2 CTA final | 34px, bold, #1D1D1F | ⬜ | |
| 10.5 | Subtítulos | 21px, regular, #6E6E73 | ⬜ | |
| 10.6 | Texto cuerpo | 18px, regular, #6E6E73 | ⬜ | |
| 10.7 | Product label | 14px, medium, #6E6E73, uppercase | ⬜ | |
| 10.8 | Legal | 12px, regular, #6E6E73 | ⬜ | |
| 10.9 | MSO font | Outlook conditional para font-family | ⬜ | |

### 11. IMÁGENES

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 11.1 | display:block | Todas las imágenes con `display:block` | ⬜ | |
| 11.2 | width/height | Dimensiones explícitas en todas las imágenes | ⬜ | |
| 11.3 | Alt text | Alt text descriptivo en todas las imágenes | ⬜ | |
| 11.4 | Border none | `border:0; outline:none` en todas las imágenes | ⬜ | |
| 11.5 | Placeholders | Todos los placeholders son de placehold.co | ⬜ | |
| 11.6 | Imagen hero responsive | `width:100%; max-width:600px; height:auto` | ⬜ | |
| 11.7 | Imágenes beneficios responsive | `width:100%; max-width:300px; height:auto` | ⬜ | |

### 12. RESPONSIVE

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 12.1 | @media queries | Presentes con breakpoint 599px | ⬜ | |
| 12.2 | Mobile H1 | 40px en mobile (↓ desde 48px) | ⬜ | |
| 12.3 | Mobile H2 | 28px en mobile (↓ desde 32px) | ⬜ | |
| 12.4 | Mobile stack | Columnas se apilan en mobile | ⬜ | |
| 12.5 | Mobile width | 100% + padding 24px lateral | ⬜ | |
| 12.6 | Sin overflow | No hay scroll horizontal en mobile | ⬜ | |

### 13. OUTLOOK

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 13.1 | VML buttons | `v:roundrect` en los 3 botones | ⬜ | |
| 13.2 | MSO conditional | `<!--[if mso]>` para bordes de tabla | ⬜ | |
| 13.3 | PixelsPerInch | 96 DPI configurado | ⬜ | |
| 13.4 | Anchorlock | `w:anchorlock` en todos los VML buttons | ⬜ | |
| 13.5 | Font fallback | Outlook usa su propia pila (Segoe UI) | ⬜ | |

### 14. DARK MODE

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 14.1 | prefers-color-scheme | `@media (prefers-color-scheme: dark)` presente | ⬜ | |
| 14.2 | Dark bg | `.apple-dark-bg` con #1D1D1F | ⬜ | |
| 14.3 | Dark text | `.apple-dark-text` con #F5F5F7 | ⬜ | |
| 14.4 | Dark links | `.apple-dark-link` con #66BBFF | ⬜ | |

### 15. VALIDACIÓN TÉCNICA

| # | Punto | Criterio | Resultado | Notas |
|---|-------|----------|-----------|-------|
| 15.1 | HTML válido | Sin errores de sintaxis HTML | ⬜ | |
| 15.2 | Enlaces rotos | Ningún enlace roto | ⬜ | |
| 15.3 | Placeholders | Todos los [PLACEHOLDER] identificados | ⬜ | |
| 15.4 | Codificación | UTF-8 especificado | ⬜ | |
| 15.5 | Sin CSS redundante | Sin estilos que se solapen o anulen | ⬜ | |
| 15.6 | Compatibilidad Gmail | Sin clases de hover (ignoradas en Gmail) | ⬜ | |

---

## Resumen de validación

| Categoría | Total | ✅ | ❌ | ⬜ | % Aprobado |
|-----------|-------|----|----|-----|------------|
| 1. Estructura general | 8 | | | | |
| 2. Preheader | 4 | | | | |
| 3. Header | 5 | | | | |
| 4. Hero | 9 | | | | |
| 5. Botones CTA | 10 | | | | |
| 6. Bloques beneficios | 10 | | | | |
| 7. Bloque comercial | 5 | | | | |
| 8. CTA final | 5 | | | | |
| 9. Footer | 10 | | | | |
| 10. Tipografía | 9 | | | | |
| 11. Imágenes | 7 | | | | |
| 12. Responsive | 6 | | | | |
| 13. Outlook | 5 | | | | |
| 14. Dark mode | 4 | | | | |
| 15. Validación técnica | 6 | | | | |
| **TOTAL** | **103** | | | | |

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
