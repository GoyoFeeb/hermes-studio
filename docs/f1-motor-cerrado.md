# F1 — Motor de generación premium: cerrada

**Fecha de cierre:** 2026-07-20

**Veredicto de la prueba de fuego (prompt 14):** **APTO**

**Iteraciones de corrección necesarias:** 0

## Qué se construyó

La Fase 1 del plan de transformación (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`,
§3.2) convierte la única pieza premium validada del sistema (`v5-premium/final-premium-v2.html`,
15 rondas de refinamiento) en un motor reutilizable: `campaign-data.json` + brand pack + patrón
de género → HTML de email premium con paridad fuente/inline garantizada por construcción.

4 prompts, ejecutados en orden en una sola sesión, cada uno documentado en `engine/CHANGELOG.md`:

1. **11 — Extracción de componentes**: `engine/components/` (9 componentes activos + 1 parcial
   compartido `cta-bulletproof.html`), extraídos byte a byte de la pieza validada, con
   `INVENTORY.md` documentando origen, tokens y datos de cada uno.
2. **12 — Schema y patrón**: `engine/schema/campaign-data.schema.json` (JSON Schema draft-07,
   cobertura 100% verificada contra los placeholders reales de los componentes) +
   `patterns/saving.md` (secuencia, ritmo, obligatorio/opcional, contrastes WCAG).
3. **13 — El ensamblador**: `engine/build-newsletter.js` + `engine/lib/` (tokens, pattern,
   assemble, verify). Pipeline en memoria: nunca escribe un output parcial o inválido en disco.
4. **14 — Prueba de fuego**: regenerar la campaña piloto desde el motor y comparar contra el
   original, estructural y visualmente, a 4 viewports.

## Resultado de la prueba de fuego

Paridad estructural: todos los conteos coinciden, salvo 3 discrepancias, las 3 rastreadas a
correcciones deliberadas ya documentadas en rondas anteriores (no defectos del motor):
- 2 tablas del original quedan sin cerrar (bug de markup preexistente); el motor genera
  siempre HTML balanceado.
- 2 `<h3>` de más: reconstrucción de 2 títulos de item ausentes en el original
  ("Antes de decidir"), ya documentada y marcada `_reconstructed: true` en los datos.
- Recuento de gris de footer: aplicación consistente del fix de contraste WCAG
  (`#99939B` → `#66616A`) ya hecho en `brand-tokens.json` v2.2.2.

Paridad visual: la región no afectada por cambios documentados (header → hero → trust bar →
cards → pasos) da 0.03-0.04% de diferencia de píxeles en los 4 viewports — esencialmente
idéntica. La región de banda de cierre + footer tiene el mismo contenido letra por letra; su
altura difiere ~6-7% por el fix de tamaño de fuente móvil ya documentado (el título pasa de 2
líneas a 1). Detalle completo, con evidencia y metodología, en
`engine/_test-output/parity-report.md`.

## Limitaciones conocidas (heredadas de los prompts 11-13, no resueltas en F1 por diseño)

- `card-tarifa.html` solo soporta el grid 2×2 fijo de 4 tarjetas; el schema permite 2-4 items
  pero la plantilla no tiene variante para 2 o 3.
- El fallo de contraste de `typography.cardLinkSecondary` (#FF5A3C a 13px/700 = 3.10:1, no pasa
  AA-normal) sigue sin resolver — requiere una decisión de diseño (agrandar el enlace o cambiar
  el color), fuera de alcance de una corrección técnica de token.
- El bug real de la campaña piloto ("Antes de decidir" con 2 títulos ausentes y una tabla sin
  cerrar en `09-exports/final.html`) **no se corrigió** — es un defecto de esa campaña
  específica, deliberadamente fuera de alcance de F1 (prohibido tocar campañas reales). Debe
  abrirse una corrección de campaña aparte antes de reenviar esa pieza.
- Solo existe un género (`saving`) — regla anti-aspiracional del plan: no se crea un patrón
  nuevo hasta que una campaña real lo necesite.
- Quedan artefactos residuales de pruebas (directorios/archivos vacíos o de prueba) que no se
  pudieron borrar por una restricción de la carpeta montada durante estas sesiones — listados
  completos en `engine/CHANGELOG.md`, ninguno referenciado por campañas reales, se pueden
  borrar manualmente sin riesgo.

## Siguiente fase

Con F1 cerrada, el motor (`engine/`) existe como infraestructura de sistema independiente de
cualquier campaña. Las fases siguientes del plan de transformación (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`)
pueden apoyarse en él — en particular, cualquier `production-gate` de Fase 3 puede usar
`build-manifest.json` para verificar que lo certificado es exactamente lo que el motor
construyó.
