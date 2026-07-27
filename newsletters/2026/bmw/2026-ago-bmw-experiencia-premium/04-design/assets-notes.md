# Assets Notes — BMW Experiencia Premium

## Variante de icono por módulo

| Módulo | Variante elegida | Motivo |
|--------|-----------------|--------|
| `columns-3-beneficios` | **`-sin-icono`** | `iconography.componentImplication` del brand pack: "BMW confía en la fotografía como único adorno visual." `iconDensity: nula`. No se usan iconos ni emojis. |

## Hero banner

| Campo | Especificación |
|-------|---------------|
| Componente | `hero-imagen.html` |
| Tipo | Banner generado por IA (vía `npm run generate-hero-image`) |
| Tamaño | 600×350px (lo que el flujo de generación produzca, reescalado a 600px target) |
| Tratamiento | Según `photography.treatment` del brand pack: fotografía de alta calidad, luz natural dramática, saturación natural, composición regla de tercios, motion blur en fondos. Sin texto, sin logotipo, sin claims dentro de la imagen. |
| Tema | Ingeniería, precisión, deportividad premium, conducción, tecnología. Atmósfera cinematográfica, espacio negativo abundante. |
| CDN | Pendiente de subir después de generación. Placeholder: `PENDING-CDN-UPLOAD` |

## Logo

| Campo | Especificación |
|-------|---------------|
| Formato | PNG (preferido para email) o SVG |
| Tamaño | 120×36px |
| Alt | "BMW" |
| Estado | ⏳ Pendiente de capturar de bmw.es |

## Requisitos de fotografía

- La imagen de cabecera debe sentirse cinematográfica, limpia, premium
- Contraste moderado, saturación contenida
- Abundante espacio negativo (para que el ojo descanse)
- Sin texto, sin logotipo, sin claims, sin matrículas legibles dentro de la imagen
- Asociada a ingeniería, conducción y producto BMW

## Tamaños de assets

| Asset | Ancho | Alto | Formato | Peso máx |
|-------|-------|------|---------|----------|
| Hero banner | 600px | ~350px | PNG | < 200 KB |
| Logo | 120px | 36px | PNG | < 50 KB |

## Contraste WCAG verificado

| Combinación | Ratio | Umbral | Resultado | Aplica a |
|------------|-------|--------|-----------|----------|
| `#FFFFFF` / `#1C69D4` | 5.22:1 | 4.5:1 | ✅ PASS | Texto CTA sobre fondo azul |
| `#262626` / `#FFFFFF` | 15.13:1 | 4.5:1 | ✅ PASS | Body sobre fondo blanco |
| `#6F6F6F` / `#FFFFFF` | 5.02:1 | 4.5:1 | ✅ PASS | Texto secundario sobre blanco |
| `#6F6F6F` / `#F4F4F4` | 4.57:1 | 4.5:1 | ✅ PASS | Footer sobre gris |
| `#000000` / `#FFFFFF` | 21.00:1 | 4.5:1 | ✅ PASS | Títulos sobre blanco |
| `#FFFFFF` / `#000000` | 21.00:1 | 4.5:1 | ✅ PASS | Texto sobre fondo oscuro (banda-cierre) |
