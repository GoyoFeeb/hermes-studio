# Structure — BMW Experiencia Premium

## Secuencia exacta de componentes del motor

```
header-logo.html → hero-imagen.html → intro-cta.html → columns-3-beneficios-sin-icono.html → banda-cierre.html → footer.html
```

## Validación contra PATTERN_SEQUENCE de fotografia-primero

| Orden | Componente | Ancla/Zona | Estado en patrón | Valida |
|-------|-----------|------------|-----------------|--------|
| 1 | `header-logo.html` | Ancla 1 | `required` | ✅ |
| 2 | `hero-imagen.html` | Ancla 2 | `required` | ✅ |
| 3 | `intro-cta.html` | Zona libre | `optional, max 3` | ✅ |
| 4 | `columns-3-beneficios-sin-icono.html` | Zona libre | `optional, max 2` | ✅ |
| 5 | `banda-cierre.html` | Ancla 3 | `required` | ✅ |
| 6 | `footer.html` | Ancla 4 | `required` | ✅ |

## Reglas de ritmo verificadas

| Transición | Cambio fondo | Cambio densidad | Válido |
|-----------|-------------|----------------|--------|
| 1→2: header → hero | Blanco → Imagen | Baja → Alta | ✅ |
| 2→3: hero → intro-cta | Imagen → Blanco | Alta → Baja | ✅ |
| 3→4: intro → columns-3 | Blanco → `sectionLila` | Baja → Media | ✅ |
| 4→5: columns → banda-cierre | `sectionLila` → `deep` | Media → Media | ✅ (cambia fondo) |
| 5→6: banda → footer | `deep` → `global` | Media → Baja | ✅ |

## CTA principal

- Aparece en el primer tercio (hero, módulo 2 de 6) ✅
- Se repite en intro-cta y banda-cierre
- URL: `https://www.bmw.es/es/home.html`

## Conteo

- 6 módulos totales (rango permitido: 3-7) ✅
- Cero módulos con icono (BMW usa `iconDensity: nula`) ✅
- Variante `-sin-icono` para columns ✅
