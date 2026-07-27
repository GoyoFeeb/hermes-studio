# PROMPT 18 — Verificación y cierre de F2

## CONTEXTO

Eres el Orchestrator de Hermes. Los prompts 15-17 escribieron los 10 archivos de `agents/`.
Esta ronda no escribe agentes nuevos: audita que los 10 sean contratos ejecutables de verdad
(no la misma aspiracionalidad que ya se diagnosticó en `agentes/` vacío) y cierra F2, igual que
el prompt 14 cerró F1.

## TAREAS

1. **Auditoría de completitud**: para cada uno de los 10 archivos (`00` a `09`), verifica que
   tenga las 6 secciones (Rol / Lee / Escribe / Entrega a / Bloquea si / Regla clave), que cada
   "Bloquea si" sea una condición binaria comprobable (no una apreciación subjetiva tipo "si la
   calidad no es buena"), y que cada ruta de archivo mencionada sea real (existe hoy o es una
   ruta que el propio agente va a crear — no una ruta inventada).

2. **Auditoría de consistencia de cadena**: recorre el pipeline 00→09 y verifica que lo que un
   agente dice "Escribir" coincide exactamente con lo que el siguiente dice "Leer". Ejemplo
   concreto a comprobar: 06 escribe `campaign-data.json`, 07 debe leer exactamente esa ruta (no
   `newsletter-data.json`, residuo del pipeline viejo). Documenta cualquier desajuste
   encontrado y corrígelo en el archivo de agente correspondiente (edición dentro de `agents/`,
   no en el motor).

3. **Auditoría anti-aspiracional**: grep de `check-parity.js` y `check-control-files.js` en
   `agents/*.md` — cualquier mención debe ir acompañada de la aclaración de que son de F3 y
   qué se usa mientras tanto. Si algún archivo los referencia como si ya existieran, corrígelo.

4. **Prueba de lectura cruzada**: elige 1 agente (recomendado: `07-html-email-developer.md`,
   el que más cambia) y verifica, línea a línea, que alguien que NUNCA haya visto esta sesión
   podría ejecutar el rol solo con ese archivo + los archivos que referencia (`engine/README.md`,
   `campaign-data.schema.json`, etc.) — sin tener que adivinar ni preguntar. Si falta algo,
   añádelo.

5. **Cierre de F2**: actualiza `engine/CHANGELOG.md` si la auditoría tocó algo del motor (no
   debería — F2 es solo `agents/`); si no tocó nada, no añadas entrada vacía. Crea
   `docs/f2-agentes-cerrado.md` (mismo formato que `docs/f1-motor-cerrado.md`): fecha, qué se
   creó (10 archivos, lista), hallazgos de la auditoría (desajustes encontrados y corregidos),
   limitaciones conocidas (ej. dependencia de scripts de F3 todavía no escritos). Actualiza
   `prompts-fase2-agentes/README.md` marcando la fase completada, igual que se hizo en
   `prompts-fase1-motor/README.md` al cerrar F1.

## RESTRICCIONES

- No crear agentes nuevos ni tocar el motor, brand packs o campañas reales.
- Los únicos archivos que se modifican en este prompt son: los propios `agents/*.md` (si la
  auditoría encuentra desajustes), `docs/f2-agentes-cerrado.md` (nuevo),
  `prompts-fase2-agentes/README.md` (checklist), y `engine/CHANGELOG.md` solo si aplica.
- Si la auditoría encuentra un hallazgo que requiere cambiar el motor (no solo el texto de un
  agente), no lo arregles aquí — anótalo en `docs/f2-agentes-cerrado.md` como limitación
  conocida, con la fase/prompt que debería resolverlo.

## CRITERIOS DE ACEPTACIÓN

- [ ] Los 10 archivos de `agents/` auditados uno a uno contra el checklist de la tarea 1
- [ ] Cadena de lectura/escritura 00→09 verificada sin desajustes de nombre de archivo/ruta
- [ ] 0 referencias a `check-parity.js`/`check-control-files.js` como si ya existieran
- [ ] Prueba de lectura cruzada de al menos 1 agente documentada
- [ ] `docs/f2-agentes-cerrado.md` escrito con fecha, veredicto, hallazgos, limitaciones
- [ ] `prompts-fase2-agentes/README.md` con la fase marcada completada
