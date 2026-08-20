# Structure: Mercedes-AMG — C 63 S E PERFORMANCE

## Información general

| Campo | Valor |
|---|---|
| Cliente | Mercedes-AMG |
| Campaña | c63-se-performance |
| Total módulos | 6 |
| CTA principal | «Configurar el tuyo» |
| Posición del CTA | Módulo 5 (banda-cierre) |

## Estructura visual (desktop)

```
┌─────────────────────────────────┐
│    Módulo 1 — Header (logo)     │  blanco #FFFFFF
├─────────────────────────────────┤
│    Módulo 2 — Hero (imagen)     │  foto real a sangre + copy sobre negro #000000
├─────────────────────────────────┤
│  Módulo 3 — Editorial foto-texto│  blanco #FFFFFF  (imagen izquierda)
├─────────────────────────────────┤
│ Módulo 4 — Editorial inverso    │  blanco o #F2F2F2 (imagen derecha)
├─────────────────────────────────┤
│    Módulo 5 — Banda-cierre      │  negro #1A1A1A
├─────────────────────────────────┤
│  Módulo 6 — Footer + legal      │  gris #F2F2F2
└─────────────────────────────────┘
```

## Secuencia detallada

| Módulo | Nombre | Función | Imagen | Texto | CTA | Ritmo |
|---|---|---|---|---|---|---|
| 1 | Header | Abrir | Logo PNG (588×138) | alt «Mercedes-AMG» | — | Bajo |
| 2 | Hero | Enganchar | 21dfb48e…?fm=jpg&w=1200 | H1 «Antes del ruido, el impulso.» + body 40 palabras | «Descubrir la nueva era» | Alto |
| 3 | Editorial foto-texto | Explicar | d3ff0fcc…?fm=jpg&w=700 | «Primero se mueve, luego ruge.» + body 40 palabras | «Sentir cómo empuja» | Medio |
| 4 | Editorial inverso | Apoyar | 9be0cde6…?fm=jpg&w=700 | «Una batería que aprendió en la F1.» + body 39 palabras | «La batería, al detalle» | Pausado |
| 5 | Banda-cierre | Actuar | — | «El impulso de la nueva era.» + body 40 palabras | «Configurar el tuyo» | Medio |
| 6 | Footer | Legal | logo decorativo alt="" | copyright + WLTP + enlaces | — | Bajo |

Reglas de ritmo del patrón verificadas: 1→2 cambia fondo+densidad (blanco→imagen/negro, baja→alta);
2→3 cambia fondo+densidad; 3→4 cambia alineación (izq→der) y fondo si se usa #F2F2F2; 4→5 cambia
fondo+densidad (claro→negro); 5→6 cambia fondo+densidad. Sin dos consecutivos con la misma
combinación fondo+alineación+densidad.

## Comportamiento responsive

| Módulo | Desktop | Mobile | Notas |
|---|---|---|---|
| 1 | 600px centrado | 100% máx 600px | NORMA 600px: bgcolor en la propia tabla, nunca full-bleed |
| 2 | Banner 600px + copy sobre negro | Imagen `class="img"` fluidifica | Texto nunca sobre la foto |
| 3 | Columnas 46/54 (imagen/texto) | Columnas apiladas (`.col` block) | box-sizing border-box para evitar overflow |
| 4 | Columnas 54/46 (texto/imagen) | Columnas apiladas | — |
| 5 | CTA centrado | CTA full-width | — |
| 6 | Enlaces en línea | Enlaces apilados | — |

Verificación obligatoria: Playwright a 1280 → cada tabla top-level `width=600, x=340`,
`scrollWidth=1280`; a 375 y 320 sin overflow horizontal.

## Riesgos estructurales

| ID | Riesgo | Severidad | Módulo |
|---|---|---|---|
| SR-001 | CTA secundario (editorial) con arcsize VML 50% hardcodeado → pastilla en Outlook (R-09) | Baja | 3, 4 |
| SR-002 | Imágenes 1440×1440 cuadradas en columna 46% → recorte imgix o altura ajustada (R-12) | Baja | 3, 4 |
| SR-003 | Eyebrow rojo #B21E23 sobre negro falla AA 3.11:1 (R-11) | Media | 2, 5 |
| SR-004 | Dos editoriales en espejo pueden leerse como plantilla (R-17) | Baja | 3, 4 |
| SR-005 | Línea WLTP en DE/EN — falta texto oficial ES (Q-005) | Media | 6 |
| SR-006 | CTAs con 16px/500/ls 0.5px: el motor debe aplicar style block (radio 0) o radius.ctaPill 0 (R-10) | Baja | 2-5 |

## Claims prohibidos (handoff al agente 05 — copiar a 05-copy/body-copy.md)

- ❌ «Gratis», «gratuito», «garantizado», «sin condiciones»
- ❌ «Líder del segmento», «el mejor del mercado», «único/a» (salvo aprobación legal Q-004 del
  superlativo literal de Mercedes)
- ❌ Cifras técnicas disparadoras del claims gate en cuerpo: «potencia», «0 a 100», «tracción
  integral» (→ usar «AMG Performance 4MATIC+»), «velocidad máxima», «consumo» (+ tipo de
  combustible)
- ❌ Urgencia/exclusividad falsa: «última oportunidad», «edición limitada», «ahora», «no te lo
  pierdas»
- ❌ Precio (Q-001 pendiente), fecha/disponibilidad (Q-002), velocidad máxima (Q-003)
- ❌ Cualquier cifra no verificada en 00-brief/source-links.md
- ✅ Permitido (verificados): 500 kW / 680 CV, 350 kW + 150 kW, 1.020 Nm (con nota de par
  virtual), 3,4 s (reformulado), 6,1 kWh, 560 celdas, 4MATIC+ (nombre del sistema), dirección
  activa del eje trasero de serie, 8 programas, ~89 kg, herencia F1/HPP — SIEMPRE en frase con
  verbo y con `_claimSources` documentado
