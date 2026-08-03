# Sistema de Diseño — iPhone 17 Pro Premium

## Filosofía visual
El diseño de esta newsletter debe sentirse como una extensión natural de apple.com/iphone-17-pro/. No es una plantilla de email — es una pieza de comunicación de producto con el mismo nivel de dirección de arte que la página oficial.

## Sistema de color

### Paleta principal
| Color | Hex | Uso | Contexto |
|-------|-----|-----|----------|
| Blanco | #FFFFFF | Fondo principal | Claridad, pureza, espacio negativo |
| Negro | #000000 | Fondo hero + banda cierre | Dramatismo, contraste |
| Texto primario | #1D1D1F | Todos los titulares y body | Legibilidad máxima |
| Texto secundario | #6E6E73 | Subtítulos, metadata, footer | Jerarquía visual |
| Azul CTA | #0071E3 | Botones y enlaces | Acción, confianza, reconocible Apple |
| Gris fondo | #F5F5F7 | Sección de beneficios | Separación sutil sin bordes |
| Cosmic Orange | #E55B3C (aproximado) | Acento del producto | Color heroico del acabado principal |

### Reglas de color
- No usar más de 3 colores por módulo (fondo + texto + acento)
- El Cosmic Orange solo aparece en el producto (fotografía), no como color de interfaz
- El azul #0071E3 es exclusivo para CTAs y enlaces
- No usar degradados salvo el fondo del hero (negro puro #000000)
- No usar bordes de color — las separaciones se hacen con espacio y cambios de fondo

## Sistema tipográfico

### Stack
```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif;
```

### Jerarquía
| Elemento | Tamaño | Peso | Color | Line-height |
|----------|--------|------|-------|-------------|
| H1 hero | 44px | 700 | #FFFFFF | 1.1 |
| Subtítulo hero | 21px | 400 | #FFFFFF | 1.4 |
| H2 sección | 36px | 700 | #1D1D1F | 1.1 |
| H3 editorial | 24px | 600 | #1D1D1F | 1.2 |
| Body | 18px | 400 | #1D1D1F | 1.5 |
| Body pequeño | 16px | 400 | #6E6E73 | 1.5 |
| Métrica número | 44px | 700 | #1D1D1F | 1.0 |
| Label métrica | 14px | 400 | #6E6E73 | 1.3 |
| CTA texto | 17px | 400 | #FFFFFF | 1.0 |
| Legal | 12px | 400 | #6E6E73 | 1.4 |

### Reglas tipográficas
- Un máximo de 3 niveles de jerarquía por módulo
- Sin efectos tipográficos (sombras, contornos, degradados)
- Sin tipografías decorativas ni condensadas
- El titular debe poder leerse de forma independiente
- Máximo 10-12 palabras por titular
- Sin texto convertido en elemento ornamental

## Principios de composición

### Estructura general
- Ancho máximo: 600px
- Centrado en el viewport
- Cada módulo ocupa el ancho completo
- Separación entre módulos: 48px (padding vertical)
- Padding lateral: 20px en escritorio, 24px en móvil

### Retícula
- No usar retícula visible. La composición debe sentirse natural pero precisa.
- Los bloques editoriales (editorial-foto-texto) usan división 46%/54% (imagen/texto)
- Las columnas de beneficios (columns-3) usan 33.3% cada una
- Las métricas (metric-strip) usan 25% cada una

### Espacio negativo
- El espacio vacío es un elemento activo de diseño
- Separación generosa entre elementos dentro de un módulo
- Los titulares deben tener espacio para "respirar"
- No rellenar espacio con elementos decorativos

### Alineación
- Texto centrado en hero, intro, métricas, cierre
- Texto alineado a la izquierda en bloques editoriales
- Logo centrado en header
- Footer centrado

## Principios de imagen

### Hero principal
- Formato: 1200×750px (se muestra a 600×375px)
- Fondo: negro (#000000)
- Producto: iPhone 17 Pro en Cosmic Orange
- Ángulo: 3/4 trasero, mostrando el plateau de cámaras
- Iluminación: estudio, dramática, un solo foco lateral
- Sin texto superpuesto en la imagen
- El texto va debajo, sobre fondo negro

### Editorial foto-texto (cámaras)
- Formato: 600×600px (se muestra a 276×600px)
- Contenido: detalle macro del plateau de cámaras
- Fondo: negro o muy oscuro
- Enfoque: los tres lentes, el flash, el LiDAR
- Iluminación: estudio, revelando textura del aluminio cepillado

### Editorial texto-foto (zoom)
- Formato: 600×600px (se muestra a 276×600px)
- Contenido: imagen de ejemplo tomada con el zoom 8×
- Tema: retrato urbano o detalle arquitectónico a distancia
- Estilo: fotografía editorial de alta calidad
- Sin watermarks ni superposiciones

### Especificación de imágenes
- Todas las imágenes: JPG, calidad 85%, sRGB
- Máximo 300KB por imagen después de compresión
- Alt text descriptivo en todas las imágenes
- display: block en todas las imágenes
- Dimensiones explícitas width/height en todas las imágenes

## Diseño de componentes email

### CTA (Call to Action)
- Fondo: #0071E3
- Texto: #FFFFFF, 17px, 400 weight
- Padding: 12px 28px
- Border-radius: 50px (pill)
- VML bulletproof para Outlook
- Sin sombras, sin bordes
- Un solo CTA por sección

### Enlaces
- Color: #0066CC
- Sin subrayado en header/footer
- Subrayado en body text (estándar email)
- Estados: hover sin cambio (no soportado en email)

## Componentes responsive

### Breakpoint
- Desktop: 600px
- Mobile: <599px

### Comportamiento mobile
- Todas las imágenes: width 100%, height auto
- Bloques editoriales: se apilan (imagen arriba, texto abajo)
- Columnas de beneficios: se apilan verticalmente
- Métricas: 2×2 en mobile
- Tipografía: escala reducida (H1 → 36px, H2 → 28px)
- Padding lateral: 24px
- CTA: ancho completo en mobile

## Outlook
- VML para botones (v:roundrect)
- Tablas con border-collapse: collapse
- Fallback tipográfico: Segoe UI para Outlook
- Ancho fijo de 600px para Outlook desktop
- Sin imágenes de fondo en celdas críticas