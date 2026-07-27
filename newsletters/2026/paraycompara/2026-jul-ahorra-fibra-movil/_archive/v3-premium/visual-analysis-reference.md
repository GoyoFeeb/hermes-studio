# Visual Analysis — Newsletter Referencia Para y Compara

## Assets analizados (5 bloques imagen completa)

| Asset | Bloque | Función |
|---|---|---|
| `paraycompara-1000.png` | Header + Logo | Cabecera de marca |
| `paraycompara-2000.png` | Hero | Hero visual con smartphone + CTA |
| `paraycompara-3000.png` | Badge promocional | "LA MEJOR OFERTA DEL MES" |
| `paraycompara-4000.png` | Tarjeta de oferta | Precio + features móvil |
| `paraycompara-5000.png` | Barra de confianza | 3 beneficios (ofertas, ahorro, gratis) |

---

## 1. PALETA REAL EXTRAÍDA

| Color | Hex | Uso |
|---|---|---|
| Morado profundo | `#5E2E91` | Texto principal, iconos rellenos, botones, logo |
| Morado medio | `#8E6BAE` / `#7B1FA2` | Texto secundario, iconos outline |
| Lila claro | `#F4F3F9` | Fondos de sección |
| Lila fondo tarjeta | `#F8F5FC` | Fondo sección tarjetas (3000, 5000) |
| Lavanda tarjeta oferta | `#C9B1D6` | Fondo tarjeta oferta (4000) |
| Naranja coral | `#FF7043` (≈ `#FF5A3C`) | Acento, sparkles, badges |
| Blanco | `#FFFFFF` | Fondos de cards, texto sobre morado |
| Gris oscuro texto | `#4A2C5A` / `#2D2D2D` | Cuerpo de texto |
| Morado botón | `#3E244D` | Fondo botón "IR A LA OFERTA" |

## 2. TIPOGRAFÍA

- **Familia**: Sans-serif redondeada → **Nunito** (usada en referencia via Google Fonts, pero para email usar Arial/Helvetica fallback)
- **Pesos**: Extra Bold (800) para titulares, Bold (700) para CTAs, Regular (400) para cuerpo
- **Tamaños**:
  - Logo "Compara": ~48px
  - Logo "Para &": ~24px
  - Hero headline: ~32-36px
  - Precio oferta: ~48-56px
  - Secciones: ~22-24px
  - Body: ~14-16px
  - Legal: ~11-12px
- **Estilo**: Titulares en negrita, uppercase solo en badges pequeños, sentence case en general

## 3. FORMAS Y RADIOS

| Elemento | Border-radius |
|---|---|
| Botones CTA | ~8-10px (no píldora completa) |
| Tarjetas interior phone | ~12-16px |
| Marco phone | ~35px |
| Badge promocional | ~8-12px (píldora) |
| Barra de confianza | ~50px (píldora completa) |
| Tarjeta oferta (4000) | ~20px |
| Iconos contenedor | ~50% (círculo) |

## 4. COMPOSICIÓN

- **Header**: Logo centrado, icono smartphone + sparkle naranja + swoosh morado
- **Hero**: Split (texto izquierda, mockup phone derecha), fondo degradado lila
- **Secciones**: Centradas, fondos alternos (blanco → lila claro → blanco)
- **Tarjetas**: Grid 2×2 con icono círculo + título + texto corto
- **Barra confianza**: 3 items horizontales, icono + texto, sin divisores
- **Footer**: Compacto, texto legal pequeño, enlaces separados por pipe

## 5. ESTILO DE ILUSTRACIÓN

- **Plano vectorial** con sombras suaves (neumórfico ligero)
- **Smartphone** como dispositivo principal (estilo iPhone con Dynamic Island)
- **Tarjetas flotantes** dentro del phone con iconos blancos sobre fondo morado
- **Iconos**: Outline fino en morado medio, o relleno blanco sobre círculo morado
- **Sparkles**: Estrella de 4 puntas en naranja coral como elemento decorativo
- **Shield**: Icono de escudo con check como señal de confianza

## 6. RECURSOS DE MARCA

- **Logo**: Smartphone + sparkle + swoosh + texto "Para & Compara"
- **Vocabulario visual**: Formas redondeadas, morados, naranja de acento, composiciones centradas
- **Recursos gráficos**: Smartphone mockup, tarjetas flotantes, sparkles, badges promocionales
- **Sensación**: Comparador accesible, cercano, moderno, orientado a ahorro

## 7. PROBLEMAS TÉCNICOS DE LA VERSIÓN ACTUAL (referencia)

- Todo el contenido es una imagen plana → no seleccionable, no indexable, no responsive
- `lang="en"` en newsletter en español
- Sin preheader oculto
- Sin media queries para responsive
- Sin alt text en imágenes
- Sin estructura de tablas semántica para email
- Los CTAs están dentro de la imagen → no clicables individualmente
- Sin fallback para Outlook
- Google Fonts (Nunito, Alexandria) no funcionan en clientes de correo
- Sin protección contra modo oscuro

## 8. DECISIONES DE RECONSTRUCCIÓN

### Se mantienen como imagen:
- **Hero visual** → smartphone mockup + tarjetas flotantes + composición gráfica (ilustración compleja)
- **Badge promocional** → si se incluye, como elemento gráfico
- **Sparkles / recursos decorativos** → parte del hero image

### Se reconstruyen en HTML real:
- ✅ **Header/Logo**: Logo PNG existente, fondo morado, centrado
- ✅ **Titulares y textos**: HTML real, fuente Arial/Helvetica
- ✅ **CTA buttons**: CSS píldora con fallback VML/Outlook
- ✅ **Tarjetas de tarifas**: Grid 2×2 con HTML + iconos PNG
- ✅ **Pasos "Cómo funciona"**: 3 columnas HTML con círculos CSS
- ✅ **Bloque "Qué tener en cuenta"**: Grid 2×2, HTML + iconos
- ✅ **Barra de confianza**: 3 beneficios, HTML con iconos PNG
- ✅ **CTA Final**: Botón HTML real
- ✅ **Footer**: Texto + enlaces HTML
- ✅ **Preheader**: HTML oculto
- ✅ **Responsive**: Media queries para móvil

---

## 9. SISTEMA VISUAL (Resumen para implementación)

```
Fondo general body: #F4F3F9
Fondo contenedor:   #FFFFFF
Header:             #5E2E91 (morado profundo)
Secciones alternas: #F8F5FC (lila muy claro)
Hero image:         phone mockup + floating cards (PNG)
Botones:            #FF7043 (naranja coral), radius 10px
                    (o #3E244D morado oscuro según contexto)
Titulares:          #2D2D2D (casi negro), bold
Texto cuerpo:       #666666 (gris)
Texto secundario:   #999999 (gris claro)
Iconos fondo:       #F3E5F5 (círculo lavanda)
Iconos:             PNGs existentes, 44×44 o 28×28 px
Bordes tarjetas:    1px solid #EDE7F3
Radius tarjetas:    16px
Círculos iconos:    12px (radius interior)
```
