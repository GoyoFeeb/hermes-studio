# Source Links — Rolex Datejust "Una fecha para recordar"

## URLs de referencia

| URL | Estado | Uso | Fecha verificación |
|-----|--------|-----|-------------------|
| https://www.rolex.com/es/watches/datejust | ✅ Referencia oficial localizada. Pendiente de aprobación cliente para producción. | Landing principal del modelo, CTA principal, fuente completa del análisis visual (02): colores computados, tipografía computada, forma de CTA, tratamiento fotográfico, iconografía, ritmo de voz, ritmo estructural | 2026-07-25 |
| https://fonts.googleapis.com/css2?family=Archivo (pesos 300 y 700) | ✅ Verificado HTTP 200 en fonts.gstatic.com | Fuente web real del pack (sustituto de Helvetica Now Text) | 2026-07-25 |

## URLs pendientes de verificar

| URL | Uso previsto | Notas |
|-----|-------------|-------|
| (ninguna) | | |

## Notas

- No se han recibido assets visuales del cliente (logotipo, imágenes de producto) — 02 investigó directamente sobre rolex.com/es/watches/datejust con Chrome real (getComputedStyle + custom properties CSS para colores exactos, no aproximación visual).
- No se han recibido guías de marca — el brand pack se construyó por observación directa, con cada valor marcado como documentado/observado/inferido en `brands/rolex/tokens/brand-tokens.json` y su `_changelog`.
- Esta campaña sigue el mismo patrón que la campaña BMW X1 (`pipeline-skill/references/public-source-campaign-pattern.md`): datos públicos y reales, sin aprobación formal de cliente — `isTestCampaign: true`, `productionReady: false` durante todo el pipeline.
