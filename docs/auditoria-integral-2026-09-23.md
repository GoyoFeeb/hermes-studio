# Auditoría integral de Hermes Newsletter System

Fecha: 23 de septiembre de 2026. Checkout local `5e52ac9` y archivos locales presentes. No se han aplicado correcciones al código ni sobrescrito exportaciones originales.

## Dictamen

**El motor tiene una base funcional y pruebas útiles; el flujo completo de Studio no está listo para un uso desatendido en producción.** Hay fallos confirmados de seguridad, integración y despliegue que no detecta la suite actual.

Se documentan **17 hallazgos: 9 de prioridad alta y 8 media**, además del estado de las campañas. Alta significa resolver antes de exponer Studio o confiar en su cierre automático; media, un fallo operativo que debe abordarse en el siguiente bloque. No se asigna prioridad crítica basándose en un despliegue que no se ha inspeccionado.

## Alcance y método

- Revisión del motor, schemas, componentes, patrones, scripts, Studio backend/frontend, cola, persistencia, Docker y CI; lectura de AGENTS.md, contexto, memoria y .agent.
- Inventario de las 27 campañas con 06-data/campaign-data.json bajo newsletters/2026, 33 carpetas de marca y 45 HTML en la raíz.
- Reconstrucción de las 27 campañas en /tmp y ejecución de siete controles individuales por campaña. No se ejecutó el gate maestro sobre sus carpetas originales porque reconstruye y sobrescribe exports.
- Pruebas HTTP/navegador sobre una copia temporal con archivos ficticios, sin claves de proveedor y listener limitado a localhost.
- Sin envío de emails, generación facturable de IA, publicación ni cambios de infraestructura. No se certificaron Gmail/Outlook reales ni se inspeccionaron cuentas cloud.
- No se mostraron secretos. La búsqueda de formatos habituales de claves en archivos versionados no encontró coincidencias; no fue un análisis exhaustivo del historial Git.
- analisis/ y _archive/ se trataron como históricos, no como implementaciones activas.

## Resultados medidos

| Verificación | Resultado |
|---|---|
| npm test | **81/81 pasan**; fuera del sandbox tras bloqueo IPC de tsx |
| npm audit contra registro | **0 vulnerabilidades conocidas informadas**, 214 dependencias contabilizadas |
| Integridad | **68 archivos** coinciden con el lock |
| Inventario | **30 componentes**, sin desajustes; 5 parciales excluidos |
| TypeScript | **Falla**; 35 diagnósticos tras superar la deprecación inicial |
| CI del ejemplo | OK tolerando structural-differentiation; cinco gates diferidas por exploración |
| Docker Compose config | **Falla**, ruta incorrecta de .env |
| Reconstrucción en /tmp | **25 pasan / 2 fallan** |
| Paridad de exports existentes | **15 pasan / 10 fallan / 2 omitidas** sin manifest |
| Archivos de control | **25 pasan / 2 fallan** |
| Completitud de brand pack | **21 pasan / 6 fallan** |
| Informe visual Nivel 5 | **0 pasan / 27 fallan** |
| Diferenciación estructural | **18 pasan / 9 fallan** |
| Contraste automatizado | **26 comandos pasan / 1 falla**; algunas combinaciones se omiten |
| Readiness | 27 pasan, pero **todas son pruebas**: isTestCampaign:true y productionReady:false |

Pasar un checker documental no demuestra la calidad de la investigación; pasar contraste de tokens tampoco equivale a medir todos los textos del HTML real. El OK de CI no es un cierre completo de producción.

## Hallazgos

### H01 · Alta · Lectura de JSON fuera de la carpeta de trabajos

**Evidencia:** [studio/server/store.ts:45](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/store.ts:45). El ID de /api/jobs/:id se utiliza como parte de la ruta sin validar su formato ni confinar la ruta resultante. En una copia temporal, una petición autenticada a /api/jobs/..%2Foutside devolvió HTTP 200 y el JSON ficticio de studio/data/outside.json, fuera de jobs/.

