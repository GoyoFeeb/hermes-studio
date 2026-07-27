# ASSETS_PRODUCCIÓN — Para y Compara

> Fecha: 2026-07-09
> Campaña: 2026-jul-ahorra-fibra-movil

## Assets convertidos a PNG

| Archivo | Tamaño | Uso | Display | Ruta local |
|---|---|---|---|---|
| `logo-paraycompara.png` | 10.3 KB | Header — Logo marca (blanco sobre morado) | 200×55 px | `09-exports/assets/logo-paraycompara.png` |
| `tarifa-movil-icon.png` | 1.8 KB | Servicios — Icono tarifa móvil | 48×48 px | `09-exports/assets/tarifa-movil-icon.png` |
| `tarifa-fibra-icon.png` | 2.8 KB | Servicios — Icono tarifa fibra | 48×48 px | `09-exports/assets/tarifa-fibra-icon.png` |
| `tarifa-fibra-movil-icon.png` | 3.9 KB | Servicios — Icono fibra+móvil | 48×48 px | `09-exports/assets/tarifa-fibra-movil-icon.png` |
| `tarifa-tv-icon.png` | 2.6 KB | Servicios — Icono televisión | 48×48 px | `09-exports/assets/tarifa-tv-icon.png` |
| `paso-01.png` | 1.6 KB | Pasos — Círculo número 01 | 60×60 px | `09-exports/assets/paso-01.png` |
| `paso-02.png` | 1.8 KB | Pasos — Círculo número 02 | 60×60 px | `09-exports/assets/paso-02.png` |
| `paso-03.png` | 1.9 KB | Pasos — Círculo número 03 | 60×60 px | `09-exports/assets/paso-03.png` |
| `aspecto1.png` | 2.7 KB | Educativo — Icono datos móviles | 40×40 px | `09-exports/assets/aspecto1.png` |
| `aspecto2.png` | 6.1 KB | Educativo — Icono cobertura | 40×40 px | `09-exports/assets/aspecto2.png` |
| `aspecto3.png` | 3.5 KB | Educativo — Icono paquetes | 40×40 px | `09-exports/assets/aspecto3.png` |
| `aspecto4.png` | 2.6 KB | Educativo — Icono precio | 40×40 px | `09-exports/assets/aspecto4.png` |

**Total PNGs:** 12 archivos (~41 KB)

## Origen de los assets

Todos los assets provienen de la web oficial `https://paraycompara.com/assets/img/` y fueron convertidos de SVG a PNG mediante Playwright headless.

- **Logo original:** `logo-paraycompara.svg` — modificado a blanco (#FFFFFF) para fondo morado
- **Iconos servicios:** `tarifa-*-icon.svg` — 4 archivos, 48×48 px original
- **Círculos pasos:** Generados con Playwright (morado #792771, texto blanco, 60×60 px)
- **Iconos educativos:** `aspecto[1-4].svg` — 4 archivos, 40×40 px original

## Pendiente para producción

| Asset | Estado | Acción necesaria |
|---|---|---|
| Logo | ✅ PNG local | Subir a CDN y actualizar `src` en `newsletter-data.json` |
| Iconos servicios | ✅ PNG local | Subir a CDN y actualizar `src` |
| Iconos pasos | ✅ PNG local | Subir a CDN y actualizar `src` |
| Iconos educativos | ✅ PNG local | Subir a CDN y actualizar `src` |

### Recomendación de CDN

Subir todos los PNGs a un CDN (Cloudinary, Cloudflare R2, AWS S3, Vercel Blob) y reemplazar las rutas relativas `assets/...` por URLs absolutas HTTPS:

```
https://cdn.paraycompara.com/newsletters/2026/2026-jul-ahorra-fibra-movil/assets/logo-paraycompara.png
```

## Archivos de producción

| Archivo | Ruta | Tamaño |
|---|---|---|
| HTML final | `09-exports/final.html` | 38.7 KB |
| HTML inline (producción) | `09-exports/final-inline.html` | 29.1 KB |
| Preview PNG | `09-exports/final-preview.png` | 152.5 KB |
| Assets | `09-exports/assets/` | ~41 KB (12 archivos) |

## Nota sobre rutas

Los archivos `final.html` y `final-inline.html` usan rutas relativas `assets/...` para las imágenes. Para producción real, deben actualizarse a URLs absolutas HTTPS. Los archivos `final-preview.html` y `final-inline-preview.html` contienen rutas `file://` para preview local y no deben usarse en producción.