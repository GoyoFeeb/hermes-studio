# Handoff

## From

Agente anterior: 01 — Briefing Strategist

## To

Agente siguiente: 02 — Brand Visual Analyst

## Context

Campaña Converse Chuck 70 Industrial Glam (relanzamiento/colorway, 120 €, mercado ES). Brief de dirección creativa completo con concepto único "Nuevas, con memoria." y 4 escenas. Investigación primaria terminada: PDP oficial ES, cronología oficial de marca (Chuck 70 lanzado 2013 sobre diseño de los setenta), campaña Evergreen BTS, logo oficial de Wikimedia verificado. **Converse no tiene brand pack en el sistema — first-time onboarding completo.**

## Files to Read

- `00-brief/brief.md` — Brief con todos los datos verificados de producto y contexto
- `00-brief/requirements.md` — Requisitos legales/comerciales/técnicos
- `00-brief/source-links.md` — URLs verificadas + hallazgo del 403 de Akamai en el CDN
- `00-brief/open-questions.md` — 5 preguntas abiertas [Q-001..Q-005]
- `brands/new-balance/tokens/brand-tokens.json` — Referencia de estructura de brand pack v2.2.0
- `agents/02-brand-visual-analyst.md` — Contrato de la fase

## Required Action

1. Extraer identidad visual REAL de converse.com/es con navegador (getComputedStyle / browser_console — Akamai bloquea curl): colores (fondos, texto, CTA real de la web), tipografías, radio de CTA, tratamiento fotográfico, estructura de página de la categoría Chuck 70
2. Crear `brands/converse/tokens/brand-tokens.json` (versión >= 2.2.0, mismo esquema que new-balance) — tokenizar también el color del producto (Egret/negro de la edición) y el CTA
3. Escribir `02-analysis/brand-analysis.md` + `visual-analysis.md` + `risks.md`
4. Documentar fuentes como [INFERIDOS — PENDIENTES DE CONFIRMACIÓN CLIENTE]
5. Frenar para revisión del usuario antes de pasar a Fase 03

## Constraints

- CDN de imágenes y web: 403 a curl (Akamai) — navegar con browser_console, no curl
- El patrón de género objetivo es `fotografia-primero` (fotografía protagonista, sin iconos) — verificar que la web real lo confirma
- Logo: wordmark Converse oficial (Wikimedia, 200 OK, negro/transparente) — el header real de la web usa ese wordmark negro
- No inventar colores/fuentes: todo extraído de la web real o marcado pendiente
- Las variantes de CTA del motor (`components.cta.style`) solo se activan si la web real lo justifica (verificado con Chrome)

## Risks

- La web de Converse puede proteger secciones con bot-detection — si una extracción falla, marcar el token pendiente en vez de adivinar
- Discrepancia material upper (Q-001) no afecta a tokens visuales pero sí a copy (fase 05)
- Fonts de Converse pueden ser de pago (Helvetica/Neue Haas?) — comprobar y documentar fallback email-safe

## Expected Output

`brands/converse/tokens/brand-tokens.json` + `02-analysis/` completo (brand-analysis.md, visual-analysis.md, risks.md)
