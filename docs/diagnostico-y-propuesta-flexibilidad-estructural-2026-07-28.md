# Diagnóstico y propuesta — flexibilidad estructural real entre marcas

**Encargo:** revisar por qué las newsletters generadas siguen viéndose genéricas/intercambiables
entre marcas, identificar qué partes del sistema fuerzan esa rigidez, y proponer una arquitectura
más flexible con criterios de validación verificables. **Este documento es diagnóstico y
propuesta — no se ha modificado ningún archivo de código, agente o schema como parte de él.**

**Metodología:** 3 investigaciones paralelas y exhaustivas (no muestreo) sobre: (1) la gramática
`PATTERN_SEQUENCE`/`engine/lib/pattern.js` y los 3 archivos `patterns/*.md`; (2) la librería de 27
componentes (`engine/components/*.html`) y su variedad real de layout/alineación/densidad; (3) la
lógica de decisión real de los agentes 03/04 y el gate de diferenciación estructural (Gate 12).
Se extrajeron las secuencias de módulos de las **23 campañas reales existentes** (13 marcas) para
comparar contra la evidencia documental.

---

## 1. El hallazgo central: la hipótesis del usuario es correcta, con una prueba directa

El 2026-08-01 el sistema produjo sus dos campañas "brand-native" de bandera —
`audi/2026-ago-audi-brand-native-a6-etron-test` y `bmw/2026-ago-bmw-brand-native-restauracion-test`
— construidas explícitamente para demostrar el mecanismo de diferenciación estructural más nuevo
(`layout.brandStructure`, Gate 12). Ambas campañas tienen la **secuencia de módulos byte-
idéntica**: `header-logo → hero-imagen → editorial-foto-texto → editorial-foto-texto-inverso →
metric-strip-premium → banda-cierre → footer`.

