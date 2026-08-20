# Links QA — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 08 (Email QA Specialist). Fecha: 2026-08-20. Verificación HTTP real (curl).

## CTAs (4 enlaces del HTML final)

| CTA | URL | HTTP | Content-Type |
|---|---|---|---|
| Descubrir la nueva era (hero) | https://www.mercedes-benz.es/passengercars/models/saloon/c-class/amg.html | ✅ 200 | text/html |
| Sentir cómo empuja (editorial 1) | https://www.mercedes-amg.com/en/c-class-sedan | ✅ 200 | text/html |
| La batería, al detalle (editorial 2) | https://www.mercedes-amg.com/en/c-class-sedan | ✅ 200 | text/html |
| Configurar el tuyo (cierre) | https://www.mercedes-benz.es/passengercars/mercedes-benz-cars/car-configurator.html/motorization/CCci/ES/es/bm/2060801 | ✅ 200 | text/html |

Nota: el shortener oficial `amg4.me/configure_c63se_sedan` (307) resuelve al configurador https
final — se usó el destino final en el HTML (mejor práctica email).

## Imágenes (3 del CDN oficial de la marca, imgix)

| Imagen | URL | HTTP | Content-Type |
|---|---|---|---|
| Hero | …/21dfb48e…-1440x810.jpg?fm=jpg&w=1200 | ✅ 200 | image/jpeg |
| Tren motriz | …/d3ff0fcc…-1440x1440.jpg?fm=jpg&w=560&h=420&fit=crop | ✅ 200 | image/jpeg |
| Batería | …/9be0cde6…-1440x1440.jpg?fm=jpg&w=560&h=420&fit=crop | ✅ 200 | image/jpeg |

⚠️ El `?fm=jpg` es obligatorio: con `?auto=format` el CDN negocia webp según el cliente (R-07).
Verificado: los 3 con `?fm=jpg` devuelven image/jpeg.

## Logo

- `https://PENDING-CDN-UPLOAD/mercedes-amg/logo.png` — placeholder del schema; se sustituye por
  el base64 del PNG local (`brands/mercedes-amg/design-input/logo-mercedes-amg-white-588.png`)
  en el embed post-build (agente 09). El raster deriva del lockup oficial
  (https://www.mercedes-amg.com/amg-logo.svg, HTTP 200 verificado).
- El SVG oficial NO se usa en el email (no renderiza en Gmail/Outlook clásico — R-08).

## UTM

Los 4 CTAs llevan UTM de la convención del pack:
`utm_source=newsletter&utm_medium=email&utm_campaign=c63-se-performance&utm_content={modulo}-cta`
(hero-cta, editorial1-cta, editorial2-cta, closing-cta). ✅

## Veredicto

✅ 6/6 URLs externas HTTP 200 (3 páginas + 3 imágenes). Único pendiente: logo (embed agente 09).
