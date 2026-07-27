# PROMPT 04 — Assets y tipografía: el techo real de calidad

## CONTEXTO

Eres el Orchestrator de Hermes. Pieza: `v5-premium/final-premium-v2.html` (post rondas
02-03). Léete: `v5-premium/icon-system-spec.md` (spec completa del set de iconos, incluida
la exigencia dark-ready), `qa-report.md` § G8 (bug del font-face) y `02-analysis/brand-analysis.md`.

Los tres techos de calidad que ninguna ronda de CSS puede superar: (1) la Sora 800 nunca
ha cargado como fuente real, (2) los 4 iconos PNG tienen pesos/trazos dispares y conviven
con checks tipográficos, (3) el logo está a una sola resolución.

## OBJETIVO

Resolver todo lo resoluble sin depender del cliente, y dejar empaquetado y medible lo
que sí depende de él.

## TAREAS

1. **Sora 800 real**: obtén la URL del woff2 de Sora weight 800 (Google Fonts CSS API,
   `https://fonts.googleapis.com/css2?family=Sora:wght@800`, user-agent moderno para
   recibir woff2). Verifica HTTP 200 real. Añade el @font-face con esa URL, retira la
   nota G8-D1 del CSS y actualiza los tokens. Si el entorno no tiene red hacia Google
   Fonts, documenta el intento con el error exacto y deja la nota como está — no
   inventes URLs.
2. **Iconos**: comprueba si existen ya los assets de `icon-system-spec.md` en el CDN o
   en `01-inputs/images/` (el cliente puede haberlos entregado). Si existen: intégralos
   (img con dimensiones explícitas, alt correcto, HTTP 200 verificado) y sustituye los
   checks tipográficos según la spec. Si NO existen: genera los 6 iconos por código
   (SVG→PNG con el estilo de la spec: trazo 2px, mismo grosor óptico, paleta de marca)
   como PROPUESTA en `v5-premium/rondas/assets/iconos-propuesta/`, EXPÓRTALOS en una
   lámina de contacto (los 6 en fila sobre claro) y preséntalos para aprobación ANTES
   de integrarlos en la pieza. No se integra nada no aprobado.
3. **Verificación tipográfica visual**: con la 800 real cargada (si se logró), captura
   el hero antes/después y compara el peso de los titulares — debe notarse. Si no se
   nota en la captura, algo falla (fallback activo): diagnostica.
4. **Auditoría de peso de assets**: lista todos los recursos remotos de la pieza con su
   peso real (HTTP HEAD); marca cualquiera >100 KB como riesgo.

## RESTRICCIONES

- Nada de bancos de imágenes ni assets inventados "definitivos": lo generado por código
  es propuesta hasta aprobación explícita del usuario.
- No tocar composición ni copy (cerrados en 02-03). Esta ronda es solo assets/tipografía.
- Flujo de captura obligatorio de siempre (320/375/600 + 600-dark) para cualquier cambio
  que sí se integre.

## CRITERIOS DE ACEPTACIÓN

- [ ] Sora 800: o carga real verificada (URL distinta al woff2 del 700 + captura con
      diferencia visible) o intento documentado con error exacto
- [ ] Iconos: integrados (si había assets aprobados) o lámina de propuesta entregada
      para aprobación — nunca integrados sin aprobar
- [ ] Auditoría de peso de assets en la documentación de ronda
- [ ] Inline regenerado, tags balanceados, capturas revisadas si hubo cambios en pieza
- [ ] Ronda documentada + control files
