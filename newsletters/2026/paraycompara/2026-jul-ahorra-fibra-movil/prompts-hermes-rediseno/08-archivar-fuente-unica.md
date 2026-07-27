# PROMPT 08 — Archivar linajes muertos y declarar fuente única

## CONTEXTO

Eres el Orchestrator de Hermes. Una auditoría externa del sistema completo (no solo de
esta campaña) encontró que esta campaña tiene **tres HTML finales que no coinciden entre
sí**, y que `campaign-status.md` certifica como "production-ready" un archivo que no es
el que realmente se va a enviar. Antes de seguir avanzando (fusión de tokens, agentes
como archivos, motor único), hay que resolver esta ambigüedad — es la base de la que
depende todo lo demás.

Estado real verificado:

| Archivo | Origen | Problema |
|---|---|---|
| `09-exports/final.html` (56 KB, 14-jul) | Pipeline oficial (agente 07 → `export-html.tsx`) | Colores de marca **incorrectos**: usa `#6B2C5F`/`#F3E5F5`, no el morado real `#5E2E91`/`#3E244D`. No se ha vuelto a tocar desde el 14-jul — no incorpora ninguna de las rondas de rediseño. |
| `v3-premium/` (13-jul) | Intento manual anterior a v5, 8 variantes (`final-fixed`, `v4`, `v4.1`, `paraycompara-v3-premium-static`...) | Linaje abandonado. Sigue en el directorio raíz de la campaña sin ninguna nota de que esté descartado. |
| `v5-premium/final-premium-v2.html` (43 KB, 17-jul) | Edición manual + rondas Hermes 01-07 | Es el que de verdad es premium y el que se enviaría. **No está marcado como fuente oficial en ningún control file.** |

`campaign-status.md` dice `Production Gate: ✅ production-ready`, pero ese resultado
corresponde al pipeline oficial (que apunta a `09-exports/`), no a `v5-premium/`. Es una
certificación sobre el archivo equivocado.

## TAREAS

1. **Archivar, no borrar** (regla de oro "no borres nada" de AGENTS.md):
   - Crear `_archive/` en la raíz de la campaña.
   - Mover `v3-premium/` completo a `_archive/v3-premium/`.
   - Mover el `09-exports/final.html`, `09-exports/final-inline.html` y
     `09-exports/final-preview.png` actuales (los del pipeline oficial, con colores
     incorrectos) a `_archive/09-exports-pipeline-oficial-2026-07-14/`, conservando
     los demás contenidos de `09-exports/` (assets, production-blockers.md,
     delivery-notes.md, ASSETS_PRODUCCION.md) que sí son válidos.
   - Añadir un `README.md` dentro de `_archive/` explicando en 3-4 líneas por qué está
     cada cosa ahí y qué la reemplaza.

2. **Declarar fuente única**: copiar (no mover) `v5-premium/final-premium-v2.html` y su
   inline a `09-exports/final.html` y `09-exports/final-inline.html`, de modo que la
   ruta "oficial" de exportación de la campaña contenga de verdad la pieza premium.
   Verificar tras la copia que el archivo en `09-exports/` tiene los colores de marca
   correctos (`#5E2E91`, `#3E244D`) y no los antiguos.

3. **Re-certificar el gate sobre el archivo correcto**: ejecutar
   `npm run production-gate -- --campaign newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil`
   y confirmar que corre contra el `09-exports/final.html` recién actualizado (el premium).
   Si el script apunta a `06-data/newsletter-data.json` en vez de al HTML directamente,
   documenta esa limitación tal cual — no la ocultes ni la fuerces.

4. **Actualizar los 4 archivos de control** dejando constancia explícita de:
   - Qué se archivó y por qué (referencia a esta auditoría).
   - Que `v5-premium/final-premium-v2.html` (ahora también copiado a `09-exports/final.html`)
     es la única fuente de verdad de esta campaña desde 2026-07-17.
   - El resultado de la re-certificación del punto 3.

## RESTRICCIONES

- No se borra nada — todo lo que se retira va a `_archive/` con trazabilidad.
- No se modifica el contenido de `v5-premium/final-premium-v2.html` en esta ronda —
  esto es una operación de organización, no de diseño.
- Si `production-gate` falla por motivos ya conocidos (placeholders de baja/preferencias,
  `isTestCampaign: true`), es el resultado esperado — documentarlo como tal, no como
  error nuevo.

## CRITERIOS DE ACEPTACIÓN

- [ ] `_archive/v3-premium/` y `_archive/09-exports-pipeline-oficial-2026-07-14/` existen
      con todo el contenido original íntegro
- [ ] `_archive/README.md` explica el porqué
- [ ] `09-exports/final.html` y `final-inline.html` son copia exacta de `v5-premium/final-premium-v2.html`
      (verificar colores `#5E2E91`/`#3E244D` presentes)
- [ ] `production-gate` ejecutado y resultado documentado (pase o bloqueos conocidos)
- [ ] Los 4 archivos de control declaran explícitamente la fuente única y la fecha
