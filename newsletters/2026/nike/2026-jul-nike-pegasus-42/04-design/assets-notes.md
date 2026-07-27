# Assets Notes — Nike Pegasus 42

## Assets necesarios

| Asset | Estado | Especificaciones | Responsable |
|-------|--------|-----------------|-------------|
| Logo Nike (swoosh) PNG | 🔴 **Pendiente** | Ancho 80px, altura proporcional ~28px. Fondo transparente. Capturar de nike.com. | Build |
| Hero banner (generado) | 🔴 **Pendiente de generación** | 1200×700 → 600×350px. PNG sin texto — imagen del Pegasus 42 con tratamiento Nike (fondo blanco, perfil lateral, iluminación high-key). | 06 |
| Subida al CDN del hero | 🔴 **Pendiente del usuario** | URL final del CDN | Usuario |
| Iconos card-tarifa-3 | 🔴 **Pendiente** | Nike no tiene iconos de beneficio decorativos. Para card-tarifa-3, idealmente se capturarían iconos funcionales de nike.com. Como alternativa para test: usar URLs placeholder y confiar en que el card-tarifa-3 funciona visualmente sin iconos impactantes. | Usuario |

## Variante de icono por módulo — DECISIÓN (agents/04-email-designer.md §"Elegir variante de icono")

| Módulo | Variante elegida | Motivo |
|--------|-----------------|--------|
| header-logo | Logo real (PNG) | El swoosh de Nike es el icono más importante de la marca |
| hero-imagen | No aplica | Hero con fotografía, sin iconos |
| intro-cta | No aplica | Texto + CTA, sin iconos |
| card-tarifa-3 | **httpsUrl (imagen PNG)** | El brand pack de Nike prohíbe explícitamente iconGlyph (emoji) en comunicación de producto (iconography.componentImplication: "NO usar emoji en ningún módulo"). card-tarifa-3 acepta icon como httpsUrl. Los iconos se dejarán como placeholder pendiente hasta obtener assets reales de Nike, o se omitirán funcionalmente usando un bullet mínimo como imagen si no se consiguen. |
| banda-cierre | No aplica | Texto + CTA |
| footer | No aplica | Texto legal |

## Especificaciones técnicas

- **Formato:** PNG para hero y logo
- **Dimensiones hero:** 600×350px en email (1200×700 nativo para retina)
- **Iconos card-tarifa-3:** Idealmente 60×60px PNG monocromo
- **Modo de color:** RGB
- **Alt text:** Siempre descriptivo
