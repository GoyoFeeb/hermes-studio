# PROMPT — Patagonia Worn Wear (test del motor tras la ronda del 2026-07-24)

> **Cómo usar este documento.** La sección **§A (Brief)** es lo que se le pasa a Hermes: es un
> encargo de cliente normal, sin pistas sobre qué queremos probar. La sección **§B** es para ti
> (Javi), no para el agente: dice qué debería pasar en cada punto y cómo comprobar si el sistema
> hizo su trabajo. **No le pases §B a Hermes** — si le das las respuestas, el test no prueba nada.

---

## §A — BRIEF (esto es lo que se le pasa a Hermes)

Arranca el pipeline completo (agentes 00→09) para una campaña nueva.

### Cliente

**Patagonia Worn Wear** — el programa de ropa y equipamiento de segunda mano de Patagonia.
Es una submarca con identidad visual propia, distinta de patagonia.com: no asumas que comparte
paleta, tipografía ni estilo de botón con la marca madre. Investígala como marca independiente.

- Web de referencia (y destino del CTA principal): **https://wornwear.patagonia.com/**
- Marca madre, solo como contexto: https://www.patagonia.com/home/

### Objetivo de la campaña

Dar a conocer la colección de segunda mano de Worn Wear a gente que ya compra Patagonia nuevo,
y llevarla a explorar las novedades que van entrando en el catálogo de usado.

### Ángulo

Comprar usado en Worn Wear no es conformarse con menos: es equipo Patagonia con vida por delante,
más barato, y con la misma garantía de calidad. El titular real que usa la propia marca en su
home es *"Put Used to Use"* — úsalo como referencia de tono, no necesariamente literal.

### CTA principal

- Etiqueta: a decidir por copy, coherente con la voz real de la marca.
- Destino: `https://wornwear.patagonia.com/` (añade UTM según la convención del sistema).

### Nombre de campaña

`2026-jul-wornwear-usado`

### Restricciones y avisos

1. **Campaña de test interno**: `isTestCampaign: true`, `productionReady: false`.
   Los textos legales de footer y la dirección física quedan como placeholder declarado.
2. **No inventes ni una sola cifra de impacto ambiental.** Patagonia comunica mucho sobre
   sostenibilidad y es tentador rellenar con "ahorra un X% de CO₂" o "reduce N litros de agua".
   Si no está literalmente en la web y verificado, **no se escribe**. Un beneficio sin respaldo es
   una `[Q-NNN]`, no una estimación.
3. **No inventes precios ni descuentos.** El catálogo de usado tiene precios variables; la
   campaña no promete un porcentaje concreto salvo que lo encuentres publicado y lo cites.
4. Logo: si no encuentras un PNG utilizable en email (el SVG no vale), usa el nombre de marca como
   texto y déjalo anotado como pendiente de cliente.
5. Idioma de la pieza: **español**. La web está en inglés — traduce el tono, no calques la sintaxis.

### Lo que se espera de cada fase

Lo normal del pipeline, con el rigor de siempre:

- **02** investiga la marca con Chrome real antes de escribir un solo valor del brand pack. Las
  5 dimensiones son obligatorias, incluido el sub-checklist del botón CTA y el ritmo estructural
  de la página (`layout.contentRhythm`).
- **03** compone la secuencia contra ese ritmo real, no copiando el orden por defecto del patrón.
  Justifica el orden elegido citando el campo de `contentRhythm` que lo sostiene.
- **04** decide variante de icono e imágenes contra lo que el pack documenta.
- **05** escribe contra `voice.rhythm`, no contra un tono genérico de email marketing.
- **06/07/08/09** como siempre. `production-gate-motor` tiene que quedar en verde o con cada
  fallo documentado como bloqueo real.

Antes de empezar, hazme las preguntas que necesites.

---

## §B — QUÉ DEBERÍA PASAR (para Javi, NO para Hermes)

