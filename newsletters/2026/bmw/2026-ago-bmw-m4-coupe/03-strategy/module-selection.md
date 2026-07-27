# Module Selection

## Patrón elegido

`fotografia-primero` — mismo patrón que la campaña BMW X1 existente. La fotografía es el elemento protagonista (photographyWeight:dominante, iconDensity:nula). Perfecto para el M4 Competition Coupé, un producto donde la imagen del vehículo y las sensaciones de conducción son centrales.

## Secuencia de módulos

| # | Componente | Tipo | Justificación |
|---|---|---|---|
| 1 | header-logo | Requerido | Cabecera BMW blanca con label "M4 Competition Coupé" |
| 2 | hero-imagen | Requerido | Banner del M4 a todo el ancho. Hero sin alternativa — el patrón exige hero-imagen |
| 3 | intro-cta | Opcional | Párrafo de transición: datos clave del M4 (510 CV, 3,8s, M xDrive) + CTA secundario |
| 4 | columns-3-beneficios-sin-icono | Opcional | 3 datos de rendimiento (510 CV, 3,8s, M xDrive). Sin iconos (iconDensity:nula) |
| 5 | banda-cierre | Requerido | Cierre con CTA repetido sobre fondo negro (#000000) |
| 6 | footer | Siempre | Placeholders legales (test campaign) |

## Módulos descartados

| Módulo | Motivo |
|---|---|
| intro-cta-asimetrico | No necesario — layout centrado de BMW |
| banda-cierre-asimetrico | BMW usa layout centrado (sectionStyle: "centrado") |
| columns-3-beneficios (con icono) | iconDensity:nula — desaconsejado por el brand pack. Usar variante -sin-icono |
| category-grid, usp-cards | No existen en el patrón fotografia-primero |

## Hero elegido

`hero-imagen` — requerido por el patrón fotografia-primero. Requiere banner del M4 (pendiente de generación/subida a CDN). Sin fallback a hero-centrado en este patrón.
