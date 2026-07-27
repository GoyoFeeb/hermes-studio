# Structure — BMW X1 "Descubre"

## Secuencia exacta de componentes

```
1. header-logo                    (required)  — Logo BMW
2. hero-imagen                    (required)  — Imagen generada del X1 + titular "El nuevo BMW X1. Diseñado para emocionar." + CTA "Descubre el X1"
3. intro-cta                      (optional)  — Párrafo editorial + CTA
4. columns-3-beneficios           (required)  — 3 beneficios: diseño atemporal, tecnología intuitiva, versatilidad sin concesiones
5. banda-cierre                   (required)  — Cierre con CTA "Descubre el X1"
6. footer                         (always)    — Placeholder isTestCampaign
```

## Verificación contra PATTERN_SEQUENCE

```
PATTERN_SEQUENCE del patrón institutional:
1. header-logo (required)                       → ✅ incluido
2. hero-asimetrico|hero-centrado|hero-imagen|hero-marca-* (required)  → ✅ hero-imagen
3. intro-cta|intro-cta-asimetrico (optional)     → ✅ incluido (intro-cta)
4. columns-3-beneficios|card-tarifa-3|columns-3-beneficios-asimetrico (required) → ✅ columns-3-beneficios
5. category-grid|category-grid-img (optional)     → ❌ omitido (justificado en module-selection.md)
6. usp-cards|usp-cards-asimetrico (optional)     → ❌ omitido (justificado en module-selection.md)
7. banda-cierre|banda-cierre-asimetrico (required) → ✅ banda-cierre
8. footer (required)                             → ✅ footer
```

Total: 6 módulos (dentro del rango 3-7). El CTA principal aparece en el primer tercio (hero, módulo 2) y se repite en el cierre (módulo 5).
