# Brief — Mercedes-AMG C 63 S E PERFORMANCE

## 1. Datos del proyecto

| Campo | Valor |
|---|---|
| Cliente | Mercedes-AMG (Mercedes-Benz Group AG, Affalterbach) |
| Campaña | c63-se-performance (newsletter standalone, pipeline motor) |
| Fecha | 2026-08-20 |
| Patrón | fotografia-primero |
| Brand pack | brands/mercedes-amg/tokens/brand-tokens.json (v2.2.0, reutilizado) |
| Estado | briefing |

## 2. Contexto

Primera campaña del brand pack de Mercedes-AMG en el sistema (el pack se creó con la campaña
del GT 4 Puertas Coupé eléctrico, no ejecutada). Newsletter de producto para el
Mercedes-AMG C 63 S E PERFORMANCE (berlina), híbrido enchufable de altas prestaciones.

## 3. Concepto rector (UNA sola idea)

**«Antes del ruido, el impulso.»**

El orden de la respuesta: el motor eléctrico del eje trasero empuja al instante, y solo después
despierta el motor de gasolina. Es el hecho técnico del comunicado oficial («the electric motor
at the rear axle pushes powerfully from a standstill») convertido en experiencia sensorial y en
arco narrativo del cambio de era («the dawn of a new era»).

Todo titular de la pieza deriva de esta frase. Prohibido introducir un segundo concepto
independiente (ver `03-strategy/campaign-angle.md` cuando el agente 03 lo redacte).

## 4. Arquitectura narrativa (4 escenas)

| # | Escena | Función | Componente | Imagen (CDN oficial) |
|---|---|---|---|---|
| 1 | Apertura de impacto | Plantar concepto + coche, CTA de descubrimiento | hero-imagen | 21dfb48e…-1440x810 (?fm=jpg&w=1200) |
| 2 | Revelación de la capacidad clave | Respuesta inmediata del motor eléctrico trasero como experiencia | editorial-foto-texto (foto izq) | d3ff0fcc…-1440x1440 (?fm=jpg&w=700) |
| 3 | Pausa / detalle de ingeniería | Batería HPB 6,1 kWh de herencia F1: el origen del impulso | editorial-foto-texto-inverso (foto der) | 9be0cde6…-1440x1440 (?fm=jpg&w=700) |
| 4 | Cierre | Resolver el cambio de era + CTA de configuración | banda-cierre | — (fondo negro) |

Masthead: header-logo (logo oficial amg-logo.svg / raster PNG). Footer: footer (legal WLTP).

**NO usar** (hallazgo para agente 03): metric-strip-premium (formato «cifras sueltas sin verbo»
prohibido por el brief y por el propio pack: mustAvoid), columns-3-beneficios-sin-icono (no hay
3 argumentos comparables), intro-cta (el hero ya porta el CTA de descubrimiento; no hay párrafo
de transición).

## 5. Datos verificados (fuentes en source-links.md)

| Dato | Valor | Fuente | Estado |
|---|---|---|---|
| Potencia combinada | 500 kW / 680 CV (671 hp US) | mercedes-amg.com + media.mbusa.com | Confirmar con cliente |
| Motor térmico | 350 kW / 476 CV (469 hp US), 2.0 turbo 4 cil. | oficial | Confirmar |
| Motor eléctrico | 150 kW / 204 CV (201 hp US), eje trasero, P3, 2 veloc. | oficial | Confirmar |
| Par de sistema | 1.020 Nm (752 lb-ft; valor virtual calculado, nota oficial) | oficial | Confirmar + nota |
| Aceleración | 0-100 km/h 3,4 s (0-60 mph 3,3 s US) | oficial | Confirmar; reformular sin «0 a 100» |
| Velocidad máxima | 280 km/h (página oficial 2026-08-20) vs 250 ampliable (prensa 2022) | oficial vs prensa | **PENDIENTE** → no entra |
| Batería | 6,1 kWh (4,8 útiles), 400 V, 560 celdas, refrigeración directa, ~89 kg, pico 150 kW 10 s, HPP Affalterbach | media.mbusa.com | Confirmar |
| 4MATIC+ + dirección activa eje trasero | De serie, primera vez en C 63, Drift Mode | media.mbusa.com | Confirmar |
| Modos | 8 DYNAMIC SELECT, eléctrico puro hasta ~125 km/h, recup. 4 niveles (>100 kW) | media.mbusa.com | Confirmar |
| One man, One Engine | Cada motor, una persona | mercedes-amg.com | Confirmar |
| Consumo/CO₂ WLTP | 5,5 kWh/100km + 9 l/100km; 10,5 l/100km descargada; CO₂ 205 g/km | mercedes-amg.com | Solo legal footer |
| Logo | amg-logo.svg oficial + raster PNG pack | mercedes-amg.com | **Ya en brand pack** |

**PENDIENTES (no entran en la pieza):** precio España (carwow 155.497 € es tercero, no oficial),
fecha de disponibilidad comercial ES, matiz 250/280 km/h.

## 6. Copy (resumen — detalle en 05-copy/)

- Asunto: El impulso llega antes que el ruido
- Preheader: El C 63 S E PERFORMANCE responde desde el eje trasero antes de que despierte el
  motor de gasolina. Así empuja la nueva era híbrida de AMG. (1/3 «C 63»)
- Escena 1: H1 «Antes del ruido, el impulso.» / 500 kW: 350 del cuatro cilindros + 150 del
  motor eléctrico trasero. Pisas y la respuesta ya está ahí. (2/3) / CTA «Descubrir la nueva era»
- Escena 2: «Primero se mueve, luego ruge.» / motor eléctrico sobre el eje trasero, transmisión
  propia de 2 velocidades, par casi al instante, lo notas antes de oírlo. / CTA «Sentir cómo empuja»
- Escena 3: «Una batería que aprendió en la F1.» / 6,1 kWh, HPP, 560 celdas refrigeradas una a
  una, soltar y recuperar. / CTA «La batería, al detalle»
- Escena 4: «El impulso de la nueva era.» / 4MATIC+ y dirección activa, 500 kW donde tú quieres.
  (3/3) / CTA «Configurar el tuyo» → amg4.me/configure_c63se_sedan
- Presupuesto: «C 63» = 3 exactos. «Mercedes-AMG» = 3 (header alt, brandName hero, copyright).
  4 CTAs con string distinto (descubrir → configurar). Cero cifras sueltas; cero términos
  disparadores del claims gate en cuerpo (potencia, 0 a 100, tracción integral, velocidad
  máxima, consumo).

## 7. Restricciones del cliente (prompt original, vinculantes)

- La entrega falla si parece una plantilla de email marketing.
- 3-5 escenas como máximo, cada una con función narrativa distinta.
- Prohibido: barra de datos sueltos, grid 3 columnas icono+título+párrafo, bloques alternados
  foto-izq/texto-der repetidos 2+ veces con la misma composición, mismo CTA repetido,
  placeholders, logo reconstruido con CSS, claims sin respaldo oficial.
- Máx. 40 palabras por bloque de texto. «C 63» máx. 3 veces.
- NORMA 600px (todas las newsletters): cada escena incluido su fondo = tabla 600px centrada,
  nunca full-bleed. Verificar con Playwright 1280 (w=600, x=340).
