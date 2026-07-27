# Pack de prompts — Fase 4: Limpieza

3 prompts para ejecutar F4 del plan (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`,
§4): archivar el motor perdedor (React Email) y los restos aspiracionales/muertos catalogados
en §1.2 y §1.3, y sanear la documentación para que describa el sistema real. Continúa la
numeración: 23-25.

## Restricción técnica descubierta (aplica a todo el pack)

Los archivos de la carpeta montada (`sistema-final/` y todo lo de abajo) **no se pueden borrar
ni renombrar directamente** — cualquier `rm`/`mv` sobre un archivo ya existente falla con
"Operation not permitted" (verificado en varios intentos a lo largo de F1-F3, documentado en
cada CHANGELOG como "restricción de la carpeta montada"). Existe una herramienta,
`allow_cowork_file_delete`, que pide permiso al usuario para desbloquear el borrado de una ruta
concreta. Procedimiento de "archivar" en este pack, para cada pieza:

1. Copiar el contenido a su ubicación de archivo (`_archive/f4-limpieza-2026-07-XX/...`,
   seguido de la estructura relativa original) — esto SÍ funciona sin permiso (crear archivos
   nuevos no está restringido).
2. Intentar `rm -rf` / `rmdir` la ruta original.
3. Si falla, llamar a `allow_cowork_file_delete` con esa ruta y reintentar.
4. Si el usuario deniega el permiso (o no se puede completar por cualquier motivo), dejar la
   ruta original en su sitio con un marcador explícito (`ARCHIVED.md` dentro del directorio, o
   comentario de cabecera en el archivo si es un solo archivo) que diga "superseded, ver
   _archive/..." — nunca fingir que se borró si no se borró.

## Orden

| # | Prompt | Qué archiva/limpia | Estado |
|---|---|---|---|
| 23 | `23-archivar-react-email.md` | `react-email-template/`, `07-code/react-email/` de cada campaña, `export-html.tsx`, `prepare-react-email.ts`, `newsletter-schema.json` — el motor perdedor completo (§1.3) | ✅ completado |
| 24 | `24-archivar-restos.md` | Scripts puntuales, `ejemplo-proyecto/`, `.hermes/desktop-attachments/`, `core/components/` pre-G1, `campaigns/` vacías (9/10), `brand-library/`, + residuos puntuales ya documentados en F1-F3 (`newsletter-system/engine/` stray, `brands/test-broken/`, `agentes/` vacío) | ✅ completado |
| 25 | `25-sanear-docs-y-cierre-f4.md` | `migration-map.md` fantasma, READMEs desactualizados — que la documentación describa el sistema real, no el aspiracional. Cierre de F4. | ✅ completado |

## Fase 4 — CERRADA (2026-07-21)

Veredicto: **APTO**. Todo archivado con trazabilidad en `_archive/f4-*/`, documentación vigente
saneada. Detalle completo en `docs/f4-limpieza-cerrada.md`.

## Reglas de oro del pack

- **Archivar, no borrar sin más** — para piezas con valor histórico real (React Email, el
  único otro motor que se probó) el contenido debe sobrevivir en `_archive/`, legible, con una
  nota de por qué se retiró. Para piezas puramente vacías/fantasma (carpetas de género sin
  contenido, `brand-library/_template/` muerta) no hace falta preservar "nada" — pero si el
  borrado no se puede completar (permiso denegado), se documenta igual, no se deja a medias en
  silencio.
- **Ninguna campaña real pierde su `09-exports/` ni su `06-data/`** — solo se archiva
  `07-code/react-email/` (el código intermedio, ya no la fuente de verdad de nada desde que
  existe el motor), nunca el resultado final de una campaña ya entregada.
- **`package.json` y la documentación de scripts se actualizan en el mismo prompt que archiva**
  — nunca queda un `npm run prepare-react-email` apuntando a un script que ya no está donde
  dice, sin al menos una nota de que fue archivado y dónde.
- **Un prompt por sesión, captura antes de cerrar.**
