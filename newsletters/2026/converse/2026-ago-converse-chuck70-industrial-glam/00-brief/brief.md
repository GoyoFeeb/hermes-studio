# Brief: Converse — 2026-ago-converse-chuck70-industrial-glam

## Información general

| Campo | Valor |
|---|---|
| Cliente | Converse |
| Campaña | 2026-ago-converse-chuck70-industrial-glam |
| Fecha de briefing | 2026-08-21 |
| Estado | created |
| Fuente del brief | Brief de dirección creativa (equipo Converse) + investigación primaria desde convers.com/es, ficha oficial del producto, cronología oficial de marca y Wikimedia Commons — verificado el 2026-08-21 |
| Mercado | España (converse.com/es) |

## Objetivo

Newsletter de relanzamiento/colorway para la **Chuck 70 Industrial Glam** (120 €, high top unisex): una edición de acabado envejecido — piel bruñida, cadena metálica, mediasuela desgastada — construida sobre la herencia del Chuck 70 (lanzado en 2013 sobre el diseño de los setenta del Chuck Taylor All Star). La pieza debe sentirse como una campaña editorial oficial de Converse — nunca como una newsletter de ecommerce genérica. Concepto rector único: **"Nuevas, con memoria."**

## CTA principal

"Hacerlas tuyas" — CTA de compra final → `https://www.converse.com/es/shop/p/chuck-70-industrial-glam-unisex/A18326C.html`
Estado: [REFERENCIA OFICIAL LOCALIZADA — pendiente de aprobación cliente]

## Enlace principal

https://www.converse.com/es/products/todos/iconos/chuck-70 (categoría Chuck 70 España)
https://www.converse.com/es/shop/p/chuck-70-industrial-glam-unisex/A18326C.html (PDP Industrial Glam)
Estado: ambos [REFERENCIA OFICIAL LOCALIZADA — pendiente de aprobación cliente]

## Audiencia objetivo

Segmento sneaker culture + fashion premium. Perfil: 20-40 años, urbano, valora la herencia de marca y los materiales (cultura sneaker, streetwear premium, conocedor de la historia de la Chuck). Sensible al detalle de construcción (acabado envejecido, cadena metálica) y al ADN vintage-premium de Converse. Mercado España.

## Tono y estilo

- **Editorial, no publicitario** — la pieza debe pertenecer a la marca, no parecer plantilla
- **Heritage + rebeldía** — honra la historia del modelo con actitud punk-glam (línea oficial: "Parte punk. Parte glamurosa. Totalmente Chuck.")
- **Concreto, no aspiracional vacío** — cada detalle de construcción es un dato real de la ficha
- **Fotografía protagonista** — fotografía de producto real (patrón `fotografia-primero`), sin iconos ni emojis
- **Veraz** — ningún claim sin fuente del paso 1; precios y tallas en frases con verbo

## Mensajes clave

- Concepto: **"Nuevas, con memoria."** — el acabado envejecido hace visible la historia del modelo
- Línea oficial de campaña: **"TÚ > TODO LO DEMÁS — Empieza de cero con unas Chuck nuevas."** (home ES, Evergreen BTS)
- Línea de categoría: **"Solo son zapatillas. Hasta que tú las llevas."** (categoría Chuck 70)
- Origen verificable: la Chuck 70 nació en **2013** sobre el diseño de los setenta ("In the early '70s, the Chuck Taylor got a makeover. Premium canvas. A varnished sole. Comfier cushioning.")
- Edición: acabado envejecido, piel bruñida, cadena metálica, mediasuela desgastada, plantilla OrthoLite

## Datos verificados de producto (ficha oficial ES, 2026-08-21)

| Dato | Valor |
|---|---|
| Producto | Chuck 70 Industrial Glam — high top unisex |
| SKUs | A18326C (Egret/Egret/Black), A18325MP (Black/Egret/Dark Matter) |
| Precio | 120,00 € |
| Colorways | 2: Egret/Egret/Black + Black/Egret/Dark Matter |
| Upper | "Parte superior de piel bruñida que eleva el look" (ficha ES) — ⚠️ iconos genéricos del template dicen "Lona de alta densidad"; pendiente confirmar material real |
| Detalles | Cadena metálica ("actitud rebelde sin concesiones"), mediasuela desgastada, acabado envejecido |
| Confort | Amortiguación OrthoLite |
| Ajuste | "Este modelo queda grande. Pide media talla menos." |
| Tallas | EU 35–45 disponibles (sin agotados en ficha el 21-08-2026) |
| Disponibilidad | A la venta ahora en converse.com/es |
| Copy oficial | "Sube el volumen con estas Chuck 70 de acabado envejecido." / "Parte punk. Parte glamurosa. Totalmente Chuck." |

## Referencias visuales

- **Web oficial ES**: converse.com/es — fotografía de producto protagonista, fondo blanco infinito, tipografía sans-serif limpia, header con wordmark negro
- **Campaña Evergreen BTS**: tile "TÚ > TODO LO DEMÁS" con fotografía lifestyle de las Chuck nuevas
- **Categoría Chuck 70**: "Estilo premium de inspiración vintage. Actualizaciones de comodidad modernas." — 113 resultados
- **Logo oficial**: wordmark Converse vigente (2017-) — `https://upload.wikimedia.org/wikipedia/commons/3/30/Converse_logo.svg` (verificado 200 OK, negro, transparente, PD-textlogo)

## Riesgos detectados

- Converse no tiene brand pack en el sistema — first-time onboarding completo (Akamai bloquea curl: la extracción de colores/fuentes requiere navegador)
- CDN de imágenes de Converse (`dw/image/v2/BJJF_PRD/...`, `on/demandware.static/...`) devuelve **403 a curl incluso con Referer+UA** (Akamai). URLs válidas en navegador — extraer en build vía navegador, NO marcar como rotas por 403 de curl
- Discrepancia material: iconos "At a Glance" del template dicen "Lona de alta densidad" pero el copy de la ficha dice "piel bruñida" → confirmar material real (open question)
- "Edición limitada" NO confirmado para Industrial Glam (solo confirmado en ficha para la collab Dragon Ball Z, que queda fuera de la pieza) → no usar urgencia/exclusividad
- Fecha exacta del drop en España no publicada en la ficha → no afirmar fecha
- Línea de campaña oficial ("Solo son zapatillas...") es copy de marca → requiere OK de Converse para usarla (se usa como resolución del concepto, subordinada)
- Patrón correcto: `fotografia-primero` (fotografía protagonista, sin iconos)
