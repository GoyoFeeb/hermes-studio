# PROMPT 26 — Campaña real end-to-end (la prueba del §0)

## CONTEXTO

Eres el Orchestrator de Hermes (`agents/00-orchestrator.md` — tu contrato está AHÍ, no en tu
memoria). El usuario te da el brief mínimo de abajo. Ejecutas el pipeline completo 01→09
siguiendo el archivo de contrato de cada agente, fase a fase, hasta entregar la campaña o
bloquearte con motivo explícito. Esta es la prueba de fuego final del plan de transformación:
lo que se mide no es solo la pieza, sino que el SISTEMA la produzca sin conocimiento externo a
sus archivos.

## BRIEF MÍNIMO (lo único que aporta el usuario)

- Cliente: Para y Compara (brand pack existente v2.2.2)
- Tema: {TEMA — lo fija el usuario al ejecutar}
- Objetivo: {OBJETIVO}
- CTA: {CTA_TEXTO} → {CTA_URL}
- Datos confirmados utilizables: {LISTA — solo datos ya validados en materiales existentes de
  la marca; nada nuevo sin confirmar}

## REGLAS DE EJECUCIÓN

1. **Cada fase se ejecuta leyendo su archivo `agents/NN-*.md` primero** y siguiendo sus
   secciones (Entradas → Tareas → Validaciones → Fase completada cuando). Si el archivo de
   agente resulta ambiguo o insuficiente en la práctica, eso es un HALLAZGO de F5 (se anota),
   no una licencia para improvisar.
2. **Cero intervención manual de diseño**: ningún valor visual que no salga de
   `brand-tokens.json` + `patterns/saving.md` vía el agente 04.
3. **Los 4 archivos de control se mantienen en cada transición** (contrato de 00) — al final,
   `npm run check-control-files` debe dar exit 0.
4. **Devoluciones internas permitidas y documentadas**: si QA devuelve, se corrige en el
   agente responsable y se re-ejecuta desde ahí — todo queda en `task-log.md` y `return.md`.
   Lo que NO está permitido es pedirle otro prompt al usuario para "terminar".
5. **Carpeta de campaña**: `newsletters/2026/paraycompara/{slug-de-campaña}/` creada con
   `npm run create-campaign` (scaffolding completo, incluidos los archivos de control).

## MEDICIÓN FINAL (después de 09)

1. `npm run production-gate-motor -- --campaign {campaña}` — los 6 gates. Exit 0, o cada
   fallo explicado como bloqueo del cliente (ej. `isTestCampaign:true` hasta aprobación real).
2. Render 320/375/600/600-dark de `final-inline.html` + comparación visual contra las
   capturas de la pieza validada (`engine/_test-output/orig-*.png` o regenerarlas de
   `v5-premium/final-premium-v2.html`): mismo sistema visual (hero asimétrico, trust bar,
   grid, pasos, lista, cierre, footer), sin regresiones de espaciado/sombras/contraste.
3. Conteo de intervenciones: prompts del usuario usados (debe ser 1), devoluciones internas
   (se reportan), ediciones manuales de HTML (debe ser 0 — `check-parity` lo confirma).

## CIERRE

`docs/f5-prueba-real-cerrada.md`: fecha, brief usado, tabla de fases con resultado y
devoluciones, resultado de los 6 gates, veredicto contra los 5 criterios del README del pack,
hallazgos sobre los archivos de agente (ambigüedades encontradas al usarlos de verdad),
limitaciones. Marcar `prompts-fase5-prueba-real/README.md` completado. Si el veredicto es
APTO, el plan de transformación entero (F0-F5) queda cerrado — anotarlo también en
`engine/CHANGELOG.md`.

## RESTRICCIONES

- No tocar la campaña piloto ni `2026-jul-revision-verano` (referencias de solo lectura).
- No editar el motor salvo que el pipeline lo exija vía la regla clave de 07 (componente
  faltante) — y entonces con los 5 pasos completos del contrato.
- No inventar datos de marca no confirmados (claims, cifras, promociones).
- La regla de honestidad del README del pack prevalece sobre el deseo de cerrar con APTO.