**Impacto:** Un usuario de Studio puede leer otros JSON accesibles al proceso. Con ALLOW_NO_AUTH la ruta queda sin autenticación. No se leyó ningún secreto real.

**Corrección propuesta:** Validar IDs con un patrón cerrado, confinar rutas y validar la estructura Job; añadir pruebas HTTP de barras codificadas y secuencias ..

### H02 · Alta · Los tokens de marca permiten introducir JavaScript en el HTML

**Evidencia:** [engine/lib/assemble.js:440](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/engine/lib/assemble.js:440). Los tokens se insertan literalmente; el schema de brand-tokens admite superficies arbitrarias y verifyBuild no rechaza atributos de eventos. Un valor ficticio de surfaces.global añadió onload: el schema lo aceptó, el build devolvió 0 y Chromium ejecutó una marca inocua en memoria al abrir final-inline.html.

**Impacto:** Está demostrada la generación de HTML activo. Studio lo previsualiza en un iframe sin sandbox (studio/web/index.html:79). Si ese HTML llega a completarse y se sirve en el origen de Studio, falta aislamiento. No se ha demostrado una cadena completa mediante respuestas reales del proveedor de IA.

**Corrección propuesta:** Validar cada tipo de token, escapar según el contexto, bloquear scripts/eventos/protocolos activos y aislar la previsualización con sandbox, origen separado y CSP.

### H03 · Alta · La captura acepta direcciones internas y esquemas locales

**Evidencia:** [studio/server/brandCapture.ts:48](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/brandCapture.ts:48). brandUrl solo se comprueba por presencia antes de page.goto. En una prueba, el servidor ficticio 127.0.0.1 recibió una petición real. file:// llegó a la evaluación del documento, donde apareció H07. No hay filtros de protocolo, red privada, redirecciones ni subrecursos.

**Impacto:** Un usuario autorizado puede provocar peticiones desde el servidor a destinos ajenos al análisis de una web pública. H07 no impide la petición inicial. No se consultaron redes privadas ajenas ni metadatos cloud.

