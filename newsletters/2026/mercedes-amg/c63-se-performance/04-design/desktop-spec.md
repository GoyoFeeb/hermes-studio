# Desktop Spec: Mercedes-AMG — C 63 S E PERFORMANCE

## Parámetros desktop

| Parámetro | Valor |
|---|---|
| Ancho de ventana objetivo | 600px |
| Viewport del contenedor | 600px centrado (x=340 a 1280) |

## Especificación por módulo

### Módulo 1 — Header (logo)

**Componente base:** header-logo
**Variante:** estándar (logo centrado, fondo blanco)

| Propiedad | Valor |
|---|---|
| Ancho | 600px |
| Fondo | #FFFFFF |
| Padding | 28px 24px |
| Margen inferior | 0 |
| Border-radius | 0 |
| Borde | none |

**Imagen:** logo `design-input/logo-mercedes-amg-white-588.png` (PNG, 588×138 nativo)
- Ancho: 150px | Alto: 35px | Alt: «Mercedes-AMG» (uso 1 de 3 del nombre)

**Texto:** — (solo imagen)

**CTA:** —

**Outlook:** PNG con width/height explícitos; sin VML.

### Módulo 2 — Hero (apertura)

**Componente base:** hero-imagen
**Variante:** banner real + copy sobre negro (fondo colors.primary)

| Propiedad | Valor |
|---|---|
| Ancho | 600px |
| Fondo | #000000 (colors.primary) |
| Padding | 0 (banner a sangre) / copy: 44px 40px 52px |
| Border-radius | 0 |
| Borde | none |

**Imagen:** banner `21dfb48e…-1440x810.jpg?fm=jpg&w=1200` (ratio 16:9)
- Ancho: 600px | Alto: 338px | Alt: «Sedán deportivo híbrido sobre asfalto nocturno» (sin marca)

**Texto:**
- brandName (eyebrow): MERCEDES-AMG · E PERFORMANCE — 11px/700/ls 2px uppercase, color #9F9F9F
  (onBrandSecondary — R-11: el rojo a 11px sobre negro falla AA) (uso 2 de 3 del nombre)
- H1: «Antes del ruido, el impulso.» — 34px/800/lh 1.08, #FFFFFF
- Body: 40 palabras, 16px/400/lh 1.5, #FFFFFF (body sobre brand → blanco)
- Nota: texto sobre color sólido negro, nunca sobre la foto (contraste calculable)

**CTA:** «Descubrir la nueva era»
- Tipo: Botón block | Color fondo: #B21E23 | Color texto: #FFFFFF | 16px/500/ls 0.5px
- Padding: 12px 24px | Border-radius: 0 | VML arcsize 0%

**Outlook:** VML roundrect rojo; fondo negro vía bgcolor.

### Módulo 3 — Editorial foto-texto (Revelación)

**Componente base:** editorial-foto-texto
**Variante:** imagen izquierda (46%) / texto derecha (54%)

| Propiedad | Valor |
|---|---|
| Ancho | 600px |
| Fondo | #FFFFFF |
| Padding | 56px 24px |
| Border-radius | 0 |
| Borde | none |

**Imagen:** tren motriz `d3ff0fcc…-1440x1440.jpg?fm=jpg&w=560&h=420&fit=crop` (recorte 4:3)
- Ancho: 254px | Alto: 190px | Alt: «Detalle del tren motriz híbrido» (sin marca)
- Nota: la fuente es 1440×1440 cuadrada; el recorte imgix a 4:3 la adapta a la columna 46%
  (R-12). Verificar en QA que el crop no corta el sujeto; alternativa: w=700 sin crop a ancho
  completo.

**Texto:**
- Eyebrow: LA RESPUESTA — 11px/700/ls 2px uppercase, color #B21E23 (rojo sobre blanco a 11px =
  3.11:1 falla AA para texto normal… ver Nota AA) — alternativa accesible: #8F1418 (derivado
  oscuro del mismo rojo, 6.14:1 sobre blanco) o mantener rojo solo como acento de 14px+. El
  agente 05/08 fijará la decisión final de contraste.
