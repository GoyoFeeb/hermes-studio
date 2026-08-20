# Open Questions — Mercedes-AMG C 63 S E PERFORMANCE

> Formato [Q-NNN] (Pregunta / Contexto / Impacto / Destinatario). Estado: briefing.

## [Q-001] Precio oficial en España

- **Pregunta:** ¿Cuál es el PVP oficial vigente del C 63 S E PERFORMANCE en España?
- **Contexto:** La web oficial de Mercedes-Benz España (mercedes-benz.es) no expone el precio en
  la página modelo accesible; la única cifra localizada (155.497 €) procede de carwow.es, un
  tercero, no de fuente oficial Mercedes.
- **Impacto:** El precio NO entra en la pieza hasta confirmarlo con fuente oficial (regla: no
  inventar precios). Si llega confirmado, se inserta en frase con verbo en la escena de cierre.
- **Destinatario:** Cliente / Mercedes-Benz España.

## [Q-002] Fecha de disponibilidad comercial vigente en España

- **Pregunta:** ¿Está el C 63 S E PERFORMANCE en comercialización activa en España a fecha de
  envío, y hay alguna fecha/condición vigente (MY 2026)?
- **Contexto:** La página oficial del modelo está activa con configurador; Car and Driver ya
  cubre el modelo como «2026 C63». No hay comunicado oficial ES con fecha de disponibilidad.
- **Impacto:** La pieza no puede afirmar plazos, «novedad» ni urgencia sin confirmación.
- **Destinatario:** Cliente.

## [Q-003] Velocidad máxima: 280 vs 250 km/h

- **Pregunta:** ¿Qué cifra oficial se usa? La página de producto de mercedes-amg.com declara
  280 km/h (2026-08-20); la prensa de lanzamiento (2022) documentaba 250 km/h de serie
  ampliable opcionalmente.
- **Contexto:** Posible diferencia entre versión/serie y paquete opcional, o actualización del
  catálogo. Conflicto entre fuente oficial actual y prensa.
- **Impacto:** La velocidad máxima NO entra en la pieza hasta resolver. (Además dispararía el
  claims gate si se usara la palabra «máxima».)
- **Destinatario:** Cliente / legal.

## [Q-004] Superlativo «el cuatro cilindros de producción más potente del mundo»

- **Pregunta:** ¿Puede la pieza reproducir la afirmación de Mercedes-AMG («world's most powerful
  production four-cylinder engine», media.mbusa.com) en el mercado español?
- **Contexto:** Es afirmación literal de la marca en su comunicado oficial; aun así es un
  superlativo y el claims gate lo marca HIGH.
- **Impacto:** Si legal aprueba, se usa atribuido a la marca y documentado en `_claimSources`
  del campaign-data.json; si no, se retira de la copy (el concepto no depende de él).
- **Destinatario:** Cliente / legal.

## [Q-005] Línea legal WLTP en español

- **Pregunta:** ¿Texto legal oficial ES de consumo/emisiones (WLTP) para el footer?
- **Contexto:** La página oficial de producto expone la línea en alemán/inglés
  (5,5 kWh/100 km + 9 l/100 km; 10,5 l/100 km batería descargada; CO₂ 205 g/km). El footer del
  email debe llevar el texto oficial del mercado ES.
- **Impacto:** El footer no puede cerrar en producción (productionReady:false) sin la línea
  legal correcta. Mientras tanto, placeholder de campaña de prueba.
- **Destinatario:** Cliente / legal.
