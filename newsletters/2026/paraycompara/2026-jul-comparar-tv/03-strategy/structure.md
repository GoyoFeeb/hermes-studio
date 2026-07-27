# Structure — 2026-jul-comparar-tv

Secuencia EXACTA de componentes del motor (verificada contra el bloque PATTERN_SEQUENCE de
patterns/saving.md — mismo orden, obligatorios completos, opcionales justificados en
module-selection.md):

1. hero-asimetrico      (required) — CTA principal en el primer tercio ✓
2. trust-bar            (optional, incluido)
3. card-tarifa          (required, 4 ítems, orden: TV / Fibra+Móvil / Fibra / Móvil)
4. pasos                (required, 3 ítems)
5. lista-premium        (optional, incluido con 3 ítems)
6. banda-cierre         (required)
7. footer               (required)

7 módulos (dentro del rango 3-7). Responsive: el que definen los componentes del motor
(mobile-* classes ya validadas) — sin comportamiento nuevo.
