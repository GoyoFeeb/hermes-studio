# PROMPT — Aesop (test del motor tras la ronda del 2026-07-25)

> **Cómo usar este documento.** La sección **§A (Brief)** es lo que se le pasa a Hermes: es un
> encargo de cliente normal, sin pistas sobre qué queremos probar. La sección **§B** es para ti
> (Javi), no para el agente: dice qué debería pasar en cada punto y cómo comprobar si el sistema
> hizo su trabajo. **No le pases §B a Hermes** — si le das las respuestas, el test no prueba nada.

---

## §A — BRIEF (esto es lo que se le pasa a Hermes)

Arranca el pipeline completo (agentes 00→09) para una campaña nueva.

### Cliente

**Aesop** — casa australiana de cosmética y cuidado de la piel, con una identidad visual muy
particular y muy poco parecida a la del resto de marcas del sistema. No des por hecho que se
comporta como una marca de lujo convencional: investígala como si no supieras nada de ella.

- Web de referencia (y destino del CTA principal): **https://www.aesop.com/**
- Ojo: la web redirige por región y algunas URLs profundas devuelven 404 según el país detectado.
  Navega desde el menú principal hasta la categoría que uses; no construyas URLs a mano ni cites
  como buena una que no hayas cargado con Chrome.

### Objetivo de la campaña

Dar a conocer la gama de cuidado facial (**Skin Care**) a suscriptores que ya conocen la marca
por producto de manos/cuerpo, y llevarlos a explorar esa categoría en la web.

### Ángulo

El cuidado de la piel como ritual cotidiano, no como promesa de resultados. Aesop no vende
"transformación": describe fórmulas, ingredientes y gestos. Sigue ese registro.

### CTA principal

- Etiqueta: a decidir por copy, coherente con la voz real de la marca.
- Destino: la página de la categoría de cuidado facial que verifiques en la web (añade UTM según
  la convención del sistema).

### Nombre de campaña

`2026-jul-aesop-ritual-facial`

### Restricciones y avisos

1. **Campaña de test interno**: `isTestCampaign: true`, `productionReady: false`. Textos legales
   de footer y dirección física quedan como placeholder declarado.
2. **No inventes ni una sola propiedad de producto.** Aesop describe ingredientes con precisión
   ("extracto de semilla de perejil", "corteza de sauce") y es tentador rellenar con beneficios
   tipo "reduce las arrugas un X%" o "hidratación 24h". Si no está literalmente en la web y
   verificado, **no se escribe**. Un beneficio sin respaldo es una `[Q-NNN]`, no una estimación.
3. **No inventes precios ni promociones.** Aesop no hace descuentos; una campaña con urgencia
   comercial sería falsa para esta marca.
4. **Cuidado con los nombres de producto.** Son muy reconocibles y muy fáciles de escribir mal.
   Si citas uno, tiene que estar copiado literalmente de la web.
5. Logo: si no encuentras un PNG utilizable en email (el SVG no vale), usa el nombre de marca como
   texto y déjalo anotado como pendiente de cliente.
6. Idioma de la pieza: **español**. Si acabas navegando la web en inglés, traduce el tono, no
   calques la sintaxis.

### Lo que se espera de cada fase

Lo normal del pipeline, con el rigor de siempre:

- **02** investiga la marca con Chrome real antes de escribir un solo valor del brand pack. Las
  5 dimensiones son obligatorias, incluido el sub-checklist completo del botón CTA (los 5 valores
  numéricos **y la silueta**) y el ritmo estructural de la página (`layout.contentRhythm`).
- **03** compone la secuencia contra ese ritmo real, no copiando el orden por defecto del patrón.
  Justifica el orden elegido citando el campo de `contentRhythm` que lo sostiene.
- **04** decide variante de icono e imágenes contra lo que el pack documenta, y calcula el
  contraste de cada combinación nueva contra el umbral correcto.
- **05** escribe contra `voice.rhythm`, no contra un tono genérico de email marketing.
- **06/07/08/09** como siempre. `production-gate-motor` tiene que quedar en verde o con cada
  fallo documentado como bloqueo real.

Antes de empezar, hazme las preguntas que necesites.

---

## §B — QUÉ DEBERÍA PASAR (para Javi, NO para Hermes)

Verifiqué aesop.com con Chrome el 2026-07-25 antes de escribir este prompt (`getComputedStyle`
sobre el chrome global del sitio: navegación, botones, tipografía, fondo). Esto es lo que el
sistema debería encontrar por su cuenta, y sirve de plantilla de corrección.

**Aviso de alcance de mi verificación:** las URLs profundas de producto y categoría me devolvieron
404 (redirección por región). Lo que sí cargó y verifiqué es el chrome global —que es donde viven
los botones, la tipografía y el fondo— y el modal de selección de país. Si Hermes reporta que no
puede alcanzar una ficha de producto concreta, eso es un hallazgo legítimo del entorno, no un
fallo suyo. Lo que NO es aceptable es que invente la URL o los datos de producto.

### 1. La silueta del CTA — el test principal de esta ronda

Construimos `cta-block-bulletproof.html` y `cta-text-link-bulletproof.html` el 2026-07-25 y
**ninguna marca del sistema los ha activado todavía** (Worn Wear, Nike, BMW y Rolex resultaron
ser píldora al verificarlas). Aesop es la primera candidata real.

Botón real observado (`Change region or country`, y el mismo patrón en el resto de botones del
sitio):

