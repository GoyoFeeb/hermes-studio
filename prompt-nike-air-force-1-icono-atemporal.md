# Prompt — Newsletter Nike — Air Force 1 '07: Icono Atemporal

**Rol:** eres el equipo de dirección creativa de Nike (estrategia + dirección de arte + copy)
encargado de esta newsletter. La entrega se considera un fallo si se parece a una plantilla de
email marketing. Ejecuta los pasos siguientes EN ORDEN. No saltes ninguno.

## 1. Investigación obligatoria, con fuente

Nike ya tiene brand pack real en `sistema-final` (`brands/nike/tokens/brand-tokens.json`, v2.2.4,
verificado con `getComputedStyle` sobre nike.com y actualizado específicamente en la campaña
Air Force One del 2026-07-29 — el logo/swoosh ya está capturado como SVG oficial). Reutiliza sin
re-investigar: `colors.*` (negro #111111 como acento, blanco base), `typography.*` (Inter como
sustituto web-safe de Helvetica Now, tamaños ya tokenizados), `voice.rhythm` (afirmación técnica
en primera persona del plural + segunda persona directa, tono "seguro, directo, técnico,
motivacional", sin exclamaciones), `photography.treatment` (estudio high-key, fondo blanco
infinito, producto aislado sin modelo, foco en la ingeniería) e `iconography` (Nike NO usa iconos
decorativos/emoji — la fotografía es el único adorno visual). Investiga solo lo específico de
este producto, que el pack no cubre:

Busca y verifica en la web oficial de Nike (`nike.com/a/air-force-1-history` y la ficha de
producto Air Force 1 '07): nombre exacto del colorway ("Triple White" / AF1 '07 blanco/blanco/blanco,
código de estilo si aparece), materiales (piel/cuero en el empeine con puntera perforada, unidad
Nike Air, entresuela de espuma, suela de goma con los "heritage hoops pivot circles" — el detalle
de tracción heredado de su origen de baloncesto), año de lanzamiento original (1982, diseñador
Bruce Kilgore, primera zapatilla de baloncesto con tecnología Air) como contexto histórico —no
como reclamo de "el original" sin más—, precio actual (109-115 USD en hombre según mercado; **verificar
el precio en euros/mercado local antes de publicar, no asumir conversión directa**), y disponibilidad.
Cita la fuente de cada dato. Si un dato no está verificado para el mercado/moneda de esta campaña
en concreto, no lo incluyas ni lo inventes — márcalo como pendiente de confirmación con el cliente.

El logotipo (swoosh oficial) ya está resuelto en el brand pack (`assets.logoSvg` →
`brands/nike/design-input/nike-swoosh.svg`) — no hace falta relocalizarlo, solo usarlo tal cual.

## 2. Un solo concepto

Elige una única idea rectora y escríbela de forma explícita: "Concepto: ___". Todo titular de la
pieza debe derivarse de esa frase. Si aparece un segundo titular capaz de funcionar como concepto
independiente, elimínalo o subordínalo al primero. No debe haber dos frases compitiendo por ser
"la idea".

Sugerencia de dirección (ajustable, no obligatoria): el concepto gira en torno a la permanencia
del diseño original de 1982 frente a las modas — el AF1 no se relanza, nunca se fue. Evita
convertir esto en un dato suelto de aniversario; debe ser el hilo narrativo, no una cifra en una
esquina.

## 3. Arquitectura narrativa, no plantilla

La pieza tiene entre 3 y 5 escenas, nunca más. Cada escena cumple una función narrativa distinta:
por ejemplo apertura de impacto, revelación de una capacidad clave contada como experiencia,
momento de pausa o detalle del origen de baloncesto de la suela (los "heritage hoops pivot
circles"), cierre. Antes de maquetar, escribe en una línea qué función cumple cada escena y qué
aporta que la anterior no daba ya. Si dos escenas cumplen la misma función, fusiónalas o elimina
una.

Prohibido explícitamente, sin excepción:

- Barra de datos sueltos tipo "1982 · Cuero · Nike Air · Icónico". Cualquier cifra o dato va
  dentro de una frase con verbo, nunca aislada en una ficha.
- Grid de 3 columnas con icono + título + párrafo corto (tarjetas genéricas) — y en esta campaña
  en particular, **ningún icono decorativo ni emoji en absoluto**: el brand pack de Nike (v2.2.4,
  `iconography.componentImplication`) documenta explícitamente que la marca es "demasiado
  aspiracional para emojis" y que la fotografía es el único adorno visual permitido. Si un
  componente necesita apoyo visual además de texto, usa fotografía real, nunca un icono.
- Bloques alternados imagen-izquierda/texto-derecha repetidos más de una vez con la misma
  composición.
- Repetir el mismo texto de CTA más de una vez. Cada CTA lleva una copy distinta según su momento
  (la primera invita a descubrir, la última invita a comprar).
- Placeholders sin resolver: nada entre corchetes, ningún texto duplicado literalmente en dos
  sitios de la pieza.
- Escribir el nombre de la marca como texto estilizado en CSS a modo de logotipo. El logo debe
  insertarse siempre como el logotipo real y oficial de la marca (imagen o SVG), nunca
  reconstruido con código.
- Claims sin respaldo explícito en la investigación del paso 1: "gratis"/"gratuito",
  "garantizado", "sin condiciones", "líder del segmento", "el mejor del mercado", "el más
  cómodo"/"el más duradero" sin fuente, cualquier urgencia o exclusividad falsa ("última
  oportunidad", "edición limitada" — el AF1 '07 Triple White NO es edición limitada, es catálogo
  permanente; no lo trates como tal) sin confirmación explícita de que sea real. El año 1982 y
  Bruce Kilgore SÍ pueden usarse citando la fuente, como contexto histórico verificado.

