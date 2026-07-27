# PROMPT G8 — Rediseño profesional de la newsletter Para y Compara

> Prompt a medida para la pieza real `v5-premium/final-premium-v2.html` (estado post-G7).
> No es un prompt genérico: parte de un diagnóstico verificado del HTML actual con sus
> problemas concretos. Ejecutable por el pipeline Hermes o por cualquier agente con
> acceso al repositorio.

---

## ROL

Actúa como equipo senior de producción de email: Creative Director, Senior Email Designer,
Email Developer especialista en compatibilidad (Outlook/Gmail/Apple Mail), Copywriter de
conversión y QA de accesibilidad. Tu trabajo no es decorar: es convertir una pieza
visualmente correcta en una pieza **profesional de verdad** — de las que un equipo de CRM
de una marca seria podría enviar mañana.

## CONTEXTO REAL

- Pieza: campaña "2026-jul-ahorra-fibra-movil" de Para y Compara (comparador de tarifas).
- Fuente: `v5-premium/final-premium-v2.html` (43.6 KB), inline en `final-premium-v2-inline.html`.
- Historia: 7 rondas de evolución (G1–G7) documentadas en `qa-report.md`,
  `comparison-before-after.md`, `component-patterns.md` y `design-tokens-premium.json`.
- Sistema: HTML de tablas + CSS inline, VML en CTAs, media query única a 599px,
  patrón de fondo con fallback sólido, assets en CDN verificado.
- Estado: aprobada como prueba interna. Bloqueos de producción del cliente sin cambios
  (fromEmail, enlaces de baja/preferencias, dirección física).

## DIAGNÓSTICO VERIFICADO (los problemas reales, por orden de gravedad)

Estos hallazgos están comprobados contra el HTML actual — no son hipótesis:

### D1. Bug tipográfico: el peso 800 de Sora nunca carga
Los dos bloques `@font-face` (700 y 800) apuntan **al mismo archivo woff2**. Todos los
`font-weight:800` renderizan con la fuente de 700 sintetizada o directamente en 700.
La escala tipográfica documentada en los tokens es, en la práctica, mentira.

### D2. Semántica rota: la pieza solo tiene 1 heading real
Hay 1 `<h1>` y **0 `<h2>`** — todos los títulos de sección son `<p>` con estilos.
Un lector de pantalla ve un email sin estructura. Inaceptable en una pieza profesional
y contradice el propio `docs/email-compatibility-rules.md` del sistema.

### D3. Los 8 enlaces apuntan a la home desnuda, sin UTM
`https://paraycompara.com/` sin parámetros, 8 veces. El CTA del hero, el del cierre y
los 4 "Ver tarifas" son **indistinguibles en analytics**. Una newsletter orientada a
conversión que no puede medir qué módulo convierte no es profesional. (El pendiente
"Definir parámetros UTM" existe en `next-steps.md` desde el inicio — resuélvelo ya
con una convención documentada, aunque los valores finales los confirme el cliente.)

### D4. Copy sin especificidad
"Compara todo tipo de tarifas", "Comparar es muy sencillo", "Las mejores ofertas".
Titulares que no afirman nada verificable ni diferencial. Además "Las mejores ofertas"
es un superlativo con riesgo legal (ver `validate-claims`) que el propio sistema
desaconseja. El único dato real de la pieza es "+30 compañías" — una pieza profesional
necesita 2-3 datos más ya aprobados en el brief, o reformular sin humo.

### D5. Todo centrado, ritmo de plantilla
26 `text-align:center`. Todas las secciones repiten el mismo esqueleto:
kicker → eyebrow → título centrado → contenido. La repetición sin variación es lo que
hace que una pieza "huela a plantilla". Las piezas editoriales profesionales alternan
alineaciones y estructuras de módulo.

### D6. Iconografía inconsistente
4 PNGs de tarifa con pesos dispares (1.8–3.9 KB, riesgo ya documentado en G3) conviviendo
con checks tipográficos (✓) como pseudo-iconos. Dos lenguajes gráficos distintos en la
misma pieza. O iconos reales coherentes en todo, o tipografía en todo.

### D7. Sin dark mode real
Las metas `color-scheme` existen, pero no hay ni una regla `@media (prefers-color-scheme:dark)`
ni colores adaptados. En Apple Mail oscuro (mayoría de audiencia iOS) los fondos claros
se invierten de forma impredecible.

### D8. Sin personalización
Cero tokens de personalización (nombre, tarifa actual, zona). Para un comparador con
usuarios registrados ("Recibes este correo porque te registraste"), un saludo o un dato
contextual es la diferencia entre email masivo y CRM profesional.

## OBJETIVO

Transformar la pieza en una newsletter de nivel profesional-agencia resolviendo D1–D8,
sin destruir lo ya validado (tarjetas G5 aprobadas por el cliente, disciplina de sombras
y jerarquía de G7, compatibilidad VML/tablas de todo el histórico).

## CAMBIOS OBLIGATORIOS

### Bloque 1 — Corrección técnica (D1, D2, D3)
1. Corregir los `@font-face`: URL real del woff2 de Sora 800 (o eliminar el bloque 800 y
   declarar honestamente 700 en los tokens). Verificar con HTTP 200.
2. Convertir los títulos de sección a `<h2>` reales (y los títulos de tarjeta a `<h3>`),
   conservando estilos exactos. Verificar que ningún cliente añade márgenes por defecto
   (reset `margin:0` explícito).
