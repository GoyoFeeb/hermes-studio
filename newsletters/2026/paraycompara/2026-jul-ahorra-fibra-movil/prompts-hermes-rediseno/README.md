# Pack de prompts — Rediseño premium con Hermes

Serie de 5 prompts secuenciados para que **Hermes** (el orquestador del pipeline) ejecute
el rediseño premium de la newsletter `v5-premium/final-premium-v2.html`. Cada prompt es
autocontenido: se pega tal cual en una sesión de Hermes, en orden.

## Cómo usarlos

1. **Un prompt por ronda.** Pega el contenido completo del archivo en Hermes y déjale terminar.
2. **Revisa las capturas entre prompts.** Cada prompt obliga a Hermes a entregar capturas
   antes/después. No pases al siguiente prompt hasta que lo que ves te convenza.
3. **Si algo no te gusta, NO edites tú**: díselo a Hermes con una frase concreta
   ("el hero se ve X, quiero Y") y que él corrija dentro de la misma ronda.
4. El orden importa: 01 monta el bucle de verificación visual que usan todos los demás.

## Orden

| # | Prompt | Qué consigue |
|---|---|---|
| 01 | `01-setup-verificacion-visual.md` | El bucle captura→cambio→captura como parte del flujo. Baseline de la pieza actual. No toca el diseño |
| 02 | `02-rediseno-hero.md` | El módulo de mayor impacto: hero premium nuevo |
| 03 | `03-ritmo-editorial-secciones.md` | Rompe la sensación de plantilla: variación de composición por sección |
| 04 | `04-assets-tipografia.md` | Sora 800 real, iconos unificados, logo — el techo real de calidad |
| 05 | `05-qa-final-production-gate.md` | QA multi-viewport, claims, links, gate y documentación de cierre |

## Reglas de oro que los prompts imponen (lecciones de G1–G8.1)

- **Nada se entrega sin captura.** La regresión del dark mode (G8→G8.1) ocurrió por
  entregar cambios sin verlos renderizados. Todos los prompts exigen captura antes/después
  a 320 y 600px como criterio de aceptación, no como opción.
- **No inventar datos.** Solo copy respaldado por `00-brief/brief.md`. Los datos
  [PENDIENTE DE CONFIRMACIÓN] no entran en la pieza.
- **No tocar**: anatomía VML de CTAs, placeholders legales, UTM ya implementados,
  headings semánticos (h1/h2/h3), metas `color-scheme: light`.
- **Documentar cada ronda** en los 4 archivos de control + qa-report + comparison,
  con la misma disciplina del histórico.
- **Un objetivo por ronda.** Si un prompt revela un problema de otra área, se anota
  en next-steps.md y se respeta el alcance.

## Contexto técnico que ya está resuelto (no rehacer)

- Render real disponible: Chromium funciona en el sandbox con
  `LD_LIBRARY_PATH=/tmp/stublibs` (stub de libXdamage compilado — si el entorno se
  reinicia, recompilar: ver qa-report.md § G8.1).
- Inline: regenerar siempre con juice (`preserveMediaQueries: true`) tras cada cambio.
- Los iconos del CDN no cargan desde el sandbox (allowlist) — en las capturas salen como
  placeholder; no es un error de la pieza.