## 4. Copy

Máximo 40 palabras por bloque de texto corrido. Cada característica técnica se traduce a una
frase de experiencia — qué te deja hacer o sentir —, nunca aparece como dato suelto. El nombre del
producto (Air Force 1 / AF1) aparece como máximo 3 veces en toda la pieza. Respeta el ritmo de voz
real de Nike (`voice.rhythm` del pack): afirmación técnica en primera persona del plural ("hemos
mantenido...") combinada con segunda persona directa ("tu par", "tus pies"), tono seguro y
técnico, puntuación limpia, sin exclamaciones.

## 5. Autoauditoría obligatoria antes de entregar

Antes de dar la pieza por terminada, responde literalmente a esto:

- ¿Hay dos frases que podrían ser el titular principal? Si sí, corrige.
- ¿Hay algún bloque de solo números sin verbo? Si sí, elimínalo o reescríbelo.
- ¿Se repite el mismo string de CTA dos veces? Si sí, corrige.
- ¿Hay texto duplicado en dos bloques distintos (copiar-pegar accidental)? Si sí, corrige.
- ¿Queda algún placeholder — corchetes, "Lorem", sección sin rellenar? Si sí, corrige.
- ¿La pieza tiene más de 5 escenas o repite la misma composición 3 veces o más? Si sí, recorta.
- ¿El logo de la marca está insertado como imagen/SVG real y oficial, sin reconstruir el nombre
  con texto y CSS? Si no, corrige.
- ¿Alguna frase usa un claim sin respaldo del paso 1 (gratis, garantizado, líder del segmento,
  urgencia/exclusividad falsa, cifra técnica no verificada)? Si sí, corrígelo o márcalo
  explícitamente como riesgo aceptado con su fuente.
- ¿Se ha colado algún icono decorativo o emoji en vez de fotografía o texto? El brand pack de
  Nike (v2.2.4) documenta que la fotografía es el único adorno visual de esta marca — si aparece
  cualquier icono no funcional, elimínalo.

No entregues la pieza hasta que todas las respuestas sean "no".

## 6. Formato de salida

Entrega, en este orden — SIN HTML, el motor de Hermes lo genera después:

1. Concepto elegido (una frase) y por qué.
2. Lista de escenas con su función narrativa, una línea cada una, y para cada escena el
   componente real del motor que la implementa. Punto de partida sugerido (patrón
   `fotografia-primero` — justifícalo o descártalo tú mismo contra `layout.contentRhythm` del pack
   antes de darlo por bueno, no lo copies sin más):
   - Apertura: `header-logo` → `hero-imagen` (AF1 en perfil, fondo blanco infinito, iluminación
     high-key, sin texto en la imagen — H1/subtítulo/CTA vivos en HTML).
   - Revelación: `editorial-foto-texto` — construcción real (piel, unidad Nike Air) contada como
     permanencia de diseño, no como ficha técnica.
   - Pausa/detalle diferenciador: `editorial-foto-texto-inverso` — primer plano de los "heritage
     hoops pivot circles" de la suela, el guiño a su origen de baloncesto de 1982.
   - Cierre: `banda-cierre` → `footer`.
   Si el contenido real que reúnas en el paso 1 no sostiene alguna de estas escenas, ajústala o
   elimínala — esto es un punto de partida razonado, no una plantilla a copiar literalmente.
3. Para cada dato verificado en el paso 1: el valor, su fuente y si ya vive en el brand pack de
   Nike o hay que confirmarlo con el cliente/legal (en particular: precio en el mercado/moneda de
   esta campaña, que el pack no fija). Esto alimenta directamente `00-brief/brief.md` y
   `00-brief/source-links.md`.
4. Copy de cada escena (asunto, preheader, titulares, cuerpo, CTAs) ya libre de los claims
   prohibidos de la sección 3. Esto alimenta `05-copy/`, no sustituye la validación de las 29
   reglas del agente 05, pero no debe llegar con violaciones evidentes.
5. El checklist del punto 5 con el resultado de cada verificación.

No incluyas HTML ni pseudo-maquetación: el objetivo es un brief de dirección creativa listo para
que el pipeline de Hermes (agentes 01→09) lo convierta en la campaña real.
