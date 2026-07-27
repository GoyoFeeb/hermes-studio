# PROMPT 11 — Extraer la biblioteca de componentes premium (engine/components/)

## CONTEXTO

Eres el Orchestrator de Hermes. Empieza la Fase 1 del plan de transformación
(`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`): convertir el conocimiento
premium de la campaña piloto en un motor reutilizable. Este prompt crea la biblioteca de
componentes. Sin ella, cada campaña nueva parte de cero.

**Fuente de verdad**: `newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html`
(estado post-ronda-10: CTA 19px bold, iconos oficiales integrados). NO uses
`core/components/` (reflejan el estado pre-G1) ni reconstruyas de memoria.

**Prerequisito**: `brands/paraycompara/tokens/brand-tokens.json` debe estar en v2.2.0
(prompt 09 ejecutado). Verifícalo antes de empezar; si sigue en 2.1.0, para y avisa.

## CONVENCIÓN DE PLACEHOLDERS

- Token de marca: `{{token:colors.primary}}`, `{{token:radius.card}}`, `{{token:shadows.cta}}` —
  la ruta es la del JSON de brand-tokens v2.2.0.
- Contenido de campaña: `{{data:title}}`, `{{data:cta.href}}`, `{{data:items[n].body}}` —
  campos que rellenará el campaign-data.json (schema en el prompt 12).
- Bloques repetibles (tarjetas, ítems de lista, pasos): delimitar con
  `{{#each:items}} ... {{/each}}` alrededor del fragmento que se repite.
- Todo lo que NO sea placeholder se copia **literal** de la pieza fuente, incluidos
  comentarios condicionales `<!--[if mso]>`, VML, clases mobile-* y estilos inline.

## TAREAS

1. **Inventario primero.** Recorre la pieza fuente de arriba abajo y produce
   `engine/components/INVENTORY.md`: tabla de bloques identificados con su rango
   aproximado de líneas, qué tokens usa cada uno y qué campos de contenido necesita.
   El inventario esperado es aproximadamente este (verifícalo contra el HTML real,
   puede variar):

   | Componente | Contenido |
   |---|---|
   | `preheader.html` | Preheader oculto |
   | `header.html` | Logo sobre fondo de marca |
   | `hero-asimetrico.html` | H1 izq + stat pill der, CTA VML 19px, composición post-ronda-02 |
   | `trust-bar.html` | Pill con 3 checks |
   | `card-tarifa.html` | Tarjeta con franja de acento, icono oficial, título, copy, enlace UTM (repetible ×4) |
   | `pasos.html` | 3 pasos numerados |
   | `lista-premium.html` | premiumListRow: tarjeta + franja + badge-icono (repetible ×4) |
   | `banda-cierre.html` | closing band con CTA VML 19px |
   | `footer.html` | Legal, placeholders de baja/preferencias, dirección |
   | `cta-bulletproof.html` | Parcial compartido: VML roundrect + fallback (usado por hero y cierre) |
   | (los que encuentres además) | Divider/espaciadores/envoltorio exterior si son bloques propios |

2. **Extraer cada componente** a `engine/components/{nombre}.html`:
   - Copia el bloque real → sustituye SOLO colores/tamaños/radios/sombras por
     `{{token:...}}` y textos/URLs/imágenes por `{{data:...}}`.
   - Cabecera de comentario en cada archivo: origen (rango de líneas de la fuente),
     fecha de extracción, tokens y campos que consume.
   - Si encuentras un valor visual que no existe en brand-tokens v2.2.0, añádelo al
     token JSON (subversión 2.2.x, documentado) — nunca lo dejes hardcodeado.
   - El envoltorio de página (DOCTYPE, head, media queries, tabla exterior 600px) va a
     `engine/components/_shell.html` con `{{data:subject}}`, `{{data:preheader}}` y un
     placeholder `{{slot:body}}` donde se insertan los demás componentes.

3. **Verificación de completitud**: concatenados mentalmente shell + componentes en el
   orden de la pieza, no debe faltar NINGUNA línea del HTML fuente. Método: cuenta
   tablas, `v:roundrect`, headings, enlaces UTM e `<img>` de la fuente y suma los de
   los componentes — deben cuadrar exactamente (51 tablas, 2 roundrect por CTA, 1 h1,
   4 h2, 11 h3, 8 enlaces UTM — verifica los números reales al empezar).

4. **Crear `engine/CHANGELOG.md`** con la entrada de este prompt: componentes creados,
   tokens añadidos (si hubo), decisiones tomadas.

## RESTRICCIONES

- No modificar la pieza fuente ni ninguna campaña. Solo lectura.
- No modificar `core/components/` (se archivarán en F4, no ahora).
- No "mejorar" nada durante la extracción: fidelidad absoluta. Las mejoras ya se
  hicieron en 15 rondas; el objetivo es capturarlas, no reinterpretarlas.
- No crear todavía build script ni schema — son los prompts 12 y 13.

## CRITERIOS DE ACEPTACIÓN

- [ ] `engine/components/INVENTORY.md` con la tabla completa verificada contra el HTML real
- [ ] Un archivo por componente + `_shell.html`, cada uno con cabecera de trazabilidad
- [ ] 0 valores visuales hardcodeados que existan como token (grep de hex de marca
      `#5E2E91|#3E244D|#7B1FA2|#FF5A3C` en los componentes → solo dentro de `{{token:...}}` o en VML donde el placeholder no sea viable, documentado)
- [ ] Conteos estructurales fuente vs suma de componentes: exactos
- [ ] VML y condicionales mso byte a byte idénticos a la fuente
- [ ] brand-tokens.json solo cambia si faltaban tokens (documentado en CHANGELOG)
- [ ] `engine/CHANGELOG.md` creado con la entrada del prompt 11
