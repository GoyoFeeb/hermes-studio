# Outlook QA — 2026-jul-uax-fp-online

Agente: 08 QA Specialist · 2026-07-22

**No verificado en un Outlook real ni en Litmus/Email on Acid en esta sesión** (sin acceso
desde el sandbox) — advertencia heredada, igual que en el resto de campañas del sistema.

Revisión de código fuente (garantías estructurales, no visuales):

| Comprobación | Resultado |
|---|---|
| CTAs usan `cta-bulletproof.html` (VML `v:roundrect` + fallback `<a>`) | ✅ los 4 CTA de esta campaña (`hero-centrado`, `intro-cta`, `category-grid`, `banda-cierre`) usan `{{include:cta-bulletproof}}` |
| `<!--[if mso]>` para fuente Arial forzada en Outlook | ✅ heredado de `_shell.html`, sin cambios |
| Tablas con `role="presentation"`, `cellpadding="0"`, `cellspacing="0"`, `border="0"` | ✅ en los 5 componentes nuevos |
| Sin CSS Grid/Flexbox estructural | ✅ (todo el layout de `columns-3-beneficios`/`category-grid` es con `<table>`/`<td width="33%">`) |

Pendiente: prueba real en Outlook de escritorio/web antes de envío — mismo criterio que el resto
de campañas del sistema (ver `patterns/saving.md` para el precedente).
