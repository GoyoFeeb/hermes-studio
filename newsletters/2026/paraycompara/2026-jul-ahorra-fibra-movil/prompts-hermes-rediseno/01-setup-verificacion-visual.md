# PROMPT 01 — Montar el bucle de verificación visual (sin tocar el diseño)

## CONTEXTO

Eres el Orchestrator del sistema Hermes (`AGENTS.md` en la raíz). Trabajamos sobre la
campaña `newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/`, pieza vigente
`v5-premium/final-premium-v2.html` (estado G8.1, ver `v5-premium/qa-report.md`).

La lección más cara de esta campaña (regresión G8→G8.1): se entregaron rondas de diseño
sin verlas renderizadas. Eso se acabó. Esta ronda monta el bucle de verificación visual
que usarán todas las rondas siguientes. **En esta ronda NO se modifica la newsletter.**

## OBJETIVO

Dejar operativo y documentado un flujo repetible: cambio → inline → captura → revisión,
y producir el baseline visual de la pieza actual.

## TAREAS

1. Verifica que Chromium/Playwright funciona en el entorno. Si falta `libXdamage.so.1`,
   compila el stub (receta en `v5-premium/qa-report.md` § G8.1: 4 funciones XDamage vacías,
   `gcc -shared -fPIC`, y lanzar node con `LD_LIBRARY_PATH` apuntando al stub).
2. Crea un script reutilizable `scripts/render-preview.js` que:
   - reciba `--file` (HTML) y `--out-prefix`;
   - capture fullPage a 320, 375 y 600px de ancho, esquema claro;
   - capture además una pasada a 600px con `colorScheme: 'dark'` (verificación
     anti-inversión: la pieza debe verse IGUAL que en claro, por las metas light);
   - falle con exit code ≠ 0 si la navegación falla.
3. Genera el baseline de `v5-premium/final-premium-v2.html`:
   `v5-premium/baseline/base-320.png`, `base-375.png`, `base-600.png`, `base-600-dark.png`.
4. Revisa las capturas tú mismo (visualízalas) y escribe `v5-premium/baseline/baseline-notes.md`:
   qué funciona, qué se ve débil, y tu diagnóstico de los 3 puntos con más recorrido
   de mejora visual — será el insumo de las rondas 02 y 03. Sé crítico y concreto
   (con coordenadas/sección, no generalidades).
5. Documenta el flujo en `docs/visual-verification.md`: cómo se ejecuta, qué anchos,
   y la regla: **ninguna ronda de diseño se cierra sin captura antes/después revisada**.
6. Actualiza los 4 archivos de control de la campaña.

## RESTRICCIONES

- Prohibido modificar `final-premium-v2.html` o su inline en esta ronda.
- No borres capturas históricas existentes en `v5-premium/` (g8fix-*, g8-dark, g0-original).

## CRITERIOS DE ACEPTACIÓN

- [ ] `scripts/render-preview.js` existe y corre sin error sobre la pieza actual
- [ ] 4 PNGs de baseline generados y con contenido (peso > 50 KB cada uno)
- [ ] La captura dark es visualmente idéntica a la clara (metas light funcionando)
- [ ] `baseline-notes.md` con diagnóstico concreto de 3 mejoras priorizadas
- [ ] `docs/visual-verification.md` creado
- [ ] Control files actualizados; la pieza HTML sin un solo byte cambiado (verifícalo con checksum antes/después)
