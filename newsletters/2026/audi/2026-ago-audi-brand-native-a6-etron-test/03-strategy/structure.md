# Structure — Audi A6 Sportback e-tron

## Secuencia exacta de componentes del motor

```
header-logo → hero-imagen → editorial-foto-texto → editorial-foto-texto-inverso → columns-3-beneficios-sin-icono → banda-cierre → footer
```

## Detalle por módulo

| # | Componente | Fondo | Obligatorio/Opcional |
|---|-----------|-------|---------------------|
| 1 | header-logo | Blanco | Obligatorio |
| 2 | hero-imagen | Imagen real | Obligatorio |
| 3 | editorial-foto-texto | Blanco | Opcional |
| 4 | editorial-foto-texto-inverso | Blanco | Opcional |
| 5 | columns-3-beneficios-sin-icono | surfaces.sectionLila | Opcional |
| 6 | banda-cierre | colors.deep | Obligatorio |
| 7 | footer | surfaces.global | Obligatorio |

## Validación contra PATTERN_SEQUENCE de fotografia-primero
- ✅ 1. header-logo (required) — posición correcta
- ✅ 2. hero-imagen (required) — posición correcta
- ✅ - editorial-foto-texto (optional, max 3) — 1 instancia en zona libre
- ✅ - editorial-foto-texto-inverso (optional, max 3) — 1 instancia en zona libre
- ✅ - columns-3-beneficios-sin-icono (optional, max 2) — 1 instancia en zona libre
- ✅ 3. banda-cierre (required) — posición correcta
- ✅ 4. footer (required) — posición correcta

**Total: 7 módulos** (dentro del rango 3-7)