| | Valor real observado |
|---|---|
| `border-radius` | **0px** — esquina recta, en TODOS los botones medidos |
| fondo / texto | **#333333 / #FFFEF2** |
| `padding` | **13px 24px 12px** (vertical asimétrico) |
| `font-size` / `font-weight` | **14px / 400** |

**Qué debería pasar:** que 02 registre la silueta —no solo los 5 números— y escriba
`components.cta.style: "block"` en el brand pack, de modo que `resolveIncludeAlias()` redirija el
`{{include:cta-bulletproof}}` a `cta-block-bulletproof.html` sin que ninguna plantilla cambie.

**Cómo comprobarlo:** `grep -c "border-radius:0" newsletters/2026/aesop/.../07-build/final.html`
y que el VML lleve `arcsize="0%"`. Si sale una píldora con `radius.ctaPill`, 02 midió los números
pero no miró la forma — que es exactamente el hueco que el sub-checklist nuevo debía cerrar.

**Trampa a vigilar:** que alguien ponga `radius.ctaPill: 0` en vez de usar la variante. Eso
produce el mismo píxel pero salta el mecanismo entero y deja el pack mintiendo (declara una
píldora de radio 0). Es un fallo, aunque el render se vea bien.

### 2. Dos familias tipográficas propietarias — nunca probado

Aesop usa **dos** tipografías distintas, ambas de licencia comercial:

- **`SuisseIntl`** (+ `SuisseIntl-Medium`) → UI, body, botones. Swiss Typefaces.
- **`Zapf-Humanist`** → titulares (`h2`). Es un humanista tipo Optima, con modulación de trazo.

Todas las marcas del sistema hasta hoy tenían **una sola** familia (Worn Wear→IBM Plex Sans,
Nike→Inter, BMW→Titillium Web, Rolex→Archivo). `typography.webFont` en el schema admite una
`family` con N pesos — **no dos familias**. Este es el test estructural de la ronda.

**Qué mirar:** cómo lo resuelve 02. Salidas aceptables: (a) declarar solo la de titulares como
`webFont` y dejar el body en la cadena system-safe, documentando por qué; (b) reportar la
limitación del schema como hallazgo real para el motor. Salida NO aceptable: elegir una sola
fuente en silencio y no mencionar que la marca tiene dos, o inventar que ambas caben.

### 3. El fondo no es blanco — test de si los tokens mandan de verdad

`body` real = **`rgb(255, 254, 242)` = #FFFEF2**, un crema. Las 9 marcas del sistema usan
`#FFFFFF` como superficie base. Contraste crema vs. blanco puro = **1.01:1**, o sea
indistinguible a ojo pero distinto en el dato.

**Qué mirar:** que `surfaces.white`/`colors.background.white` recojan el crema real y no se
rellenen con `#FFFFFF` por inercia. Es el tipo de detalle que nadie nota en una captura y que
delata si el pack se investigó o se copió de plantilla. Contraste real texto/fondo
(#333333 sobre #FFFEF2) = **12.46:1**, pasa de sobra — así que aquí no hay excusa de accesibilidad
para "redondear a blanco".

### 4. Catálogo real de categorías — `category-grid` sigue sin probarse

La navegación real tiene 11 entradas: Shop all, New & Notable, Skin Care, Hand & Body, Fragrance,
Home, Hair, Travel, Gifts, Library, Experience.

Es el primer caso claro del sistema con un catálogo de categorías de verdad (Rolex no lo tenía;
por eso 03 omitió el grid en aquella campaña, correctamente). Aquí **sí** hay material para
`category-grid` / `category-grid-img`, que sigue sin ejercitarse en ninguna campaña real.

**Qué mirar:** si 03 lo incluye, tiene que justificarlo contra `contentRhythm`, y 04 tiene que
decidir explícitamente `-img` vs. `iconGlyph` vs. omitir icono contra lo que diga
`iconography`. Si lo omite, también necesita motivo — con 11 categorías reales delante, omitirlo
sin explicación es pereza, no criterio.

### 5. Patrón y gramática de secuencia

Aesop combina fotografía de producto muy cuidada **con** contenido editorial largo (la sección
"Library"). No es tan monolíticamente fotográfica como Worn Wear o Rolex.

**Qué mirar:** cuál de los 3 patrones elige y con qué evidencia. `institutional` es defendible
aquí (hay catálogo de categorías → criterio 5 de `fotografia-primero` §6 lo excluye
explícitamente). Si elige `fotografia-primero` **teniendo** un catálogo real de 11 categorías,
está ignorando su propio criterio de exclusión.

También: `intro-cta` admite repetición (`max 2` en institutional). El ritmo editorial de Aesop es
el mejor candidato hasta ahora para usarla. **Sigue sin ejercitarse en ninguna campaña real** —
si vuelve a salir 1 sola, la libertad de la gramática sigue siendo teórica.

### 6. Voz — el riesgo de contenido de esta marca

Aesop escribe en un registro deliberadamente sobrio y algo literario, describiendo fórmulas y
gestos, nunca prometiendo resultados. El fallo probable de 05 es deslizarse a lenguaje cosmético
convencional ("piel radiante", "resultados visibles", "hidratación profunda") — nada de eso está
en la web y todo suena a otra marca.

El gate de claims (29 reglas) **no lo va a cazar**: sus reglas son de automoción/finanzas, no de
cosmética. Así que este punto depende enteramente de que 05 escriba contra `voice.rhythm` y de
que 08 lo revise en `brand-fidelity-qa.md` punto 4. Es el hueco real de cobertura de esta
campaña, y saberlo de antemano es parte del test.
