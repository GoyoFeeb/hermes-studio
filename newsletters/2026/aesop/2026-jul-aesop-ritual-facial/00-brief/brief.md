# Brief: Aesop — 2026-jul-aesop-ritual-facial

## Información general

| Campo | Valor |
|---|---|
| Cliente | Aesop |
| Campaña | 2026-jul-aesop-ritual-facial |
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

Dar a conocer la gama de cuidado facial (Skin Care) de Aesop a suscriptores que ya conocen la marca por producto de manos/cuerpo, y llevarlos a explorar esa categoría en la web.

## Ángulo

El cuidado de la piel como ritual cotidiano, no como promesa de resultados. Aesop no vende "transformación": describe fórmulas, ingredientes y gestos. Seguir ese registro.

## CTA principal

| Campo | Valor |
|---|---|
| Etiqueta | A decidir por Copy (Agente 05), coherente con voz real de la marca |
| Destino | `https://www.aesop.com/skin-care.html` |
| UTM | `?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-aesop-ritual-facial&utm_content={modulo}-cta` |
| UTM content | Convención mayoritaria del sistema: `{modulo}-cta` (hero-cta, intro-cta, closing-cta) |

## URLs verificadas (estructura plana, sin prefijo de región)

| Recurso | URL | Estado |
|---|---|---|
| Home | https://www.aesop.com/ | ✅ Verificada |
| Skin Care (CTA destino) | https://www.aesop.com/skin-care.html | ✅ Verificada |
| Hand & Body | https://www.aesop.com/hand-and-body.html | ✅ Verificada |
| Fragrance | https://www.aesop.com/fragrance.html | ✅ Verificada |
| Hair | https://www.aesop.com/hair.html | ✅ Verificada |

## Audiencia objetivo

Suscriptores que ya conocen Aesop por productos de manos/cuerpo pero quizás no han explorado la línea facial. Conocen la estética de la marca, confían en la calidad, pero no saben que Aesop tiene una gama facial completa.

## Tono y estilo

- Aesop no vende transformación — describe fórmulas, ingredientes, gestos
- Registro casi literario: preciso, sensorial, sin superlativos vacíos
- Sin promesas de resultados ("reduce arrugas", "hidratación 24h")
- Traducir el tono al español — no calcar la sintaxis del inglés

## Mensajes clave

- Aesop tiene una gama completa de cuidado facial
- Los productos faciales siguen la misma filosofía que manos/cuerpo: ingredientes de calidad, fórmulas bien pensadas
- El cuidado de la piel como ritual, no como tarea
- Invitación a explorar, no urgencia de compra

## Restricciones de claims

| Restricción | Tipo |
|---|---|
| No inventar propiedades de producto (ingredientes, beneficios, texturas) | 🔴 BLOQUEANTE |
| No inventar precios ni promociones | 🔴 BLOQUEANTE |
| Nombres de producto: copiar LITERAL de la web | 🔴 BLOQUEANTE |
| No usar "gratuito"/"free" | 🟡 Precaución |
| No usar urgencia ("ahora", "edición limitada") | 🟡 Precaución |
| No usar transformación ("rejuvenece", "anti-edad") | 🟡 Precaución |
| No usar comparativos sin fuente ("mejor que", "más eficaz que") | 🟡 Precaución |

## Promociones / Ofertas

| Concepto | Detalle |
|---|---|
| Producto/servicio | Gama de cuidado facial Aesop |
| Descuento/promoción | N/A — Aesop no hace descuentos |
| Condiciones | Sin promociones activas |
| Fecha de validez | N/A |
| Fuente | Web oficial |

## Referencias visuales

- Web principal: https://www.aesop.com/
- Categoría destino: https://www.aesop.com/skin-care.html
- NOTA: Aesop tiene identidad visual MUY particular: tipográfica, minimalista, sin modelos/aspiracional. Probablemente no comparte nada con marcas de lujo convencionales.

## From info (test)

| Campo | Valor |
|---|---|
| fromName | Aesop (test) |
| fromEmail | test-aesop@internal-newsletter.es |

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

- **Alto**: No hay brand pack previo para Aesop — todo el análisis visual depende de investigación Chrome real.
- **Alto**: Aesop tiene una identidad visual MUY distinta a las marcas del sistema. Puede que el motor actual (bordes, tarjetas, sombras, iconos) no encaje con su estética minimalista tipográfica. Ver protocolo de "frontera del lenguaje de diseño del motor" en newsletter-pipeline skill.
- **Alto**: Tentación de inventar propiedades de producto (ingredientes, texturas, beneficios) — prohibido sin fuente verificada.
- **Medio**: Los nombres de producto de Aesop son muy reconocibles y fáciles de escribir mal — copiar literal de la web.
- **Medio**: Logo PNG puede no estar disponible — Aesop probablemente usa SVG en su web.
- **Bajo**: Sin promociones, descuentos ni urgencia — la campaña es puramente editorial.
