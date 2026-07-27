# Structure — Nike Pegasus 42

## Secuencia exacta de componentes

```
1. header-logo                    (required)  — Logo Nike (swoosh)
2. hero-imagen                    (required)  — Imagen generada del Pegasus 42 + titular "Nike Pegasus 42" + CTA "Comprar el Pegasus 42"
3. intro-cta                      (optional)  — Párrafo editorial "Diseñado para correr." + CTA
4. card-tarifa-3                  (required)  — 3 características: Air Zoom, ajuste mejorado, upper transpirable
5. banda-cierre                   (required)  — Cierre con CTA "Comprar el Pegasus 42"
6. footer                         (always)    — Placeholder isTestCampaign
```

## Verificación contra PATTERN_SEQUENCE

```
PATTERN_SEQUENCE del patrón institutional:
1. header-logo (required)                       → ✅ incluido
2. hero-asimetrico|hero-centrado|hero-imagen|hero-marca-* (required)  → ✅ hero-imagen
3. intro-cta|intro-cta-asimetrico (optional)     → ✅ incluido (intro-cta)
4. columns-3-beneficios|card-tarifa-3|columns-3-beneficios-asimetrico (required) → ✅ card-tarifa-3
5. category-grid|category-grid-img (optional)     → ❌ omitido (justificado en module-selection.md)
6. usp-cards|usp-cards-asimetrico (optional)     → ❌ omitido (justificado en module-selection.md)
7. banda-cierre|banda-cierre-asimetrico (required) → ✅ banda-cierre
8. footer (required)                             → ✅ footer
```

Total: 6 módulos (dentro del rango 3-7). El CTA principal aparece en el primer tercio (hero, módulo 2) y se repite en el cierre (módulo 5).
