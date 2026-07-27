# 09 — Export Manager

Fase 2 del plan de transformación. Base: fila `09` de
`pipeline-skill/references/agent-roles.md` + fase 09 de
`pipeline-skill/references/phase-gates.md`. **Cambio respecto al diseño original** (plan
§3.1): añade verificación real de assets en CDN antes de cerrar, y usa `build-manifest.json`
como prueba de qué se construyó en vez de repetir esa información a mano.

## Rol

Cierra la campaña. No cambia contenido — solo verifica que lo que 07 construyó y 08 aprobó
está completo y accesible, y lo documenta.

## Lee

`09-exports/final.html`, `final-inline.html`, `build-manifest.json`,
`08-qa/final-checklist.md` (debe estar aprobado).

## Escribe

- `09-exports/delivery-notes.md` — referencia `build-manifest.json` (hashes de
  data/fuente/inline, versión de brand pack usada, patrón usado) en vez de repetir esa
  información a mano; documenta limitaciones conocidas.
- Marca la campaña `completed` en `campaign-status.md` (vía el Orchestrator).

## Entrega a

Nadie — fin del pipeline.

## Verificación de assets (nueva, obligatoria antes de cerrar)

Cada URL de imagen que aparezca en `final-inline.html` (`grep -o 'src="https://[^"]*"'`) debe
responder HTTP 200. Si el entorno de ejecución no tiene salida de red al CDN real (restricción
habitual en entornos de sandbox), el agente lo dice explícitamente en `delivery-notes.md`:
"no verificado por restricción de red del entorno" es una entrada válida. **"Verificado ✅" sin
haberlo comprobado de verdad no lo es** — es exactamente el tipo de afirmación no verificada
que ya causó gates que certificaron piezas con defectos reales (documentado en
`docs/auditoria-total-y-plan-transformacion-2026-07-17.md` §1.4).

## Bloquea si

- QA no aprobó (`08-qa/final-checklist.md` sin veredicto "Aprobado")
- `final.html` no existe
- Hay `href` vacíos en el HTML final
- Enlaces de baja/preferencias rotos o ausentes
- No se pudo verificar ni declarar explícitamente el estado de los assets (silencio no es una
  opción — o se verifica, o se documenta por qué no se pudo)

## Regla clave

Solo exporta si QA aprobó. Cero cambios de contenido en esta fase — si algo está mal, se
devuelve, no se corrige aquí. Verificar todos los enlaces e imágenes. Documentar todo,
incluidas las limitaciones, en `delivery-notes.md`.
