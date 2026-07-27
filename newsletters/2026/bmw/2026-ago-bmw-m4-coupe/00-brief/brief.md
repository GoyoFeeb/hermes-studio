# Brief: BMW — 2026-ago-bmw-m4-coupe

## Información general

| Campo | Valor |
|---|---|
| Cliente | BMW |
| Campaña | 2026-ago-bmw-m4-coupe |
| Modelo | BMW M4 Competition Coupé |
| Fecha de briefing | 2026-08-15 |
| Estado | briefing |
| Fuente del brief | Usuario (Orchestrator prompt + guía visual BMW) |

## Objetivo

Newsletter aspiracional para el BMW M4 Competition Coupé. Transmitir ingeniería, precisión, sofisticación y lujo contenido. La pieza debe sentirse claramente "BMW" incluso sin mostrar el logotipo. Enfoque en rendimiento (510 CV, 0-100 en 3,8s), tecnología (M xDrive) y la experiencia de conducción.

## CTA principal

Configurar el M4

## Enlace principal

https://www.bmw.es/es/configurador.html
Estado: VERIFICADO (URL real de BMW España, configurador oficial)

## Audiencia objetivo

Entusiastas del motor, clientes premium, profesionales que valoran el diseño y la ingeniería alemana. Perfil aspiracional: conductores que buscan emociones al volante y consideran un coupé deportivo de altas prestaciones.

## Tono y estilo

Premium, editorial, aspiracional, preciso. Sin exageraciones. Afirmaciones respaldadas por datos reales (510 CV, 3,8s, M xDrive). Frases cortas e impactantes. Puntuación limpia. Sin exclamaciones excesivas.

## Mensajes clave

- Motor 6 cilindros en línea M TwinPower Turbo: 510 CV.
- Aceleración 0-100 km/h en 3,8 segundos.
- Tracción integral M xDrive con diferencial M activo.
- Cada componente diseñado para ofrecer la experiencia de conducción más pura.
- Configurable a tu medida en bmw.es.

## Promociones / Ofertas

Sin promociones ni ofertas específicas. Campaña aspiracional de producto. Los precios (131.750 € desde) se mencionan solo como referencia del configurador, no como oferta.

## Identidad visual

- **Brand pack**: `brands/bmw/tokens/brand-tokens.json` v2.3.1 (observado de bmw.es)
- **Patrón**: `fotografia-primero` — la fotografía es el elemento protagonista
- **Colores base**: blanco #FFFFFF, negro #000000, grises (#262626, #6F6F6F, #F4F4F4)
- **Azul BMW (acento)**: #1C69D4 (observado de bmw.es, NO #0066B1 que fue descartado como "inventado" en el changelog)
- **Tipografía**: Titillium Web (sustituto de BMW TypeNext para email) + Arial fallback
- **CTA**: botón azul #1C69D4, texto blanco, border-radius 3px
- **Ver brand-analysis.md para discrepancias documentadas entre la guía visual del usuario y el brand pack real**

## Claims prohibidos

- ❌ No usar claims no verificados sobre consumos o emisiones (WLTP)
- ❌ No inventar cifras de potencia que no estén en el configurador
- ❌ No usar "mejor", "único", "el más" sin evidencia
- ❌ No crear urgencia artificial ("últimas unidades", "oferta limitada")
- ⚠️ Los datos técnicos (510 CV, 3,8s, M xDrive) están verificados en bmw.es

## Riesgos detectados

- Banner del hero pendiente de generación/subida a CDN (`PENDING-CDN-UPLOAD`)
- Logo BMW pendiente de capturar de bmw.es
- Placeholders legales sin resolver (`[UNSUBSCRIBE_LINK]`, etc.)
- `isTestCampaign: true`

## Notas adicionales

- Patrón fotografia-primero: mismo que la campaña BMW X1 existente
- Sin iconos en beneficios (columns-3-beneficios-sin-icono) — coherente con iconDensity:nula
- El brand pack prevalece sobre la guía visual del usuario donde haya discrepancias
