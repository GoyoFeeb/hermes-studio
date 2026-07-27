# Final Checklist — Rolex Datejust "Una fecha para recordar"

## Aprobado para prueba interna

| # | Ítem | Estado |
|---|---|---|
| 1 | Render obligatorio | ⚠️ No disponible en este entorno (Playwright sin librerías del sistema, Chrome extension bloquea `file://`) — sustituido por verificación exhaustiva del HTML fuente, ver `visual-qa.md` |
| 2 | Contenido vs. brief/specs | ✅ Los 6 módulos coinciden con `04-design/desktop-spec.md` y `05-copy/body-copy.md` |
| 3 | Enlaces/imágenes/legal/accesibilidad | ✅ Ver `links-qa.md` — 0 hrefs vacíos, 0 imgs sin alt, disclosure de prueba presente |
| 4 | Fidelidad de marca | ✅ **5/5 puntos coherentes** (actualizado 2026-07-25 tras generar el hero real) — ver `brand-fidelity-qa.md` |
| 5 | Paridad fuente/inline | ✅ `check-parity` (Gate 2 del production gate) pasó |
| 6 | Schema / claims / contraste / column-balance / brand-pack-completeness / production-readiness / hero-decision | ✅ Los 11 gates del `production-gate-motor.ts` pasaron (ver salida completa en `task-log.md`) |
| 7 | Asunto/preheader no vacíos y consistentes con el hero | ✅ "Una fecha para recordar." + preheader que amplía con material/variante, mismo H1 |

## Bloqueos de producción (no bloquean esta prueba, sí un envío real)

| # | Bloqueo | Severidad | Acción |
|---|---|---|---|
| B-001 | Hero **generado y verificado** ✅ (2026-07-25) — pero `hero.bannerSrc` sigue en `PENDING-CDN-UPLOAD` hasta la subida | 🟠 Alto (bajó de crítico) | Falta solo subir el PNG a CDN, actualizar el campo y reconstruir. El asset existe y pasó fidelidad de marca |
| B-002 | Logo Rolex sin asset real | 🟠 Alto | Usuario aporta SVG/PNG real de la corona |
| B-003 | fromEmail/enlaces de baja-preferencias son placeholders | 🟠 Alto | Configuración de ESP real, fuera del alcance de este pipeline |
| B-004 | Aprobación comercial/legal de Rolex no obtenida | 🔴 Crítico para producción | Fuera del alcance de una campaña de prueba interna — mismo patrón que BMW X1 |
| ~~B-005~~ | ~~Verificación visual real del hero generado pendiente~~ | ✅ **Resuelto 2026-07-25** | Hero generado por el usuario y verificado: 9/10 criterios del `photography.treatment`. Ver `brand-fidelity-qa.md` punto 2 |
| B-006 | La esfera del hero generado no lleva texto de marca ni fecha visible bajo la lupa Cyclops | 🟡 Medio (solo si se usa en producción real) | Consecuencia deseada de la regla "arte sin texto" del flujo `generate-hero-image`. Para un envío real de marca, sustituir por fotografía oficial de Rolex |

## Veredicto

**Aprobado para prueba interna.** `isTestCampaign: true`, `productionReady: false`. No apto para
envío real hasta resolver B-001 a B-004. Ningún error crítico de los que bloquean incluso una
prueba (§"Bloquea si" de `agents/08-qa-specialist.md`): no hay texto legal incorrecto, no hay
precio/descuento erróneo, el CTA principal tiene `href`, `campaign-data.json` es válido, asunto y
preheader no están vacíos, y ningún hallazgo de fidelidad de marca contradice una prohibición
explícita del pack (al contrario: el pack se respetó en los 4 puntos verificables).

Entrega a: **09 — Export Manager.**
