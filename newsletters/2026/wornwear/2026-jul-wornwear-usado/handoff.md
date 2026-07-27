# Handoff

## From

Agente anterior: 06/07 — Newsletter Data Specialist / HTML Email Developer

## To

Agente siguiente: 08 — Email QA Specialist

## Context

Campaña completa de Patagonia Worn Wear. Build ejecutado y validado (BUILD OK, 0 warnings, 20 KB inline, 6 módulos). HTML listo en 09-exports/final.html y 09-exports/final-inline.html.

## Files to Read

- `00-brief/brief.md` — Brief con restricciones
- `03-strategy/structure.md` — Estructura y claims prohibidos
- `05-copy/body-copy.md` — Copy completo
- `05-copy/cta-options.md` — CTA y UTM
- `06-data/campaign-data.json` — Datos fuente
- `09-exports/final.html` — HTML build output
- `09-exports/final-inline.html` — HTML inlined
- `09-exports/build-manifest.json` — Build manifest (6 modules, 0 warnings)
- `brands/wornwear/tokens/brand-tokens.json` — Brand pack v2.2.1

## Required Action

1. **Visual QA**: Abrir final.html en navegador, verificar:
   - Logo Worn Wear visible (sobre fondo blanco en header)
   - Hero: foto banner + brand name + H1 + subtitle + CTA sobre fondo negro
   - Intro: título + body + CTA secundario sobre blanco
   - Beneficios: 3 columnas sin icono, barrita decorativa, sobre beige #EFE7DA
   - Banda de cierre: título + body + CTA sobre fondo oscuro #1A1A1A
   - Footer: placeholders legales sobre beige
2. **Responsive QA** (≤599px): verificar mobile-stack funciona en todos los módulos
3. **Outlook QA**: verificar VML bulletproof buttons (6 VML roundrect en manifest)
4. **Links QA**: verificar UTM por módulo (utm_content=hero, intro, cierre)
5. **Accessibility/Contrast QA**: check-contrast — 8/8, pero H1 del hero aparece en blanco (ver Issue #1 abajo)
6. **Check parity**: `npm run check-parity` — 0 tolerancia a ediciones manuales
7. **Run production-gate-motor**: debe quedar en verde o cada fallo documentado

## Known Issues for QA

| # | Issue | Severidad | Documentado en |
|---|---|---|---|
| 1 | **H1 hero en blanco en vez de naranja**: hero-imagen.html hardcodea `color:#FFFFFF` para H1 y brandName (engine/components/hero-imagen.html líneas 19 y 26). El brand pack especifica `typography.hero.h1.color: #FA4616` pero el componente no usa ese token — es una limitación preexistente del motor. El H1 aparece blanco sobre fondo negro, que contrasta bien (21:1) pero no coincide con la identidad de marca (el titular "Put Used to Use" en la web real es naranja). | 🟡 Media | Este handoff |
| 2 | **Preheader redundancia**: "equipo Patagonia... Respaldado por Patagonia" repite "Patagonia". No es un problema de claims, solo de estilo. | 🟢 Baja | Handoff 05 |
| 3 | **Hero banner placeholder**: `bannerSrc` apunta a `https://PENDING-CDN-UPLOAD/hero-banner.png` — no es un asset real. El HTML tendrá un icono de imagen rota hasta que se suba el asset real. | 🟡 Media | assets-notes.md |
| 4 | **Logo con fondo blanco**: el PNG del logo tiene fondo blanco intrínseco. Funciona en el header (fondo blanco) pero no se puede usar en banda-cierre ni sobre fondo oscuro. | 🟡 Media | assets-notes.md |
| 5 | **CTA contraste**: 5.95:1 (negro #000000 sobre naranja #FA4616) ✅ PASA. Decisión consciente de accesibilidad — la web real usa blanco (3.53:1, falla). | 🟢 Documentado | brand pack changelog |

## Constraints

- No editar manualmente los HTMLs de 09-exports/ (check-parity detecta cambios)
- production-gate-motor debe ejecutarse completo
- Si un gate falla, documentar como bloqueo real — no ignorar

## Expected Output

- `08-qa/visual-qa.md` — Revisión visual
- `08-qa/responsive-qa.md` — Verificación responsive
- `08-qa/outlook-qa.md` — Verificación VML/Outlook
- `08-qa/links-qa.md` — Verificación de enlaces y UTM
- `08-qa/final-checklist.md` — Checklist completo
- `08-qa/return.md` — Resultado de QA (PASS / cambios necesarios)
- handoff.md actualizado para Agente 09 (Export Manager)
- campaign-status.md, task-log.md, next-steps.md sincronizados
