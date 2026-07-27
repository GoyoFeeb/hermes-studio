# 09 — Export Manager

Base: fila `09` de `pipeline-skill/references/agent-roles.md` + fase 09 de `phase-gates.md`
(F2: verificación real de assets + `build-manifest.json` como prueba). Revisado 2026-07-21
(backup en `_archive/agents-backup-2026-07-21/`).

## Objetivo

Cerrar la campaña. No cambia contenido — verifica que lo que 07 construyó y 08 aprobó está
completo y accesible, y lo documenta con rutas exactas.

## Entradas / Lee

`09-exports/final.html`, `final-inline.html`, `build-manifest.json`,
`08-qa/final-checklist.md` (debe decir "Aprobado").

## Tareas

1. Confirmar el veredicto de QA.
2. Verificar assets en CDN (ver Validaciones).
3. Correr el gate completo: `npm run production-gate-motor -- --campaign {campaña}`.
4. Escribir `delivery-notes.md` y marcar la campaña `completed` (vía 00).

## Salidas / Escribe

- `09-exports/delivery-notes.md` — debe incluir:
  - **Rutas exactas de los 3 archivos exportados** (`final.html`, `final-inline.html`,
    `build-manifest.json`), relativas a la raíz del proyecto — quien reciba la entrega no
    debe adivinar dónde está nada.
  - Referencia a `build-manifest.json` para hashes/versión de brand pack/patrón (no se repite
    esa información a mano — el manifest ES la prueba de qué se construyó).
  - Resultado de la verificación de assets y del gate.
  - Limitaciones conocidas y bloqueos del cliente pendientes.
- Estado `completed` en `campaign-status.md` (a través de 00, no directamente).

## Validaciones (antes de cerrar)

- QA aprobado — sin veredicto "Aprobado" explícito no hay export.
- **Assets HTTP 200**: cada URL `https://` de `src=`/`href=` en `final-inline.html` responde
  200 (el Gate 5 de `production-gate-motor` lo hace). Sin salida de red en el entorno: se
  declara "no verificado por restricción de red" en `delivery-notes.md` — **"verificado ✅" sin
  haberlo comprobado no es una opción** (es el patrón de certificación falsa que causó los
  fallos históricos, plan §1.4).
- `production-gate-motor` → exit 0, o cada gate fallido documentado como bloqueo del cliente
  (ej. `isTestCampaign:true`) en `delivery-notes.md` y `next-steps.md`.
- Ningún `href` vacío en el HTML final; enlaces de baja/preferencias presentes.

## Fase completada cuando

`delivery-notes.md` existe con las rutas exactas y el estado real de cada verificación, y
`campaign-status.md` dice `completed` con su entrada correspondiente en `task-log.md`.

## Bloquea si

- QA no aprobó.
- `final.html` no existe.
- Hay `href` vacíos, o enlaces de baja/preferencias rotos/ausentes.
- El estado de los assets no se pudo ni verificar ni declarar explícitamente (el silencio no
  es una opción).

## Entrega a

Nadie — fin del pipeline. El entregable humano es `delivery-notes.md` con las rutas.

## No hacer

- Cero cambios de contenido: si algo está mal, se devuelve vía 00, no se corrige aquí.
- Nunca marcar `completed` saltándose a 00 (los 4 archivos de control deben moverse juntos).
- Nunca afirmar una verificación que no se hizo.
