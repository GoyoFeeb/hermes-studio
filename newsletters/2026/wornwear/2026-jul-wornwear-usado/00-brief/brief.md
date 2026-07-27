# Brief: Patagonia Worn Wear — 2026-jul-wornwear-usado

## Información general

| Campo | Valor |
|---|---|
| Cliente | Patagonia Worn Wear |
| Campaña | 2026-jul-wornwear-usado |
| Fecha de briefing | 2026-07-24 |
| Estado | briefing |
| Fuente del brief | Input directo del usuario (Orchestrator) |

## Tipo de campaña

| Campo | Valor |
|---|---|
| isTestCampaign | `true` |
| productionReady | `false` |
| Idioma | Español |
| Tamaño | Newsletter única (no serie ni automatizada) |

## Objetivo

Dar a conocer la colección de segunda mano de Worn Wear a personas que ya compran Patagonia nuevo, y llevarlas a explorar las novedades que van entrando en el catálogo de usado.

## Ángulo

Comprar usado en Worn Wear no es conformarse con menos: es equipo Patagonia con vida por delante, más barato, y con la misma garantía de calidad. El titular real que usa la propia marca en su home es **"Put Used to Use"** — usar como referencia de tono, no necesariamente literal.

## CTA principal

| Campo | Valor |
|---|---|
| Etiqueta | A decidir por Copy (Agente 05), coherente con voz real de la marca |
| Destino | `https://wornwear.patagonia.com/` |
| UTM | `?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-wornwear-usado` |
| UTM content | Por módulo — cada CTA href incluirá `&utm_content={modulo-slug}` para distinguir en analítica |

## Audiencia objetivo

Personas que ya compran Patagonia nuevo y conocen la marca, pero quizás no saben que existe Worn Wear o tienen reparos sobre calidad/prestaciones de segunda mano.

## Tono y estilo

- Referencia de tono: el titular real "Put Used to Use" de wornwear.patagonia.com
- Voz de marca a investigar en Agente 02 (extraer de la web real)
- Traducir el tono al español — no calcar la sintaxis del inglés
- Sin superlativos vacíos ni urgencia inventada

## Mensajes clave

- Worn Wear existe y tiene catálogo de segunda mano de Patagonia
- El equipo usado tiene la misma garantía de calidad que el nuevo
- Precios más bajos que nuevo, sin comprometer durabilidad
- Constantemente entran nuevas piezas al catálogo (razón para visitar ahora)

## Restricciones de claims

| Restricción | Tipo |
|---|---|
| No inventar cifras de impacto ambiental (CO₂, agua, residuos) | 🔴 BLOQUEANTE |
| No inventar precios ni porcentajes de descuento | 🔴 BLOQUEANTE |
| No usar "gratuito"/"free" | 🟡 Precaución |
| No usar urgencia ("ahora", "últimas unidades") | 🟡 Precaución |
| No usar exclusividad ("solo para ti") | 🟡 Precaución |
| No usar comparativos ("mejor", "más barato" sin fuente) | 🟡 Precaución |

## Promociones / Ofertas

| Concepto | Detalle |
|---|---|
| Producto/servicio | Ropa y equipamiento Patagonia de segunda mano |
| Descuento/promoción | No especificado — precios variables por pieza |
| Condiciones | Misma garantía de calidad que producto nuevo |
| Fecha de validez | Campaña ongoing (colección permanente) |
| Fuente | N/A — no hay promoción activa verificada |

## Referencias visuales

- Web principal: https://wornwear.patagonia.com/
- Marca madre (solo contexto): https://www.patagonia.com/home/
- NOTA: Worn Wear es submarca con identidad visual PROPIA — no asumir que comparte paleta, tipografía ni estilo de botón con patagonia.com

## From info (test)

| Campo | Valor |
|---|---|
| fromName | Patagonia Worn Wear (test) |
| fromEmail | test-wornwear@internal-newsletter.es |

## Logo

Si no se encuentra PNG utilizable para email (el SVG no vale como único formato), usar el nombre de marca como texto y dejar anotado como pendiente de cliente.

## Footer legal (test)

| Campo | Valor |
|---|---|
| Dirección física | [DIRECCIÓN POSTAL — PENDIENTE] |
| Aviso legal | [AVISO LEGAL — PENDIENTE] |
| Unsubscribe | [UNSUBSCRIBE_LINK] |
| Preferences | [PREFERENCES_LINK] |

## Riesgos detectados

- **Alto**: No hay brand pack previo para Worn Wear — todo el análisis visual depende de la investigación Chrome real
- **Alto**: Tentación de rellenar con cifras ambientales (Patagonia comunica mucha sostenibilidad) — prohibido sin fuente verificada
- **Medio**: La submarca puede tener identidad visual muy distinta de la marca madre — no asumir colores, tipografía ni estilo
- **Medio**: Logo PNG puede no estar disponible — plan B: texto
- **Bajo**: El CTA label real de la marca puede no encajar con las convenciones del sistema email (ej. frases largas, tono muy informal)

## Notas adicionales

- Campaña de test interno — no enviar a lista real
- Todos los textos legales de footer y dirección física son placeholders declarados
- production-gate-motor debe quedar en verde o con cada fallo documentado como bloqueo real
