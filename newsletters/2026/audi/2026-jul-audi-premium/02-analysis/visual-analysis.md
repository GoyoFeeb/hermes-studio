# Análisis Visual — Audi Newsletter

## 1. Datos Extraídos de audi.es

### Colores (getComputedStyle)

| Color | Hex | Uso observado |
|---|---|---|
| Negro | `#000000` | Texto primario, enlaces |
| Azul muy oscuro | `#101319` | Fondo hero, fondo body (body bg) |
| Blanco roto | `#FCFCFD` | Fondo principal, contenedores |
| Blanco puro | `#FFFFFF` | Texto sobre fondos oscuros |
| Gris medio claro | `#ABB1C3` | Texto decorativo, on-brand-secondary |
| Gris medio | `#67707F` | Texto secundario |
| Gris claro | `#F5F5F5` | Fondos alternos (secciones) |

### Tipografía

| Elemento | Propiedad | Valor |
|---|---|---|
| H1 hero | Font | AudiType, sans-serif |
| H1 hero | Size | 40px |
| H1 hero | Weight | 400 (Regular) |
| H1 hero | Color | #FCFCFD |
| H1 hero | Line-height | 60px |
| Body | Font | AudiType (inferido — body usa Times New Roman fallback en snapshot, el CSS real carga AudiType) |
| Body | Size | 16px |
| Body | Weight | 400 |
| Body | Color | #000000 |
| Botones | Font | AudiType, sans-serif |
| Navegación | Background | Transparente |

### Logo

| Propiedad | Valor |
|---|---|
| Formato | SVG inline (anillos de Audi) |
| ViewBox | 0 0 69 24 |
| Ratio | ~2.88:1 |
| Color | Negro (currentColor) |

## 2. Brand Pack vs. Brief del Cliente

| Aspecto | Solicitado en brief | Brand pack (observado) | Decisión |
|---|---|---|---|
| Negro | #000000 | #000000 | ✅ Coincide |
| Blanco | #FFFFFF | #FCFCFD (off-white) | Usar #FCFCFD como blanco real de Audi; #FFFFFF para texto sobre oscuro |
| Gris claro 1 | #F5F5F5 | #F5F5F5 | ✅ Coincide |
| Gris claro 2 | #ECECEC | No observado directamente | Mantener como tono de borde |
| Gris medio | #D9D9D9 | — | Usar como border |
| Gris oscuro 1 | #666666 | #67707F (#666 es aproximación cercana) | Usar #67707F (valor real) |
| Tipografía | Sans-serif premium | AudiType (propietaria) | Inter como sustituto web |
| CTA | Negro/blanco | Negro sobre blanco | ✅ Coincide |
| Radio botón | Mínimo | Observado 0px (recto) en navegación; pills 999px en iconos | Usar 0px (recto, minimalista) |

## 3. Tratamiento Fotográfico

El sitio de Audi España utiliza:
- Fotografía gran angular como hero (1920×1080 o similar)
- Iluminación natural con alto contraste controlado
- Fondos limpios sin distracciones
- Coche como elemento central, ocupando 60-70% del encuadre
- Sin texto ni overlays pesados sobre las imágenes
- Colores naturales sin saturaciones excesivas

## 4. Aplicación al Email (Adaptaciones Necesarias)

| Aspecto web | Adaptación email | Motivo |
|---|---|---|
| AudiType (web font) | Inter via @import Google Fonts | AudiType no disponible en email |
| SVG inline logo | PNG del logo o texto "AUDI" | Email no soporta SVG |
| Fondo #101319 en hero | Usar #101319 como colors.deep | Consistente con identidad oscura premium |
| Espaciado web amplio | 32-48px padding section | Mantener sensación de aire |
| Animaciones/transiciones | No replicable en email | Fotografía debe transmitir movimiento |

## 5. Recomendaciones de Diseño

1. **Hero**: Fotografía a todo el ancho (600×350), modelo Audi en entorno limpio
2. **CTA**: Botón negro rectangular, texto blanco, sin sombras ni radios
3. **Tipografía**: Inter (300/400/500 weights), tamaños generosos con kerning amplio
4. **Espaciado**: Abundante — al menos 32px de padding interno en secciones
5. **Fondo alterno**: #F5F5F5 para secciones secundarias, manteniendo aire
6. **Sin iconos**: No usar emoji ni iconos decorativos en ninguna sección
7. **Sin sombras**: Todo plano, sin card shadows
8. **Sin bordes redondeados**: Esquinas rectas en todos los elementos
