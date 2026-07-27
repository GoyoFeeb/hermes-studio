# Structure — Rolex Datejust "Una fecha para recordar"

## Secuencia exacta de componentes

```
1. header-logo                    (required)  — Corona Rolex
2. hero-imagen                    (required)  — Foto macro generada (Datejust esfera verde) + H1 "Una fecha para recordar" + CTA "Descubrir el Datejust"
3. intro-cta-asimetrico           (optional)  — Título+cuerpo izquierda (64%), CTA outline derecha (36%) — la ventana de fecha
4. columns-3-beneficios-sin-icono (optional)  — 4 razones reales, sin icono: Oystersteel+Everose, hermeticidad Oyster, cronómetro certificado, ventana de fecha
5. banda-cierre-asimetrico        (required)  — Cierre con CTA "Descubrir el Datejust", título+cuerpo arriba, CTA suelto izquierda debajo
6. footer                         (always)    — Placeholder isTestCampaign
```

## Verificación contra PATTERN_SEQUENCE (`patterns/fotografia-primero.md`)

```
PATTERN_SEQUENCE del patrón fotografia-primero:
1. header-logo (required)                                    → ✅ incluido
2. hero-imagen (required)                                     → ✅ incluido (sin alternativa, único hero que admite este patrón)
-  intro-cta|intro-cta-asimetrico (optional, max 3)           → ✅ incluido 1x (intro-cta-asimetrico)
-  columns-3-beneficios-sin-icono (optional, max 2)           → ✅ incluido 1x
3. banda-cierre|banda-cierre-asimetrico (required)             → ✅ incluido (banda-cierre-asimetrico)
4. footer (required)                                           → ✅ incluido
```

Total: 6 módulos (dentro del rango 3-7 y del límite de 6 slots del patrón). El CTA principal aparece en el primer tercio (hero, módulo 2) y se repite en el cierre (módulo 5), mismo destino (`https://www.rolex.com/es/watches/datejust`).

## Ritmo fondo/alineación/densidad (regla dura — sin repeticiones consecutivas)

| # | Módulo | Fondo | Alineación | Densidad |
|---|---|---|---|---|
| 1 | header-logo | Blanco | Centrada | Baja |
| 2 | hero-imagen | Imagen a sangre + `colors.primary` (verde) debajo | Centrada | Alta |
| 3 | intro-cta-asimetrico | Blanco | Asimétrica (texto izq. 64% / CTA der. 36%) | Baja |
| 4 | columns-3-beneficios-sin-icono | `surfaces.sectionLila` (#F8F8F8) | Centrada | Media |
| 5 | banda-cierre-asimetrico | `colors.deep` (#0B3E27) | Asimétrica (texto arriba / CTA suelto izq.) | Media |
| 6 | footer | `surfaces.global` | Centrada | Baja |

1→2 cambia fondo+densidad. 2→3 cambia fondo+densidad. 3→4 cambia fondo. 4→5 cambia fondo+alineación. 5→6 cambia fondo+densidad. Sin dos combinaciones idénticas consecutivas.
