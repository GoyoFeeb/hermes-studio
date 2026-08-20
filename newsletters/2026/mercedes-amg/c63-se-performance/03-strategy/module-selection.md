# Module Selection: Mercedes-AMG — C 63 S E PERFORMANCE

## Resumen

| Total módulos | 6 |
|---|---|
| CTA principal en módulo | 5 (banda-cierre) |

Patrón: `fotografia-primero` (PATTERN_SEQUENCE: header-logo required → hero-imagen required →
zona libre: editorial-foto-texto* máx 3, metric-strip máx 2, columns-3-sin-icono máx 2 →
banda-cierre required → footer required).

## Secuencia de módulos

### Módulo 1 — Header (logo)

**Posición:** 1 de 6
**Tipo:** header
**Función:** Abrir
**Contenido esperado:** Logo oficial Mercedes-AMG (raster PNG del pack,
`logo-mercedes-amg-white-588.png`; alt «Mercedes-AMG» = 1 de los 3 usos del nombre), centrado,
sobre blanco.
**Justificación:** Obligatorio del patrón. El logo real del pack (nunca reconstruido con CSS).
**Ritmo:** Bajo
**Notas responsive:** NORMA 600px — tabla 600 centrada; en mobile fluidifica a 100% máx 600.
**Riesgos:** R-08 (SVG no va en email → usar PNG raster).

### Módulo 2 — Hero

**Posición:** 2 de 6
**Tipo:** hero (imagen real)
**Función:** Enganchar (apertura de impacto)
**Contenido esperado:** Banner real del CDN oficial (`21dfb48e…-1440x810.jpg?fm=jpg&w=1200`),
copy sobre negro: eyebrow/brandName MERCEDES-AMG · E PERFORMANCE, H1 «Antes del ruido, el
impulso.», body 40 palabras (500 kW…), CTA «Descubrir la nueva era».
**Justificación:** Obligatorio del patrón (hero-imagen sin alternativa). El hero del sitio real es
fotografía a sangre con titular + CTA integrados; el motor traduce con banner en su fila + copy
sobre `colors.primary` (negro). Planta el concepto.
**Ritmo:** Alto (la fotografía lleva el peso visual)
**Notas responsive:** Imagen con `class="img"` (fluidifica); copy sobre negro siempre; texto
nunca sobre píxeles de foto (contraste calculable).
**Riesgos:** R-07 (fm=jpg), R-13 (600px).

### Módulo 3 — Editorial foto-texto (Revelación)

**Posición:** 3 de 6
**Tipo:** editorial
**Función:** Explicar (revelación de la capacidad clave como experiencia)
**Contenido esperado:** Imagen izquierda (tren motriz `d3ff0fcc…-1440x1440.jpg?fm=jpg&w=700`),
texto derecha: eyebrow LA RESPUESTA, título «Primero se mueve, luego ruge.», body 40 palabras,
CTA «Sentir cómo empuja».
**Justificación:** Traducción del bloque editorial «Engine & Drivetrain — The best of all
worlds» de la página real (ver brand-structure-translation.md). Es la escena que la página 2
(héroe) no da: cómo se siente el primer movimiento. Composición foto-izquierda única (el
segundo editorial es inverso → no se repite la misma composición).
**Ritmo:** Medio
**Notas responsive:** Columnas apiladas en mobile (`.col` con box-sizing border-box); imagen 46%
en desktop.
**Riesgos:** R-12 (imagen cuadrada en columna), R-09 (CTA secundario VML).

### Módulo 4 — Editorial foto-texto-inverso (Pausa / ingeniería)

**Posición:** 4 de 6
**Tipo:** editorial
**Función:** Probar / Apoyar (momento de pausa: el origen del impulso)
**Contenido esperado:** Imagen derecha (batería `9be0cde6…-1440x1440.jpg?fm=jpg&w=700`), texto
izquierda: eyebrow HERENCIA DE F1, título «Una batería que aprendió en la F1.», body 39
palabras, CTA «La batería, al detalle».
**Justificación:** Traducción del bloque «High-performance battery — A forward-looking
powerhouse» (página real). Espejo del módulo 3 (foto derecha) — el patrón lo permite
explicitamente (max 3; alternar foto y texto es la forma del género). Fondo blanco como el 3 o
`#F2F2F2` (sectionLila) si el agente 04 necesita separación; ambos valores son del pack.
**Ritmo:** Pausado
**Notas responsive:** Columnas apiladas; imagen 46%.
**Riesgos:** R-12, R-09, R-11 (eyebrow rojo → gris/blanco sobre oscuro).

### Módulo 5 — Banda-cierre

**Posición:** 5 de 6
**Tipo:** cta-block
**Función:** Actuar / Cerrar
**Contenido esperado:** Fondo negro `#1A1A1A` (colors.deepAlt / surfaces.sectionDark): título «El
impulso de la nueva era.», body 40 palabras (4MATIC+ y dirección activa…), CTA principal
«Configurar el tuyo».
**Justificación:** Obligatorio del patrón (banda-cierre). Cierra el arco del concepto con el
espejo del hero (negro) y la acción final (configurar — verbo de compra, primero descubre/
último configura).
**Ritmo:** Medio
**Notas responsive:** CTA full-width en mobile.
**Riesgos:** R-11 (eyebrow/título blanco sobre negro ok; rojo no), R-10 (style block).

### Módulo 6 — Footer

**Posición:** 6 de 6
**Tipo:** legal
**Función:** Legal / Social
**Contenido esperado:** Logo decorativo (alt=""), copyright «© 2026 Mercedes-AMG GmbH» (= 1 uso
nombre), línea legal WLTP (5,5 kWh/100 km + 9 l/100 km; 10,5 l/100 km batería descargada; CO₂
205 g/km) — texto oficial ES pendiente (Q-005) → placeholder de prueba, enlaces baja/preferencias.
**Justificación:** Obligatorio del patrón. La línea WLTP solo aquí (nunca en cuerpo).
**Ritmo:** Bajo
**Notas responsive:** Enlaces apilados.
**Riesgos:** Q-005 bloquea productionReady.

## Módulos descartados (hallazgo formal para el agente 03 / 06)

| Módulo disponible en patrón | Decisión | Motivo |
|---|---|---|
| intro-cta / intro-cta-asimetrico | NO | El hero ya porta el CTA de descubrimiento; no hay párrafo de transición que no repita la función de la escena 2 (regla del patrón: solo si el brief aporta transición real) |
| metric-strip-premium | NO | Es exactamente el formato «tira de cifras sueltas sin verbo» prohibido por el brief y por el pack (mustAvoid: «Tiras o tarjetas de cifras sueltas»; contentRhythm marca el Model overview como no traducible) |
| columns-3-beneficios-sin-icono | NO | No hay 3 argumentos de beneficio comparables; la pieza es cinematográfica, no de grid |