Cada una de las dos, por separado, en su propio `03-strategy/brand-structure-translation.md`,
afirma explícitamente que su secuencia es única ("no aparece en ningún otro patrón ni en ninguna
campaña anterior — es una combinación única"). Esa afirmación es falsa el mismo día en que se
escribió, en la propia campaña hermana. Los dos documentos son además retóricamente casi
idénticos entre sí (misma estructura de tablas, mismo argumentario "por qué NO es una plantilla
genérica").

Esto no es un caso aislado — ver §3.

---

## 2. Qué fuerza la rigidez, exactamente

### 2.1 El motor de patrones gobierna secuencia, nunca composición

`engine/lib/pattern.js` (reescrito 2026-07-24, de lista fija a gramática con anclas + zonas
libres) tiene **cero concepto de alineación, nº de columnas o densidad**. Solo compara strings de
nombre de componente en un orden/repetición permitidos. La única forma de que un módulo se vea
distinto es que `campaign-data.json` nombre un archivo `.html` *distinto* — nunca un parámetro.

### 2.2 La libertad que sí existe en la gramática casi nunca se ejerce

Desde el rediseño de 2026-07-24, las zonas libres permiten reordenar y repetir módulos
(`max &gt; 1`). En la práctica, de **23 campañas reales / 13 marcas muestreadas, ninguna reordena
una zona libre respecto al orden por defecto documentado del patrón**. La única variación
ejercida es (a) qué módulos opcionales se incluyen/omiten y (b) qué variante nombrada llena un
hueco. La repetición (`max&gt;1`) solo se usa en 2 de 23 campañas.

### 2.3 El campo diseñado para forzar diferenciación real no dirige ninguna decisión

`layout.brandStructure`/`compositionArchetype` (añadido 2026-07-27, "evolución brand-native") es
el campo específicamente creado para esto. Evidencia:

- Solo **3 de 15** brand packs reales lo tienen poblado (`audi`, `new-balance`, `adidas`) — y
  notablemente **BMW no lo tiene**, pese a ser la marca más citada como precedente motivador. Un
  documento propio de BMW cita el campo como si existiera en su pack; no existe.
- `agents/03-newsletter-architect.md` — el agente que decide estructura — **nunca lo referencia**
  en su árbol de decisión (verificado por grep, cero resultados). Solo se consulta
  `layout.contentRhythm` (un campo distinto, más antiguo) para ordenar la zona libre, no para
  elegir patrón ni conjunto de módulos.
- El único código que lo lee es `check-structural-differentiation.ts` (Gate 12), y solo como
  **detección de presencia de la palabra** en un markdown (`/contentRhythm|brandStructure|
  compositionArchetype/i.test(...)`) — nunca parsea el valor real ni ramifica sobre él.
- En sus 3 únicos usos reales, las 3 marcas (automoción de lujo, lifestyle deportivo, ropa
  deportiva) declaran el **mismo** `compositionArchetype: "editorial-foto-texto"` y convergen en
  el mismo esqueleto de módulos. El campo diseñado para forzar divergencia ha producido
  convergencia en el 100% de sus usos reales.

### 2.4 Gate 12 no compara nada entre campañas ni entre marcas

`check-structural-differentiation.ts` compara **una campaña contra una única constante
hardcodeada** (`DEFAULT_SEQUENCE`, y solo la del patrón `fotografia-primero` — no existe
equivalente para `saving` ni `institutional`). Nunca carga ni compara contra otra campaña real.
Además, el bloqueo real (`allPassed = false`) solo se activa si `metadata.productionReady:true` —
**las 23 campañas reales muestreadas tienen `productionReady:false`**, así que el bloqueo del
gate nunca se ha ejercido de verdad contra el corpus actual. Prueba directa: 3 campañas BMW
distintas, en 3 semanas distintas, reproducen exactamente la constante `DEFAULT_SEQUENCE` que el
propio gate existe para detectar — sin que ninguna haya sido bloqueada.

### 2.5 La selección de patrón es por género de contenido, no por personalidad de marca

Solo existen 3 patrones (`saving`/`institutional`/`fotografia-primero`), elegidos por un árbol de
decisión sobre el **contenido** de la campaña (¿hay cifra de ahorro? ¿la fotografía domina y hay
pocas secciones?), con `institutional` como cajón de sastre por defecto. No hay ningún concepto
de tono de marca (sobria/premium/editorial/comercial/juvenil/técnica/institucional) ni de tipo de
newsletter (digest/lanzamiento/editorial/ecommerce/comunidad/evento/onboarding/actualización
corporativa) en esta decisión — esas dos dimensiones que el usuario pide simplemente no existen
como ejes del sistema hoy.

El único mecanismo tono→estructura real es `layout.sectionStyle` (`centrado`/`asimetrico`), un
**interruptor binario global** aplicado uniformemente a 4 módulos de `institutional` — no una
decisión de composición rica.

### 2.6 27 componentes ≈ 27 tratamientos visuales fijos

- Solo **7 pares** (14 de 27 archivos) tienen una variante de alineación (`-asimetrico`/
  invertida). **13 de 27 componentes tienen exactamente un tratamiento visual, sin ninguna
  variante**: `footer`, `header-logo`, `hero-imagen`, `hero-marca-tarifalo`, `trust-bar`, `pasos`,
  `lista-premium`, `metric-strip-premium`, `card-tarifa`, `card-tarifa-3`, `category-grid`,
  `category-grid-img`, `columns-3-beneficios-sin-icono`.
- Geometría adaptativa real (ancho/padding de columna calculado según nº de ítems) solo existe en
  8 de 27 archivos (`pasos`, 3×`columns-3-beneficios*`, 4×`usp-cards*`, `metric-strip-premium`) —
  y ahí se limita a ancho/padding, nunca a alineación o densidad.
- **No existe ningún campo `layout`/`variant` en el schema.** Elegir un tratamiento distinto
  significa escribir un nombre de archivo distinto en `component`, nunca un flag de datos.
- `spacing.*` (la escala semántica de densidad/ritmo que ya vive en los 15 brand packs reales)
  está **100% sin consumir** — cero apariciones de `{{token:spacing...}}` en ningún componente,
  verificado por grep exhaustivo. Es exactamente la palanca de densidad/ritmo que el usuario pide,
  ya presente en los datos, inerte en el motor.
- Inconsistencias encontradas de paso: `card-tarifa.html` tiene su schema mintiendo (`minItems:2`
  declarado, plantilla fija a 4 — ya documentado como hueco pendiente); `category-grid.html`
  agrupa filas con un algoritmo distinto (y peor — puede producir filas huérfanas `[3,1]`) al
  `balancedRows` que el resto del sistema ya usa.

### 2.7 Esto ya se ha diagnosticado 3 veces antes y solo se ha corregido a nivel de síntoma

`engine/CHANGELOG.md` documenta 3 rondas independientes de la misma queja del usuario
(2026-07-25, 2026-07-27, 2026-08-01), cada una resuelta a nivel de síntoma (ancho de CTA,
prompt de fotografía del hero, webfonts, gramática-no-lista, componentes editoriales nuevos,
Gate 12) sin cerrar la causa raíz estructural: la elección de módulos sigue siendo por género de
contenido, no por composición de marca, y el layout de cada módulo sigue fijo por archivo. El
propio `patterns/institutional.md` §10 ya diagnosticó esto con precisión quirúrgica en 2026-07-24:
*"el patrón ERA la plantilla"* — y la evidencia de esta investigación confirma que sigue siéndolo.

---

## 3. Arquitectura propuesta

El problema de fondo es que el sistema comprime **4 decisiones independientes** en un solo eje
(el "patrón"). Se propone separarlas en 4 ejes ortogonales:

```
Eje 1 — TIPO DE NEWSLETTER (objetivo/propósito)
Eje 2 — PERFIL DE COMPOSICIÓN DE MARCA (personalidad, densidad, sesgo de alineación)
Eje 3 — SECUENCIA (gramática de módulos — ya existe, subutilizada)
Eje 4 — VARIANTE DE LAYOUT POR MÓDULO (alineación/densidad/tratamiento — hoy fijo por archivo)
```

### 3.1 Eje 1 — Tipo de newsletter (nuevo, explícito)

Hoy "patrón" mezcla dos cosas: tipo de newsletter (saving = comparador/ahorro) y disponibilidad de
contenido (fotografia-primero = "hay fotografía dominante"). Se propone declarar el tipo de
newsletter como un campo explícito y propio en `campaign-data.json` (`metadata.newsletterType`),
tomado del brief (agente 01), no inferido después:

`saving` (ya existe) · `institutional` (ya existe, renombrar conceptualmente a
`servicios-institucional`) · `fotografia-primero` (ya existe) · `digest` · `lanzamiento-producto` ·
`editorial` · `ecommerce-promo` · `comunidad` · `evento` · `onboarding` · `actualizacion-corporativa`.

**No crear los 8 patrones nuevos especulativamente** — misma regla anti-aspiracional que ya rige
el resto del sistema (`agents/03-newsletter-architect.md` línea 16-20: "ningún patrón se crea sin
una campaña real que lo necesite"). Se documenta el hueco (5 de las 8 categorías que pide el
usuario no tienen patrón hoy) y se crea cada uno cuando una campaña real de ese tipo aparezca,
usando `patterns/institutional.md` como plantilla de cómo escribir uno.

### 3.2 Eje 2 — Perfil de composición de marca (nuevo, y esta vez real)

El fallo de `layout.brandStructure` no es el concepto, es que nada lo consume. Se propone:

1. **Formalizar 3 campos nuevos, cortos y de tipo cerrado** (no prosa libre) en `brand-tokens.json`,
   pensados para ser leídos por código, no solo por un humano:
   ```json
   "compositionProfile": {
     "personality": "sobria | premium | editorial | comercial | juvenil | tecnica | institucional",
     "densityPreference": "alta | media | baja",
     "alignmentBias": "centrado | asimetrico | alternado"
   }
   ```
   `personality` se deriva de `voice.tone` (ya observado por agente 02) pero se fuerza a un enum
   cerrado para que sea programáticamente accionable, en vez de texto libre sin estructura.
2. **`agents/03-newsletter-architect.md` debe leer y ramificar sobre estos 3 campos de verdad**,
   no solo documentarlos — ver §3.4 para el mecanismo concreto (una tabla de mapeo, no prosa).
3. **`densityPreference` es lo que por fin activa `spacing.*`**: mapea a qué escala de `spacing`
   usar (ya existe la data, falta el consumo — ver §3.4).

### 3.3 Eje 3 — Secuencia (ya existe, reforzar el uso, no la mecánica)

`pattern.js` ya soporta lo necesario (anclas + zonas libres + repetición). El problema no es la
gramática, es que agente 03 nunca la ejercita. Se propone: **`agents/03-newsletter-architect.md`
debe justificar explícitamente, módulo por módulo, por qué eligió ESE orden dentro de la zona
libre** citando `layout.contentRhythm`/`compositionProfile`, en vez de copiar tácitamente el orden
por defecto del patrón — hoy nada se lo exige. Esto es un cambio de contrato de agente (barato),
no de motor.

### 3.4 Eje 4 — Variante de layout por módulo (el cambio más profundo, 2 opciones)

**Opción A — mecánica, bajo riesgo (recomendada como primer paso).** Generalizar el patrón que ya
funciona (7 pares centrado/asimétrico) a los 13 componentes que hoy no tienen ninguna variante,
creando el archivo hermano `-asimetrico`/invertido donde tenga sentido visual (no todos lo
necesitan — `footer`/`header-logo` no). Candidatos reales con demanda ya documentada:
`category-grid` (grid vs. lista editorial), `lista-premium` (apilado vs. 2 columnas), `pasos`
(fila horizontal vs. vertical con conector), `trust-bar` (pill vs. inline con separadores). Mismo
patrón mecánico ya usado 7 veces — riesgo bajo, sin tocar el motor de plantillas.

**Opción B — estructural, mayor alcance.** Añadir un primitivo condicional (`{{#if:flag}}`) al
motor de plantillas compartido (`engine/lib/assemble.js`), para que una variante sea un flag de
datos en vez de un archivo clonado. **Ya se evaluó esta opción esta sesión** (al intentar fusionar
`editorial-foto-texto`/`-inverso`) y se decidió NO ejecutarla entonces por ser una modificación
real del motor central que amplía la superficie de riesgo a los 27+ componentes existentes, no
solo a 2. Esa decisión se mantiene igual aquí — pero el caso para reconsiderarla es ahora mucho
más fuerte: si la Opción A se ejecuta con éxito y el patrón "archivo clonado por variante" sigue
multiplicándose (7 pares hoy, potencialmente 15-20 si se generaliza a todos los módulos con
sentido), el coste de mantener N×2 archivos physically clonados empieza a pesar más que el riesgo
de añadir un primitivo condicional bien testeado. **Recomendación: ejecutar Opción A primero,
revisar el conteo real de archivos clonados tras 2-3 marcas reales, decidir sobre Opción B con
datos en vez de proyección.**

**Activar `spacing.*` (paso independiente, bajo riesgo, alto valor).** Añadir
`{{token:spacing.X}}` a los componentes que ya calculan padding/margin (los 8 de geometría
adaptativa, §2.6) para que `densityPreference` (Eje 2) tenga un efecto real y medible en vez de
ser un campo decorativo más. Requiere primero normalizar el shape de `spacing.*` entre los 15
brand packs (hoy inconsistente — algunos usan px numéricos, otros shorthand CSS completo).

### 3.5 Corregir las 2 inconsistencias encontradas de paso

- `card-tarifa.html`: o se arregla el schema para reflejar la realidad (`minItems:4, maxItems:4`,
  quitando la mentira de `minItems:2`), o se construye por fin la variante de 2-3 tarjetas
  documentada como pendiente desde F1 — decisión de producto, no técnica, mismo criterio
  anti-aspiracional (¿hay ya una campaña real con 2-3 tarifas?).
- `category-grid.html`/`category-grid-img.html`: migrar su agrupación de filas a `balancedRows`
  (ya usado por 7 componentes hermanos) en vez de su bucle propio — elimina el riesgo de fila
  huérfana `[3,1]` y es trabajo mecánico ya practicado esta sesión (Fase D).

---

## 4. Criterios de validación — cómo saber que dos marcas ya no son intercambiables

Pedido explícito del usuario. Propuesta concreta, en 2 capas:

### 4.1 Extender Gate 12 a comparación real cruzada (no solo contra una constante)

Hoy `check-structural-differentiation.ts` compara 1 campaña contra 1 constante hardcodeada, solo
para `fotografia-primero`. Se propone:

1. **"Huella estructural" por campaña** — un vector comparable: `{pattern, secuencia de módulos
   (sin header-logo/footer), variante de hero, variante de CTA, alineación por módulo,
   compositionProfile.personality}`.
2. **Comparación contra TODAS las demás campañas reales del mismo patrón** (no una constante
   fija) — calcular similitud de secuencia (ratio de coincidencia posicional, tipo Jaccard/edit
   distance simple, no hace falta nada sofisticado).
3. **Umbral de aviso, no de bloqueo automático todavía**: si la huella de una campaña coincide
   &gt;80% con la de ≥2 marcas distintas (no la misma marca en campañas repetidas — eso es
   coherencia de marca esperada, no genericidad), avisar con el detalle exacto de qué campañas
   colisionan. Esto habría detectado el caso Audi/BMW del §1 el mismo día en que ocurrió.
4. **Extender `DEFAULT_SEQUENCE` a los otros 2 patrones** (`saving`, `institutional`) — hoy solo
   existe para `fotografia-primero`; el hallazgo BMW (3 campañas idénticas a esa constante, nunca
   detectadas) es precisamente en `fotografia-primero`, pero `saving`/`institutional` tienen el
   mismo riesgo sin ningún mecanismo que lo mire.

### 4.2 No promover a bloqueante sin datos reales

Mismo criterio que "Nivel 4"/"Nivel 5" ya establecido en este sistema esta sesión: el nuevo check
cruzado nace en modo aviso. Se promueve a bloqueante (incluso con `productionReady:false`, dado
que ninguna campaña real ha sido `productionReady:true` hasta ahora — el gate necesita ejercerse
contra datos reales antes de poder bloquear nada con confianza) solo después de que el corpus de
campañas reales demuestre que el umbral no genera falsos positivos contra coincidencias legítimas
(dos marcas con genuinamente el mismo objetivo de campaña y contenido disponible pueden compartir
estructura sin ser "genéricas" — el gate debe distinguir coincidencia forzada de coincidencia
justificada, igual que ya hace la Fase 5 del check actual con `intro-cta` repetido).

---

## 5. Qué NO se propone (y por qué)

- **No rehacer los 3 patrones existentes desde cero.** La gramática (anclas + zonas libres) ya es
  correcta — el problema es de consumo (agente 03 no la ejercita, Eje 2 no existe), no de diseño
  del motor de patrones.
- **No crear los 8 patrones de tipo de newsletter especulativamente.** Documentados como hueco,
  creados solo ante demanda real — misma disciplina que ya evitó sobre-construir el resto del
  sistema.
- **No añadir el primitivo `{{#if}}` al motor todavía** (Opción B del Eje 4) sin antes medir si la
  Opción A (mecánica) es suficiente — evita repetir el patrón de este mismo sistema de construir
  infraestructura por adelantado sin necesidad confirmada.
- **No tocar `layout.sectionStyle` existente** — se extiende (Eje 2, `alignmentBias`), no se
  reemplaza; las 3 marcas que ya lo usan (UAX, Óptica 2000) no deben requerir migración.

---

## 6. Alcance estimado si se aprueba avanzar a implementación

Por orden de impacto/riesgo, replicando la disciplina de fases ya usada esta sesión (checkpoints
de git verificados, sin tocar el motor sin necesidad):

**Fase F1 (riesgo bajo, impacto alto — desbloquea el resto):** formalizar `compositionProfile` en
el schema (aditivo, sin `required` nuevos) + reescribir la sección de decisión de
`agents/03-newsletter-architect.md` para leer y ramificar sobre él con una tabla real, no prosa.

**Fase F2 (riesgo bajo, impacto alto):** extender Gate 12 a comparación cruzada real (§4.1) +
`DEFAULT_SEQUENCE` para `saving`/`institutional`.

**Fase F3 (riesgo bajo-medio, impacto medio):** Opción A del Eje 4 — generalizar variantes
centrado/asimétrico a los componentes candidatos identificados en §3.4, más activar
`spacing.*` en los 8 componentes con geometría adaptativa.

**Fase F4 (riesgo bajo, impacto bajo-medio, mecánico):** corregir `card-tarifa`/`category-grid`
(§3.5).

**Fase F5 (sin fecha, depende de demanda real):** patrones nuevos por tipo de newsletter (§3.1);
Opción B del Eje 4 (`{{#if}}` en el motor) solo si F3 demuestra que la duplicación de archivos se
vuelve insostenible.

Este documento no ejecuta ninguna fase — queda a la espera de aprobación explícita antes de tocar
código, dado que F1-F3 modifican contratos de agente y el motor central usados por campañas reales
en producción activa (incluida la campaña BMW de la sesión concurrente en curso).
