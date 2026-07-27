# Structure — Nike Pegasus 42 Women

## Secuencia final

```
_shell.html (envoltorio)
├── Módulo 1: header-logo.html — Logo Nike (swoosh, placeholder)
├── Módulo 2: hero-imagen.html — Banner arte generado + H1 + subtítulo + CTA
├── Módulo 3: columns-3-beneficios-sin-icono.html — 3 beneficios de producto
├── Módulo 4: banda-cierre.html — Cierre + CTA
└── Módulo 5: footer.html — Legal placeholder
```

## Ritmo visual

| # | Sección | Fondo | Alineación | Densidad |
|---|---|---|---|---|
| 1 | Cabecera (logo) | `#FFFFFF` | Centrada | Baja |
| 2 | Hero (imagen + texto) | Imagen arriba + `#111111` abajo | Centrada | Alta (la fotografía lleva el peso visual) |
| 3 | Beneficios sin icono | `#F5F5F5` (surfaces.sectionLila) | Centrada | Media |
| 4 | Banda de cierre | `#111111` (colors.deep) | Centrada | Media |
| 5 | Footer | `#F5F5F5` (surfaces.global) | Centrada | Baja |

**Regla de ritmo**: Ninguna sección consecutiva repite fondo+alineación+densidad.
- 1→2: fondo cambia, densidad sube ✅
- 2→3: fondo cambia (#111111→#F5F5F5), densidad baja ✅
- 3→4: fondo cambia (#F5F5F5→#111111) ✅
- 4→5: fondo cambia, densidad baja ✅

## Claims prohibidos (copywriter fase 05)

Ver `campaign-angle.md` → sección Claims prohibidos.
