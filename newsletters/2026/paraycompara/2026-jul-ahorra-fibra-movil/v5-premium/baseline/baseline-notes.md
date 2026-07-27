# Baseline Notes — v5-premium final-premium-v2.html

> Fecha: 2026-07-15
> Generado desde: `scripts/render-preview.js`
> Capturas: `baseline/base-{320,375,600,600-dark}.png`

---

## Estado de la pieza

| Check | Resultado |
|---|---|
| Checksum HTML | `31e848336bec24a78e58b843d8c5413a6fe9fcc3ee399928357409583dbb7b4d` |
| Captura 320px | ✅ 224.8 KB |
| Captura 375px | ✅ 227.6 KB |
| Captura 600px | ✅ 220.8 KB |
| Captura 600px dark | ✅ 220.8 KB — **idéntica a claro** (metas light/dark funcionando, sin inversión) |
| Playwright | 1.61.1 — Chromium con red real (fonts.gstatic.com HTTP 200) |
| Inline juice | 48.2 KB |

---

## Diagnóstico visual — 3 puntos con más recorrido de mejora

### 1. Hero editorial sin foto — bloque unificado sobre #5E2E91 (prioridad: alta)

**Dónde:** Hero completo (logo → eyebrow → H1 → subtítulo → cifra → CTA → microcopy).

**Qué se ve:** La solución tipográfica (patrón `heroEditorialNoPhoto`) funciona correctamente como sustituto de una imagen ausente. La jerarquía es clara, el contraste blanco/morado es bueno. Sin embargo, el fondo de 600×~500px de color sólido `#5E2E91` sin ningún elemento visual de apoyo (foto, ilustración, gráfico) hace que la mitad superior de la newsletter se sienta monocolor, especialmente en desktop.

**Qué haría falta:** El propio `component-patterns.md` §2 lo documenta: el hero editorial es un sustituto válido, no el estado final. Un asset real de marca (foto de producto, ilustración, gráfico comparativo) es la palanca de mayor impacto. El patrón decorativo (`brand-pattern-tile.png`) añade textura, pero no cambia que sea tipografía sobre color plano. **No forzar — esperar asset real.**

---

### 2. Iconos de tarifa — peso visual bajo sobre fondo blanco (prioridad: media)

**Dónde:** Sección "Compara todo tipo de tarifas", tarjetas Móvil / Fibra / Fibra+Móvil / TV.

**Qué se ve:** Los 4 iconos están liberados de su caja lila (cambio G1c, ahora a 48px directos sobre la tarjeta). Sin embargo, sobre el fondo blanco de la tarjeta, los iconos tienen poco peso visual — son trazos finos en morado/morado claro que apenas contrastan con el blanco. El ojo tarda en encontrarlos.

**Por qué:** Los PNGs del CDN pesan entre 1.8 KB (móvil) y 3.9 KB (fibra+móvil) — son trazos ligeros. A 48px sobre blanco, sin la caja lila que antes los rodeaba, se ven pequeños y difusos. La auditoría G3 ya documentó esta disparidad de peso como riesgo.

**Dirección de mejora:** Reemplazar los PNGs actuales por versiones con trazo más grueso (2-3px) o añadir un fondo sutil detrás de cada icono (un círculo lila muy claro de 52-56px) para que no floten sobre el blanco sin apoyo visual.

---

### 3. Línea conectora entre pasos — invisible a simple vista (prioridad: media-baja)

**Dónde:** Sección "Comparar es muy sencillo", entre los círculos 01, 02, 03.

**Qué se ve:** La línea conectora horizontal entre círculos usa `height:2px; background-color:#DCC7E5`. Sobre el fondo `#F8F5FC` de la sección, el contraste es mínimo (`#DCC7E5` vs `#F8F5FC` = apenas 1.3:1). En mobile la línea se oculta (`mobile-hide`), pero en desktop no se percibe como conexión — parece un artefacto del render, no un elemento intencionado.

**Por qué:** El color `#DCC7E5` funciona bien como halo de los círculos (donde contrasta contra el morado `#5E2E91`), pero como línea conectora sobre fondo lila se pierde. La auditoría G3 no detectó esto porque el vision_analyze no distinguió la línea del fondo.

**Dirección de mejora:** Oscurecer la línea conectora a un tono más visible sobre `#F8F5FC` (ej. `#C9A8DB` o subir opacidad), o cambiar a una línea punteada usando una celda de tabla con `background-repeat:repeat-x` (compatible email si se hace con un `<img>` de 1px de ancho repetido).

---

## Meta del bucle de verificación

Ninguna ronda futura de diseño se cierra sin:
1. Captura **antes** (desde el HTML previo)
2. Captura **después** (desde el HTML modificado)
3. Comparación visual de ambas

Ver `docs/visual-verification.md` para el flujo exacto.