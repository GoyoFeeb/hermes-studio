# Assets Notes — Audi A6 Sportback e-tron

## Variante de icono

| Módulo | Variante elegida | Motivo |
|--------|-----------------|--------|
| **columns-3-beneficios-sin-icono** | `-sin-icono` | `iconography.componentImplication` del brand pack: "No usar emoji ni iconGlyph en beneficios — usar variante columns-3-beneficios-sin-icono". Audi no usa iconografía decorativa. La fotografía es el único adorno visual. |

**No hay otros módulos con campo de icono en esta campaña.** Los módulos editorial-foto-texto usan fotografía real como elemento visual, no iconos.

## Assets de imagen

| Módulo | Asset | Specs | Referencia photography.treatment | Estado |
|--------|-------|-------|----------------------------------|--------|
| hero-imagen | Banner hero A6 Sportback e-tron | 600×350px, PNG sin texto | "Audi usa fotografía real de alta calidad editorial. Ángulo medio-bajo, luz natural controlada, fondo limpio, carretera o paisaje minimalista, sin texto en la imagen. Transmitir precisión alemana, elegancia y tecnología." | PENDING-CDN-UPLOAD |
| editorial-foto-texto | Foto exterior A6 (perfil/silueta) | 276×200px, sin texto | "Planos: gran angular para hero, planos medios para detalle. Iluminación: luz natural controlada. Composición: simétrica o centrada." | PENDING-CDN-UPLOAD |
| editorial-foto-texto-inverso | Foto interior (pantallas/habitáculo) | 276×200px, sin texto | "Interiores con luz ambiental suave. Pantalla panorámica OLED como elemento focal. Materiales premium visibles." | PENDING-CDN-UPLOAD |

## Proporción imagen/texto

| Módulo | Proporción | Nota |
|--------|-----------|------|
| editorial-foto-texto | 46/54 (imagen/texto) | Replica el ritmo visual de la página de Audi: foto domina pero texto tiene espacio para respirar |
| editorial-foto-texto-inverso | 54/46 (texto/imagen) | Inversión deliberada para mantener ritmo; Audi usa la misma alternancia en su web |

## Notas de implementación
- **Logo**: No hay PNG del logo de Audi. El header usará texto "AUDI" en mayúsculas con tracking. Opcional: usar los anillos de Audi como SVG inline si el motor lo soporta.
- **Hero banner**: No generar con texto dentro — es arte puro. El titular y CTA van en HTML debajo.
- **CDN**: Todos los assets de imagen usan placeholder `https://PENDING-CDN-UPLOAD/audi/...`. Gate 5 los marcará como pendientes — esperado para campaña de prueba.

## Referencia directa a página de Audi
- La proporción 46/54 de editorial-foto-texto replica el ritmo visual de los bloques destacados de audi.es (carrusel de producto).
- El espaciado generoso (section padding 32px 24px) copia la separación observada entre secciones de la página del A6.
- El uso de fondo gris #F5F5F5 para el bloque de stats replica la separación visual que audi.es usa para sus fichas técnicas.
