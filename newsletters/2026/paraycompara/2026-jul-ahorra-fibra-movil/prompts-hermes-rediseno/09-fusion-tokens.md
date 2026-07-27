# PROMPT 09 — Fusionar tokens premium al core de marca

## CONTEXTO

Eres el Orchestrator de Hermes. Con la fuente única ya declarada (ronda 08), el siguiente
paso de la auditoría estructural es cerrar el Hallazgo 4: todo el aprendizaje fino de
tipografía, espaciado, sombras y patrones conseguido en las rondas G1–G8.1 vive solo en
`v5-premium/design-tokens-premium.json` (9.7 KB, campaña piloto), mientras que
`newsletters/2026/newsletter-system/brands/paraycompara/tokens/brand-tokens.json` (v2.1.0,
el archivo que de verdad consume el resto del sistema) no lo tiene. Mientras sigan separados,
cualquier campaña nueva de Para y Compara arranca sin ese criterio.

He leído ambos archivos completos. Hay tres tipos de contenido distintos — trátalos de
forma diferente:

### A. Adiciones limpias (sin conflicto, solo fusionar)

- `radius`: premium añade `cardStripe`, `circleHalo`, `chip`, `statPill` — no existen en core.
- `shadows`: sección entera nueva en premium, no existe en core.
- `typography.h2OnBrand`: variante nueva (26px, blanco) que no existe en core.
- `typography.h2Section.letterSpacing`: `-0.3px` — core no tiene letterSpacing en h2Section.
- `personalization`: snippet de merge-tag para el ESP — nuevo, generalizable (quita la
  referencia a "hero" específico de esta campaña, deja la estructura reutilizable).
- `patterns.accentSignature`, `patterns.statPill`, `patterns.premiumListRow`: patrones
  nuevos documentados en G4/G5, no existen en `components.patterns` de core.
- `patterns.badgeElevation` (retirado en G7): añadir como entrada histórica con su
  `status: "retired-g7"` — sirve para que la próxima campaña no lo reintroduzca sin saber
  por qué se quitó.
- `darkMode` (retirado en G8.1): mismo caso — añadir con `status: "retired-g8.1"` y la
  nota completa. Es información valiosa para no repetir la regresión de iconos.

### B. Conflictos reales — verificar contra el HTML antes de decidir, no fusionar a ciegas

- **`typography.h1Hero` no es el mismo concepto en los dos archivos.** En core, `h1Hero`
  es la versión de texto oscuro (`#29262D`) para H1 sobre fondo claro, y existe una
  `h1HeroOnBrand` aparte (30px, blanco) para H1 sobre fondo de marca. En premium,
  `h1Hero` tiene `color: "#FFFFFF"` y `letterSpacing: "-0.5px"` — es decir, describe la
  versión **sobre fondo de marca**, pero con el nombre del otro concepto. Antes de fusionar:
  abre `09-exports/final.html` (la fuente única) y comprueba qué H1 se usa realmente en el
  hero — tamaño, color, letter-spacing reales — y resuelve la colisión de nombres ahí:
  lo más probable es que `h1HeroOnBrand` deba actualizarse a 32px/-0.5px/1.14 (el valor de
  premium) y `h1Hero` (texto oscuro) se mantenga como está en core, sin tocar. Documenta
  la resolución explícitamente, no la escondas.
- **`typography.body.size` difiere: core=14, premium=13.** El histórico de control files
  (ronda G7, 2026-07-16) registra "cuerpo 13→14px" como cambio ya aplicado — es decir,
  `design-tokens-premium.json` quedó desactualizado tras G7 y nunca se corrigió. Verifica
  el tamaño real en `09-exports/final.html` (grep del `font-size` en los `<p>` de cuerpo)
  y usa ese valor, no el que traiga cualquiera de los dos JSON a ciegas.
- **`radius.card`: core=16, premium=18** (cambio de G6). Verificar contra el HTML igual
  que los dos anteriores antes de fijar el valor final.

### C. No fusionar (quedan documentados pero no pasan al core)

- `utm.campaign` y `utm.content` — son valores de ESTA campaña, no de la marca. Lo que sí
  debe pasar al core es la referencia a la convención (`docs/naming-conventions.md`), no
  los valores concretos.
- `_g6`, `_g7`, `_g8`, `_g8_1` — las notas de proceso son útiles como historial pero no
  deben ensuciar el archivo de producción del core. Muévelas a un único changelog dentro
  del propio `brand-tokens.json` (un array `_changelog` al final) o a
  `newsletter-system/docs/releases/`, referenciando la ronda de origen sin repetir el texto
  completo en cada campo.

## TAREAS

1. Verificar contra `09-exports/final.html` los 3 conflictos del punto B y fijar el valor real.
2. Escribir la fusión en `brand-tokens.json`, subiendo la versión a `2.2.0`. Preservar la
   estructura existente (`colors`, `typography`, `spacing`, `radius`, `surfaces`,
   `components`) — no la reescribas desde cero, amplíala.
3. Añadir un bloque `_changelog` (o archivo separado en `docs/releases/`) que resuma qué se
   fusionó, de qué ronda viene cada cosa, y cómo se resolvieron los 3 conflictos.
4. Marcar `v5-premium/design-tokens-premium.json` como superseded: añade al inicio del JSON
   un campo `"_superseded": "Fusionado en brands/paraycompara/tokens/brand-tokens.json v2.2.0 el 2026-07-17. Este archivo queda como registro histórico de las rondas G1-G8.1, no se debe seguir editando."`
   No lo borres ni lo muevas — sigue siendo la campaña de origen de estos tokens.
5. **No toques** `newsletter-system/core/components/*.html` en esta ronda — esos 4 archivos
   siguen reflejando el estado pre-G1 y quedan pendientes explícitamente para la ronda de
   "motor único" (ya anotada en next-steps.md). Si lo tocas aquí, te sales del objetivo único
   de esta ronda.
6. Sincronizar los 4 archivos de control con lo hecho y con este pendiente explícito.

## RESTRICCIONES

- Ningún valor se fusiona sin verificar contra `09-exports/final.html` cuando hay conflicto
  (punto B). Si no puedes verificar algo, documéntalo como pendiente — no lo inventes.
- No se borra ni se sobrescribe `design-tokens-premium.json` — se marca como superseded.
- No se toca ninguna campaña de otra marca (`brands/demo/`) en esta ronda.
- Un objetivo por ronda: fusión de tokens. No aproveches para tocar componentes HTML ni copy.

## CRITERIOS DE ACEPTACIÓN

- [ ] Los 3 conflictos (h1Hero/h1HeroOnBrand, body.size, radius.card) verificados contra
      el HTML real y resueltos, con la resolución documentada
- [ ] `brand-tokens.json` v2.2.0 con las adiciones limpias (grupo A) incorporadas
- [ ] `_changelog` o documento de release con la fusión trazada
- [ ] `design-tokens-premium.json` marcado `_superseded`, no borrado
- [ ] `core/components/*.html` sin modificar (fuera de alcance de esta ronda)
- [ ] 4 archivos de control sincronizados, con el motor único como próximo pendiente explícito
