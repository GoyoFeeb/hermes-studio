# Especificación del sistema de iconos — Para y Compara (G8)

> Resuelve D6 del prompt G8: dos lenguajes gráficos conviven en la pieza (PNGs de tarifa
> con pesos dispares + checks tipográficos ✓). Esta spec define el set unificado que debe
> producirse. Hasta que exista, el estado actual queda documentado como placeholder
> consciente — no se sustituye por assets inventados.

## Estado actual (placeholder consciente)

| Elemento | Implementación actual | Problema |
|---|---|---|
| Iconos de tarifa (4) | PNG 48×48 desde CDN | Pesos 1.8–3.9 KB (diferencia 2x, posible complejidad desigual de trazo — riesgo documentado en G3) |
| Checks de trust bar (3) | Carácter ✓ en círculo de 22px | Tipografía, no icono — placeholder intencional desde v5 base (ver component-patterns.md §3) |
| Checks de lista premium (4) | Carácter ✓ en círculo de 36px | Ídem |

## Set requerido (encargo a diseño / cliente)

**Formato**: PNG-24 con transparencia, @2x (renderizado a mitad de tamaño), optimizado <6 KB cada uno.

**Estilo unificado**: trazo continuo de 2px (a tamaño de render), esquinas redondeadas,
un solo color por icono (morado de marca #5E2E91 sobre claro / blanco sobre marca),
sin degradados, sin sombras internas, sin relleno sólido salvo acentos puntuales.

| Icono | Render | Archivo | Uso |
|---|---|---|---|
| Móvil | 48×48 (src 96×96) | `icon-movil@2x.png` | Tarjeta tarifa |
| Fibra | 48×48 | `icon-fibra@2x.png` | Tarjeta tarifa |
| Fibra+Móvil | 48×48 | `icon-convergente@2x.png` | Tarjeta tarifa |
| Televisión | 48×48 | `icon-tv@2x.png` | Tarjeta tarifa |
| Check | 20×20 (src 40×40) | `icon-check-20@2x.png` | Trust bar (dentro del círculo actual) |
| Check | 24×24 | `icon-check-24@2x.png` | Lista premium (dentro del círculo actual) |

**Criterio de aceptación del set**: los 6 iconos puestos en fila deben parecer de la misma
familia (mismo grosor óptico, misma esquina, mismo aire interno). Pesos dentro de un rango
de 1.5x entre el menor y el mayor.

**Al recibir el set**: sustituir `<p>✓</p>` por `<img>` con width/height explícitos y
`alt=""` (decorativo — el label textual adyacente ya comunica el significado), manteniendo
el círculo de fondo actual. Verificar HTTP 200 desde CDN y regenerar inline.

## Decisión sobre el ritmo hero→trust (G8 punto 3.8)

Revisado el corte duro morado→blanco introducido en G7: **no se puede juzgar sin render
real** (sin Chromium en el entorno de trabajo). Decisión: se mantiene el corte limpio y se
deja especificada la técnica compatible para la ronda de QA visual, por si el salto resulta
brusco al verlo:

> **Técnica de solapamiento compatible (sin margen negativo)**: dividir la fila de la trust
> bar en dos filas de tabla — la superior con `bgcolor` morado (#5E2E91) y la inferior
> blanca — y colocar la píldora en una tabla con `rowspan` visual falso: en email real esto
> se implementa con una única celda de fondo morado que contiene la mitad superior de la
> píldora con `padding-bottom:0`, seguida de celda blanca con la píldora completa y
> `margin-top` imposible → **la variante fiable es**: celda morada con padding inferior
> equivalente a media píldora + la píldora posicionada en la celda blanca con
> `padding-top:0`, aceptando que el "solape" es visual por proximidad, no real.
> Si el QA visual lo pide, implementar y capturar a 320/375/600px antes de aprobar.

## REQUISITO CUMPLIDO — Set oficial integrado (2026-07-17)

En la ronda 07 se descargaron los SVGs oficiales de `paraycompara.com` y se convirtieron a PNG:

| Uso | Archivo PNG | Tamaño | Origen SVG |
|---|---|---|---|
| Tarjeta Móvil | `icon-tarifa-movil.png` | 1.3 KB | `tarifa-movil-icon.svg` |
| Tarjeta Fibra | `icon-tarifa-fibra.png` | 1.9 KB | `tarifa-fibra-icon.svg` |
| Tarjeta Fibra+Móvil | `icon-tarifa-convergente.png` | 2.2 KB | `tarifa-fibra-movil-icon.svg` |
| Tarjeta Televisión | `icon-tarifa-tv.png` | 1.7 KB | `tarifa-tv-icon.svg` |
| Lista — Datos móviles | `icon-aspecto-datos.png` | 1.0 KB | `aspecto1.svg` |
| Lista — Cobertura | `icon-aspecto-cobertura.png` | 2.8 KB | `aspecto2.svg` |
| Lista — Paquetes | `icon-aspecto-paquetes.png` | 1.9 KB | `aspecto3.svg` |
| Lista — Condiciones | `icon-aspecto-condiciones.png` | 1.1 KB | `aspecto4.svg` |

Los 4 iconos de tarifa incluyen el círculo lila de fondo (rx="24" fill="#F7F0F7") del SVG original.
Los 4 iconos de lista se renderizaron con relleno blanco para visibilidad dentro del badge morado.
Trust bar: mantiene checks tipográficos ✓ (no hay icono oficial de check en paraycompara.com).

**Propuesta de la ronda 04 (rondas/assets/iconos-propuesta/) RECHAZADA** — el usuario pidió iconos oficiales de la web.

Los 8 PNGs están en `09-exports/assets/`, pendientes de subir al CDN.
Ver `09-exports/assets/ASSETS_PRODUCCION.md` para instrucciones de subida.

## Variantes white archivadas (base del futuro dark mode)

Los SVGs `icon-movil-white.svg`, `icon-fibra-white.svg`, `icon-tv-white.svg` se descargaron
de `paraycompara.com` y se archivaron en `01-inputs/images/oficiales/`. Cuando se reintroduzca
el dark mode, estos SVGs deberán convertirse a PNG y servirse desde el CDN.

## Requisito añadido en G8.1 — variantes dark-ready

El dark mode se retiró de la pieza (ver `qa-report.md` § G8.1) porque los iconos actuales
solo funcionan sobre fondo claro. Para reintroducirlo, el set debe incluir **variante clara
de cada icono** (trazo #E4CDF0 o blanco) con el sufijo `-dark` (ej. `icon-movil-dark@2x.png`),
más una variante del logo para fondo oscuro si el cliente la tiene. Sin ese set completo,
la pieza se mantiene forzada a modo claro (metas `color-scheme: light`).