- H2: «Primero se mueve, luego ruge.» — 24px/800/lh 1.18, #000000
- Body: 40 palabras, 16px/400/lh 1.5, #4F4F4F

**CTA:** «Sentir cómo empuja»
- Tipo: Botón (secundario) | Color fondo: #B21E23 | Color texto: #FFFFFF | 16px/500/ls 0.5px
- Padding: 12px 24px | Border-radius: 0

**Outlook:** ⚠️ secundario con arcsize 50% hardcodeado → pastilla (R-09); evaluar primario block.

### Módulo 4 — Editorial foto-texto-inverso (Pausa / ingeniería)

**Componente base:** editorial-foto-texto-inverso
**Variante:** texto izquierda (54%) / imagen derecha (46%)

| Propiedad | Valor |
|---|---|
| Ancho | 600px |
| Fondo | #F2F2F2 (surfaces.sectionLila — separa del blanco del módulo 3) |
| Padding | 56px 24px |
| Border-radius | 0 |
| Borde | none |

**Imagen:** batería `9be0cde6…-1440x1440.jpg?fm=jpg&w=560&h=420&fit=crop` (recorte 4:3)
- Ancho: 254px | Alto: 190px | Alt: «Batería de alto rendimiento» (sin marca)

**Texto:**
- Eyebrow: HERENCIA DE F1 — 11px/700/ls 2px uppercase, color #B21E23 (misma nota AA que módulo 3)
- H2: «Una batería que aprendió en la F1.» — 24px/800/lh 1.18, #000000
- Body: 39 palabras, 16px/400/lh 1.5, #4F4F4F

**CTA:** «La batería, al detalle»
- Tipo: Botón (secundario) | Color fondo: #B21E23 | Color texto: #FFFFFF | 16px/500/ls 0.5px
- Padding: 12px 24px | Border-radius: 0

**Outlook:** ⚠️ misma nota R-09 del módulo 3.

### Módulo 5 — Banda-cierre

**Componente base:** banda-cierre
**Variante:** estándar centrada sobre oscuro

| Propiedad | Valor |
|---|---|
| Ancho | 600px |
| Fondo | #1A1A1A (surfaces.sectionDark / colors.deepAlt) |
| Padding | 64px 40px |
| Border-radius | 0 |
| Borde | none |

**Imagen:** —

**Texto:**
- H2: «El impulso de la nueva era.» — 24px/800/lh 1.18, #FFFFFF
- Body: 40 palabras, 16px/400/lh 1.5, #FFFFFF

**CTA:** «Configurar el tuyo» (CTA principal)
- Tipo: Botón block | Color fondo: #B21E23 | Color texto: #FFFFFF | 16px/500/ls 0.5px
- Padding: 12px 24px | Border-radius: 0 | VML arcsize 0%

**Outlook:** VML roundrect rojo; fondo #1A1A1A vía bgcolor.

### Módulo 6 — Footer

**Componente base:** footer

| Propiedad | Valor |
|---|---|
| Ancho | 600px |
| Fondo | #F2F2F2 (surfaces.global) |
| Padding | 32px 24px 40px |
| Border-radius | 0 |
| Borde | border-top: 1px solid #DDDDDD |

**Contenido:**
- Logo decorativo repetido: alt="" role="presentation" (NO consume presupuesto de marca)
- © 2026 Mercedes-AMG GmbH — 12px/700/ls 0.4px, #000000 (uso 3 de 3 del nombre)
- Línea legal WLTP (texto oficial ES pendiente Q-005): 11px/400, #9F9F9F
- Enlaces Darse de baja / Preferencias: 12px/400 underline, #4F4F4F

**Outlook:** sin VML; bgcolor #F2F2F2.