3. Definir e implementar la convención UTM del sistema:
   `?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-ahorra-fibra-movil&utm_content={modulo}`
   con `{modulo}` ∈ hero-cta, card-movil, card-fibra, card-convergente, card-tv, closing-cta.
   Documentarla en `docs/naming-conventions.md`.

### Bloque 2 — Copy profesional (D4)
4. Reescribir titulares con especificidad y sin claims sin fuente:
   - Cada titular debe afirmar algo (dato, resultado, diferencia) o provocar una
     pregunta real del lector. Prohibido: "todo tipo de", "muy sencillo", superlativos.
   - Sustituir "Las mejores ofertas" por un mensaje verificable (ej. "Comparador
     independiente" / "Sin coste ni permanencia" — solo lo que el brief respalde).
   - Mantener asunto/preheader coherentes con el nuevo copy.
   - Los textos con placeholder legal no se tocan.
5. Añadir un módulo de prueba social SOLO si el brief aporta un dato real
   (nº usuarios, valoración, medio). Si no existe, NO inventar — dejar el módulo
   documentado como opcional con placeholder `[DATO PRUEBA SOCIAL — pendiente cliente]`.

### Bloque 3 — Dirección de arte editorial (D5, D6)
6. Romper la monotonía centrada: al menos un módulo de contenido pasa a composición
   asimétrica (texto alineado a la izquierda con jerarquía propia). Candidato natural:
   "Antes de decidir" (las tarjetas G5 ya son left-aligned por dentro — alinear también
   su cabecera de sección a la izquierda crea la variación sin tocar lo aprobado).
7. Unificar el lenguaje de iconos: especificar (en `hero-asset-spec.md` o nuevo doc)
   un set de iconos coherente — mismo trazo, mismo peso visual, mismos px — incluyendo
   el reemplazo de los checks tipográficos. Hasta que el asset exista, documentar el
   interino actual como placeholder consciente.
8. Revisar el ritmo vertical tras los cortes duros de G7: si el salto morado→blanco
   del hero resulta brusco, resolver con espaciado o con un único elemento de
   solapamiento (ej. la trust bar "montada" sobre el borde de las dos secciones,
   técnica de margen negativo NO compatible — usar en su lugar celda de fondo dividido,
   que sí es compatible con tablas).

### Bloque 4 — Robustez de cliente real (D7, D8)
9. Dark mode: añadir bloque `@media (prefers-color-scheme: dark)` con ajustes mínimos
   defensivos (fondos oscuros para las secciones blancas, textos claros, logo con
   variante si existe) + `!important` donde Gmail lo requiera. Documentar qué clientes
   lo respetan y cuáles no.
10. Personalización: introducir tokens de merge estándar documentados
    (`{{FIRST_NAME|default:}}` o sintaxis del ESP elegido) en saludo del hero o
    subtítulo, con fallback sin nombre verificado. Documentar en el data schema.

## RESTRICCIONES (no negociables)

- HTML de tablas, CSS inline tras juice, sin JS/flexbox/grid/position:absolute.
- No tocar la anatomía VML de los CTAs (4 `v:roundrect`).
- No tocar los placeholders legales (`[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]`, dirección).
- No inventar datos comerciales, precios ni cifras — solo lo que el brief respalde.
- No revertir decisiones aprobadas por el cliente (tarjetas G5, disciplina G7).
- Peso inline < 90 KB (margen sobre el recorte de Gmail a 102 KB).
- Regenerar inline con juice y verificar paridad estructural fuente/inline.

## PROCESO

1. Leer `qa-report.md` (rondas G1–G7) y `00-brief/brief.md` antes de tocar nada.
2. Ejecutar Bloque 1 completo (técnico) y validar.
3. Bloque 2 (copy) con `validate-claims` en modo production.
4. Bloque 3 (arte) módulo a módulo, verificando balance de tags tras cada cambio.
5. Bloque 4 (robustez).
6. QA final: conteos estructurales, contraste WCAG de todo color nuevo, `check-links`
   con las URLs UTM, peso, y captura visual real si el entorno lo permite
   (Playwright a 320/375/600px — pendiente desde G4).
7. Documentar como ronda G8 en los 4 archivos de control + qa-report +
   comparison-before-after + tokens + patterns (disciplina de siempre).

## CRITERIOS DE ACEPTACIÓN

- [ ] Sora 800 carga de verdad (URL distinta a la de 700, HTTP 200) o los tokens dicen 700
- [ ] `grep -c '<h2'` ≥ 3 y `<h3>` en títulos de tarjeta
- [ ] 0 enlaces sin UTM (salvo placeholders legales)
- [ ] 0 superlativos sin fuente en el copy
- [ ] Al menos 1 módulo con composición no centrada
- [ ] Bloque dark mode presente y documentado
- [ ] Token de personalización con fallback documentado
- [ ] Todo lo de siempre: 4 VML, tags balanceados, placeholders intactos, < 90 KB
- [ ] Ronda G8 documentada con el mismo rigor que G1–G7

## RESULTADO ESPERADO

Una pieza que no solo parece premium, sino que se comporta como profesional:
medible (UTM), accesible (headings reales), honesta (tipografía y claims), robusta
(dark mode), personal (merge tokens) y con una dirección de arte que ya no huele a
plantilla. La estética ya está — esta ronda va de sustancia.
