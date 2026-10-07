# Prueba de modelos — 2026-10-06

Misma newsletter de Paredes (brief del 2026-10-05, petición pre-Black Friday para público joven), mismo encargo que
el worker (encargo autocontenido, ficha de producto, logo copiado, `--ignore-rules`), cinco modelos en paralelo con
`hermes chat -m`. Script: `bakeoff.ts`; registro: `registro-prueba.log`. Cada carpeta tiene `newsletter.html`,
`notas.md`, `_trabajo/encargo.md` y `_trabajo/render-hoja.jpg` (600, 375 y oscuro).

| Modelo | Total | HTML a los | Coste (estimación de Hermes) | Diseño |
|---|---|---|---|---|
| openai/gpt-6-luna | 16,9 min | 3,5 min | 0,086 $ | El mejor; corrige el titular «#25282a»; módulos propios; precio |
| deepseek/deepseek-v4.1-flash | 8,2 min | 3,7 min | 0,036 $ (precio de promoción) | Correcto; sigue el brief al pie de la letra |
| qwen/qwen3.8-flash | ~19 min (cortado a los ~45) | 6,8 min | ~0,07 $ | Bueno; banner ajeno «Pasos que nos unen» |
| moonshotai/kimi-k2.6 | 15,6 min | 7,2 min | 0,30 $ | Logo invisible en oscuro |
| deepseek/deepseek-v4-flash-0731 | 26,9 min | 12,9 min | 0,055 $ | El más flojo; banner ajeno |

Las cinco pasan `check-newsletter` sin errores. El banner ajeno venía de la página «Novedades» (fallo de la ficha
de producto, corregido en `3694f9f`). Decisión: GPT-6 Luna como modelo principal (`~/.hermes/config.yaml`).
`plantilla/` es la ficha de producto común que se copió a cada carpeta.