**Corrección propuesta:** Permitir solo HTTP(S) público, comprobar DNS/IP y cada redirección/subrecurso, y limitar la salida de red del navegador. Referencia: [OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

### H04 · Alta · Las imágenes del email requieren la contraseña de Studio

**Evidencia:** [studio/server/index.ts:70](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/index.ts:70). La autenticación global se instala antes de /assets (línea 90). heroImage.ts construye las URLs del email usando esa ruta. La misma imagen ficticia devolvió 401 sin credenciales y 200 con Basic Auth.

**Impacto:** Los destinatarios y el QA sin credenciales no pueden cargar estas imágenes; el gate HTTP también puede bloquearlas por 401.

**Corrección propuesta:** Publicar solo los assets finales en un almacenamiento/ruta pública con URLs estables. Mantener privados tokens, informes y fuentes: no hacer público todo brands/.

### H05 · Alta · El build Docker incluye archivos locales sin excluir secretos

**Evidencia:** [studio/Dockerfile:15](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/Dockerfile:15). COPY . . usa el contexto completo. No existe .dockerignore ni studio/Dockerfile.dockerignore; sí existen .env, studio/.env, .git y node_modules. Se verificó la configuración, sin construir ni publicar una imagen y sin mostrar variables.

**Impacto:** Una construcción desde este directorio puede incorporar los .env a la imagen, mezclar dependencias locales de macOS con las instaladas para Linux y arrastrar campañas/archivos innecesarios.

**Corrección propuesta:** Añadir exclusiones Docker, COPY explícitos e inyección de secretos solo en ejecución. .gitignore no sustituye a .dockerignore. Referencia: [contexto Docker](https://docs.docker.com/build/concepts/context/).

### H06 · Alta · El límite de autenticación se elude si se accede directamente al servidor

**Evidencia:** [studio/server/index.ts:53](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/index.ts:53). trust proxy vale 1 y rateLimit usa req.ip. Compose publica el puerto 3000. En la copia local, después de recibir 429, cambiar únicamente X-Forwarded-For devolvió 401 y permitió nuevos intentos.

**Impacto:** La limitación no es efectiva cuando el cliente llega directamente o cuando el proxy no protege las cabeceras. No se ha verificado la topología de un despliegue Railway.

**Corrección propuesta:** Confiar solo en el proxy real, restringir el puerto interno y sobrescribir cabeceras. Referencia: [Express y proxies](https://expressjs.com/en/guide/behind-proxies/).

### H07 · Alta · La captura de marcas nuevas falla con el runtime actual

**Evidencia:** [studio/server/brandCapture.ts:51](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/brandCapture.ts:51). La función styleOf está anidada dentro de page.evaluate. La transformación con tsx introduce el helper __name, ausente en el navegador. Dos páginas controladas reprodujeron: page.evaluate: ReferenceError: __name is not defined.

**Impacto:** El análisis automático de una marca nueva no puede completar esta captura en el entorno probado, aunque la página cargue.

**Corrección propuesta:** Hacer autosuficiente el callback que se envía al navegador y probarlo con Playwright real bajo el mismo runtime que usa Studio.

### H08 · Alta · Studio no genera todos los entregables que exige el cierre

**Evidencia:** [studio/server/phases/brandPhase.ts:20](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/phases/brandPhase.ts:20). La fase 02 pide tokens y tres documentos, pero check-brand-visual-report-completeness exige otros nueve artefactos. El runner omite toda la fase 02 cuando la marca existe. Las 27 campañas revisadas fallan ese checker.

**Impacto:** Una respuesta que cumpla exactamente el contrato de Studio deja entregables de producción sin generar. Reutilizar la marca tampoco crea la documentación propia de la campaña.

**Corrección propuesta:** Separar documentos reutilizables de marca y documentos por campaña; producir y validar ambos al terminar la fase 02. Investigar lo que falta o registrar un bloqueo real; no inventar evidencias.

### H09 · Alta · Un código de salida 0 no garantiza aprobación de producción

**Evidencia:** [scripts/production-gate-motor.ts:513](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/scripts/production-gate-motor.ts:513). Si falta campaign-data.json, el gate sale con 0. runProductionGate convierte cualquier 0 en ok:true. Una carpeta vacía reprodujo ese resultado. Además, productionReady:true con isTestCampaign:true y un asunto [Q-001] pasó el schema y check-production-readiness.

**Impacto:** Se confunden omisión, validación de prueba y certificación. El modo exploración difiere gates y puede acabar con el mismo mensaje de éxito. No se afirma que una carpeta vacía complete por sí sola las fases anteriores.

**Corrección propuesta:** Resultado JSON con passed/failed/skipped y nivel test/production. Exigir coherencia de flags, cero omisiones obligatorias y una promoción explícita a producción.

### H10 · Media · Se bloquean briefs que dicen que no tienen preguntas bloqueantes

**Evidencia:** [studio/server/runner.ts:59](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/runner.ts:59). La expresión /bloqueante/i se aplica a todo el documento. Sin preguntas bloqueantes, Pregunta no bloqueante y Todas las preguntas bloqueantes están resueltas produjeron true.

**Impacto:** Un brief válido se detiene por negaciones o preguntas ya resueltas, generando retrabajo.

**Corrección propuesta:** Preguntas estructuradas con severidad y estado; bloquear únicamente las abiertas y bloqueantes.

### H11 · Media · Una fase puede sobrescribir archivos de otras fases

**Evidencia:** [studio/server/campaignFs.ts:69](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/campaignFs.ts:69). textPhase comprueba que estén los archivos esperados, pero guarda todos los recibidos. Se permite la campaña completa como raíz. En una prueba temporal, un archivo adicional sobrescribió un documento ajeno al entregable esperado dentro de esa campaña.

**Impacto:** La frontera entre especialistas depende de que el modelo respete el prompt; una respuesta adicional accidental o inducida puede alterar datos o documentación de fases anteriores.

**Corrección propuesta:** Lista exacta de archivos por fase, rechazo de extras y duplicados, validación de todo el lote antes de escribir y versiones/escrituras atómicas.

### H12 · Media · El estado del panel y los documentos de campaña no se sincronizan

**Evidencia:** [studio/server/runner.ts:31](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/runner.ts:31). Las transiciones modifican store/eventos, pero no actualizan los cuatro archivos de control. create-campaign deja created. check-control-files admite ese estado con documentos de plantilla.

**Impacto:** El panel puede indicar un resultado mientras los archivos que leen los agentes siguen en el inicio. El checker actual no detecta necesariamente esta divergencia.

**Corrección propuesta:** Una transición canónica que genere las cuatro vistas documentales y compruebe los entregables reales antes del cierre.

### H13 · Media · La auditoría de paridad por conjunto está rota

**Evidencia:** [scripts/check-parity.ts:197](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/scripts/check-parity.ts:197). resolveCampaignPath recibe un argumento aunque exige root y raw. Ejecutar --campaign-set newsletters/2026/nike produjo ERR_INVALID_ARG_TYPE: Received undefined.

**Impacto:** La auditoría por lotes no revisa ninguna campaña; las pruebas existentes no cubren ese comando.

**Corrección propuesta:** Pasar ROOT y añadir una prueba con varias campañas para --campaign-set.

### H14 · Media · TypeScript no pasa y CI no lo comprueba

**Evidencia:** [tsconfig.json:5](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/tsconfig.json:5). tsc --noEmit falla por TS5107. Al omitir solo esa deprecación en el comando aparecen 35 diagnósticos: referencias al React Email archivado, ImportMeta.dirname, Error.cause y la llamada de H13.

**Impacto:** La suite puede pasar mientras el compilador ya detecta fallos. La configuración mezcla código vigente y artefactos antiguos.

**Corrección propuesta:** Configurar el código activo, alinear runtime/lib/tipos Node, corregir los errores y ejecutar typecheck en CI; usar npm ci y documentar versiones compatibles.

### H15 · Media · STUDIO_MODEL en .env se carga demasiado tarde

**Evidencia:** [studio/server/anthropicClient.ts:23](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/anthropicClient.ts:23). MODEL se fija durante el import; index.ts carga .env después de importar el runner. Un .env ficticio dejó process.env.STUDIO_MODEL con audit-configured-model mientras MODEL conservó claude-sonnet-5.

**Impacto:** La configuración de modelo del archivo .env se ignora. Una variable inyectada antes de arrancar sí puede funcionar.

**Corrección propuesta:** Cargar configuración antes del runner o resolver el modelo al hacer la llamada. No se ha evaluado disponibilidad comercial del modelo configurado.

### H16 · Media · Docker Compose busca .env en una ruta inexistente

**Evidencia:** [studio/docker-compose.yml:9](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/docker-compose.yml:9). docker compose -f studio/docker-compose.yml config --quiet falló buscando studio/studio/.env. Las entradas env_file son relativas al directorio del compose.

**Impacto:** El comando de despliegue documentado no llega a levantar el servicio con la estructura actual.

**Corrección propuesta:** Usar ../.env y .env, o una configuración explícita equivalente. Referencia: [env_file de Compose](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/).

### H17 · Media · Un JSON corrupto puede impedir el arranque de Studio

**Evidencia:** [studio/server/store.ts:83](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/studio/server/store.ts:83). listJobs parsea todos los archivos sin aislar errores y recoverOnStartup lo llama antes de listen. Un JSON ficticio truncado hizo fallar listJobs. updateJob sobrescribe directamente el archivo.

**Impacto:** Una escritura interrumpida puede afectar a todos los trabajos y al arranque, aunque el resto esté íntegro.

**Corrección propuesta:** Escritura temporal y rename, validación por registro, cuarentena con aviso y recuperación/backup verificable.

## Campañas y contenido: qué está pendiente

**Dos campañas no se reconstruyen.** Para y Compara / 2026-jul-comparar-tv tiene 46 caracteres en el título de banda-cierre, frente al máximo de 45. Tarífalo / 2026-jul-tarifalo-compara-energia utiliza card-tarifa con tres tarjetas, pero requiere cuatro; existe card-tarifa-3. Son datos pendientes de migrar/ajustar, no motivos para relajar el motor.

**Diez entregas difieren de sus manifiestos.** Esto demuestra divergencia, no su autoría ni su causa. Hay exports muy por encima del límite interno de 90 KiB: Adidas, 1.938,1 KiB; Apple iphone-17-pro-premium, 4.685,7 KiB; New Balance premium, 894,4 KiB. Revisar qué versión fue aprobada y generar la entrega reproducible; no recalcular hashes para legitimar diferencias sin investigar.

**Las 27 campañas fallan Nivel 5.** Es deuda de contenido ya documentada, no un nuevo bug del checker. Persiste el problema operativo: Studio tampoco solicita todos esos entregables. Nueve campañas fallan diferenciación, seis completitud del pack y dos archivos de control.

**33 carpetas de marca; 18 con tokens canónicos.** Las otras 15 no ofrecen todavía un pack reutilizable en la ubicación de Studio; pueden ser carpetas de assets o trabajo ad hoc.

**45 HTML de raíz; 37 contienen imágenes base64 y 19 superan 90 KiB.** Son archivos, no necesariamente campañas únicas. Su presencia no demuestra un envío real; sí una vía que no queda cubierta por los gates del motor. Conviene diferenciar una vista local de revisión y el artefacto final de envío, ambos vinculados a la misma fuente.

**Contraste:** el checker de Converse marca #757575 sobre #F4F4F4, 4,19:1 frente a 4,5. Es una combinación del pack; no se afirma haber comprobado que todos los textos de la pieza concreta usen esa combinación.

## Mejoras por orden de ejecución

| Orden | Trabajo | Resultado verificable |
|---|---|---|
| 1 | Resolver H01–H06; validar entradas de API por schema | Rutas confinadas, HTML sin código activo, navegación pública controlada, assets accesibles y documentos privados, rate limit efectivo, imagen sin secretos |
| 2 | Resolver H07–H12 y separar aprobación interna/producción | Un job de marca nueva y otro de marca existente completan todos los entregables; una omisión nunca certifica producción |
| 3 | Resolver H13–H17 y ampliar integración en CI | typecheck y comandos pasan; .env decide modelo; compose valida; un archivo corrupto no tumba el servicio |
| 4 | Regularizar campañas y packs prioritarios | Corregir las dos campañas rotas, revisar las diez divergencias y completar las evidencias de marcas en uso |
| 5 | Unificar exploración rápida y entrega controlada | Promover exploraciones a producción sin remaquetar manualmente; conservar fuente, estado y manifest |
| 6 | Mejorar QA y uso diario | Revisar el inline exacto entregado; mostrar incidencias y reanudar la fase responsable |

No se recomienda añadir componentes por anticipado. Medir qué composiciones faltan en marcas reales y crear solo las variantes necesarias; el catálogo y los controles existentes deben conectarse a inputs y entregables verificables.

Mejoras adicionales, separadas de los fallos reproducidos:

- **QA del artefacto exacto:** qaExportPhase captura final.html, entrega final-inline.html y ejecuta un gate que reconstruye después de QA. Vincular la aprobación visual al hash exacto del inline y evitar alterarlo después. Chromium con colorScheme dark no certifica Outlook ni las transformaciones de color de otros clientes; añadir ensayos reales en las plataformas objetivo.
- **Veredicto de QA:** validar un schema completo y exigir blockers vacío si verdict es Aprobado; hoy esa coherencia no se comprueba.
- **HTTP de producción:** production-gate-motor.ts:313 convierte fallos sin respuesta en avisos. Un DNS roto puede no bloquear. Separar ejecución offline de certificación de envío; decodificar entidades HTML al extraer URLs y contemplar servidores que rechazan HEAD.
- **Continuidad y coste:** timeout/cancelación por fase y job, límites de tokens/imágenes y reintentos acotados para errores transitorios. El fetch de hero no tiene timeout explícito; una espera prolongada bloquea la cola secuencial.
- **Persistencia y reproducibilidad:** backups comprobados, recuperación por fase e idempotencia. El motor escribe tres archivos secuencialmente: validar en memoria no hace atómicas las escrituras ante fallos de disco. Añadir hashes de pack, patrón y versión del motor al manifest.
- **Interfaz:** historial/búsqueda, cancelación, reanudación y errores accionables. Al pulsar Nuevo no se cancela el polling anterior; manejar ese temporizador, los errores de red y la navegación atrás/adelante.
- **CI:** una campaña sintética que pase todas las gates, red simulada en pruebas y comprobación real de assets antes de entregar. Studio necesita pruebas de rutas, fases, persistencia y navegador; sus tests actuales se centran en rateLimit.
- **Documentación e integridad:** renovar el punto de entrada para incluir Studio y requisitos runtime actuales. El lock no cubre todos los helpers scripts/lib; ampliar la vigilancia cuando cambien reglas compartidas.

## Límites

El análisis corresponde a los archivos locales observados. No demuestra explotación ni un despliegue público afectado. Los fallos de TypeScript no implican que el motor sea inutilizable: 25 campañas y 81 pruebas funcionaron. npm audit informa sobre vulnerabilidades conocidas de dependencias, no sobre la seguridad de la lógica propia.

No se ha certificado entregabilidad, SPF/DKIM/DMARC, bajas reales del ESP, consentimiento ni cumplimiento jurídico del contenido. Tampoco se ha reevaluado la fidelidad visual de cada pack contra su web actual.

## Evidencias y reproducción

Los archivos de docs/auditoria-2026-09-23 conservan salidas/códigos por campaña, pruebas locales, logs de tests, typecheck, CI y npm audit. No contienen claves de API.

Comandos ejecutados desde sistema-final:

```sh
npm test
node --import tsx scripts/check-engine-integrity.ts
node --import tsx scripts/check-component-inventory.ts
node --import tsx scripts/check-parity.ts --campaign-set newsletters/2026/nike
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/tsc --noEmit --ignoreDeprecations 6.0
docker compose -f studio/docker-compose.yml config --quiet
npm run ci:example-campaign-gate
npm audit --json
```

Para reconstruir en una auditoría, utilizar --out temporal. production-gate-motor escribe exports; no es un comando puramente de lectura.



## Matriz individual de campañas

OK = el comando pasó; F = falló; OMITIDA = no se pudo auditar por ausencia de manifest. No equivale a aprobación de envío. Todas las filas corresponden a campañas de prueba.

| Campaña | Build | Paridad | Control | Pack | Nivel 5 | Estructura | Contraste |
|---|---|---|---|---|---|---|---|
| [adeslas/2026-jul-adeslas-seguro-medico](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/06-data/campaign-data.json) | OK | F | OK | F | F | F | OK |
| [adidas/2026-jul-adidas-premium-run](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/adidas/2026-jul-adidas-premium-run/06-data/campaign-data.json) | OK | F | OK | F | F | OK | OK |
| [apple/iphone-17-pro-premium](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/apple/iphone-17-pro-premium/06-data/campaign-data.json) | OK | F | OK | OK | F | OK | OK |
| [audi/2026-ago-audi-brand-native-a6-etron-test](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/audi/2026-ago-audi-brand-native-a6-etron-test/06-data/campaign-data.json) | OK | OK | OK | OK | F | OK | OK |
| [audi/2026-jul-audi-premium](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/audi/2026-jul-audi-premium/06-data/campaign-data.json) | OK | OK | OK | OK | F | F | OK |
| [bmw/2026-ago-bmw-brand-native-restauracion-test](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/bmw/2026-ago-bmw-brand-native-restauracion-test/06-data/campaign-data.json) | OK | OK | OK | OK | F | OK | OK |
| [bmw/2026-ago-bmw-experiencia-premium](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/bmw/2026-ago-bmw-experiencia-premium/06-data/campaign-data.json) | OK | OK | OK | OK | F | F | OK |
| [bmw/2026-ago-bmw-m4-coupe](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/bmw/2026-ago-bmw-m4-coupe/06-data/campaign-data.json) | OK | OK | OK | OK | F | F | OK |
| [bmw/2026-jul-bmw-x1-descubre](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/bmw/2026-jul-bmw-x1-descubre/06-data/campaign-data.json) | OK | F | OK | OK | F | F | OK |
| [converse/2026-ago-converse-chuck70-industrial-glam](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/converse/2026-ago-converse-chuck70-industrial-glam/06-data/campaign-data.json) | OK | OMITIDA | OK | OK | F | OK | F |
| [mercedes-amg/c63-se-performance](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mercedes-amg/c63-se-performance/06-data/campaign-data.json) | OK | F | OK | OK | F | OK | OK |
| [new-balance/new-balance-premium](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/new-balance/new-balance-premium/06-data/campaign-data.json) | OK | F | OK | OK | F | OK | OK |
| [nike/2026-ago-test-post-restauracion](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/nike/2026-ago-test-post-restauracion/06-data/campaign-data.json) | OK | OK | OK | OK | F | OK | OK |
| [nike/2026-jul-nike-air-force-one](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/nike/2026-jul-nike-air-force-one/06-data/campaign-data.json) | OK | OK | OK | OK | F | OK | OK |
| [nike/2026-jul-nike-pegasus-42](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/nike/2026-jul-nike-pegasus-42/06-data/campaign-data.json) | OK | F | OK | OK | F | OK | OK |
| [nike/2026-jul-nike-pegasus-42-w](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/nike/2026-jul-nike-pegasus-42-w/06-data/campaign-data.json) | OK | OK | OK | OK | F | OK | OK |
| [optica2000/2026-jul-optica2000-cuida-tu-mirada](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/optica2000/2026-jul-optica2000-cuida-tu-mirada/06-data/campaign-data.json) | OK | OK | F | F | F | OK | OK |
| [paraycompara/2026-jul-comparar-tv](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/paraycompara/2026-jul-comparar-tv/06-data/campaign-data.json) | F | F | OK | OK | F | F | OK |
| [paraycompara/2026-jul-revision-verano](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/paraycompara/2026-jul-revision-verano/06-data/campaign-data.json) | OK | OK | OK | OK | F | F | OK |
| [rolex/2026-jul-rolex-datejust-verde](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/rolex/2026-jul-rolex-datejust-verde/06-data/campaign-data.json) | OK | F | OK | F | F | OK | OK |
| [spotify/2026-jul-spotify-premium-test](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/spotify/2026-jul-spotify-premium-test/06-data/campaign-data.json) | OK | OK | OK | F | F | OK | OK |
| [tarifalo/2026-ago-tarifalo-revision-factura-luz-gas](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/tarifalo/2026-ago-tarifalo-revision-factura-luz-gas/06-data/campaign-data.json) | OK | OK | OK | OK | F | OK | OK |
| [tarifalo/2026-jul-comparar-luz-gas](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/tarifalo/2026-jul-comparar-luz-gas/06-data/campaign-data.json) | OK | OK | OK | OK | F | OK | OK |
| [tarifalo/2026-jul-tarifalo-compara-energia](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/tarifalo/2026-jul-tarifalo-compara-energia/06-data/campaign-data.json) | F | OMITIDA | F | OK | F | F | OK |
| [tarifalo/2026-jul-tarifalo-compara-luz](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/tarifalo/2026-jul-tarifalo-compara-luz/06-data/campaign-data.json) | OK | F | OK | OK | F | OK | OK |
| [uax/2026-jul-uax-fp-online](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/uax/2026-jul-uax-fp-online/06-data/campaign-data.json) | OK | OK | OK | OK | F | OK | OK |
| [wornwear/2026-jul-wornwear-usado](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/wornwear/2026-jul-wornwear-usado/06-data/campaign-data.json) | OK | OK | OK | F | F | F | OK |

Evidencia detallada por campaña: [campanas.json](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/docs/auditoria-2026-09-23/campanas.json). Resultados de seguridad: [Studio](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/docs/auditoria-2026-09-23/pruebas-studio.json), [navegador](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/docs/auditoria-2026-09-23/pruebas-navegador.json) y [readiness](/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/docs/auditoria-2026-09-23/pruebas-readiness.json).