Verifiqué la web con Chrome el 2026-07-24 antes de escribir este prompt. Esto es lo que el sistema
debería encontrar por su cuenta, y sirve de plantilla de corrección.

### 1. Tamaño real del CTA — el test principal

El botón real de Worn Wear (`Shop New Arrivals`, computado con `getComputedStyle`):

| | Valor real observado | Lo que el motor forzaba antes del fix |
|---|---|---|
| `font-size` | **16px** | 19px |
| `font-weight` | **500** | 700 |
| `padding` | **9px 28px** | 17px 36px |
| `border-radius` | **40px** | el del pack, ya tokenizado |
| fondo / texto | **#FA4617 / #FFFFFF** | — |

**Si 02 escribe 19px/700 o un padding de plantilla, el fix del CTA no ha calado** y además debería
saltar la autocomprobación cruzada nueva (valores idénticos a otro pack = señal de plantilla sin
investigar).

### 2. El contraste que el motor viejo escondía — el test más interesante

Blanco sobre el naranja real de Worn Wear (`#FFFFFF` / `#FA4617`) = **3.53:1**.

- Con el tamaño **antiguo forzado** (19px/700 = "texto grande", umbral 3:1) → **habría pasado el
  gate en silencio**.
- Con el tamaño **real** (16px/500, que ya NO califica como texto grande, umbral 4.5:1) →
  **falla**.

O sea: esta campaña obliga al sistema a enfrentarse a un problema de accesibilidad real que hasta
esta ronda quedaba tapado por un tamaño de botón inventado. Es exactamente el mismo patrón que
apareció en UAX (#008CF7 pasaba solo por el 19px/700).

**Salida correcta:** que `check-contrast` lo detecte y que 02/04 tomen una decisión razonada. Hay
una solución real disponible sin inventar color de marca: **texto negro sobre el naranja da
5.95:1** (mismo criterio que ya se usó en Spotify, negro sobre verde). Lo que NO es aceptable es
que alguien suba el CTA a 19px/700 "para que pase" — eso es volver al bug.

### 3. Gramática de secuencia — orden libre y repetición

La home de Worn Wear (y la de Patagonia) es una pila de **bloques editoriales repetidos**: foto a
sangre + titular corto + CTA, uno detrás de otro. No es header→hero→intro→beneficios→grid→USP.

Con la lista rígida anterior **era imposible** expresar eso. Ahora sí: `intro-cta` admite
repetición (`max 2` en institutional, `max 3` en fotografia-primero) y el cuerpo va en orden libre.

**Qué mirar:** si `module-selection.md` justifica el orden citando `layout.contentRhythm`, y si la
secuencia final se parece al ritmo real de la marca en vez del orden por defecto. Si sale
exactamente el orden de siempre sin motivo escrito, 03 no está usando la libertad nueva — y eso
ahora es un incumplimiento detectable de su contrato, no un límite del motor.

### 4. Conteos variables (2-4)

Ojo a si el sistema **rellena hasta 3 por inercia**. Si la marca comunica 2 razones claras para
comprar usado, la pieza debe llevar 2 (una fila de 2 columnas al 50%), no 3 con una inventada.
Rellenar para llegar a 3 era obligatorio antes; ahora es un fallo de criterio.

### 5. Patrón e identidad

Fotografía dominante, sin iconos decorativos, tipografía de display propia (la web usa fuentes no
seguras en email → el pack debe declarar el fallback system-safe explícitamente).

Esperable: patrón `fotografia-primero`, `hero-imagen` (Gate 11 debería exigirlo — hay URL real y
fotografía protagonista), y variantes `-sin-icono`. Si sale `institutional` con emoji, algo no ha
funcionado.

### 6. Riesgo a vigilar

Patagonia invita a inventar claims medioambientales. El gate de claims debería frenar cualquier
cifra no respaldada. Si aparece un "reduce un X%" sin fuente citada, es un fallo de 05 que 08
tenía que haber cazado.
