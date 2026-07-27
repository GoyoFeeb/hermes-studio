# Outlook QA: 2026-jul-wornwear-usado

## Verificación VML

Basado en el build-manifest.json: 6 `v:roundrect` en ambos archivos (source e inline).

| Módulo | Componente | VML esperado | VML real |
|---|---|---|---|
| Hero | hero-imagen → cta-bulletproof | 1 | ✅ Presente |
| Intro | intro-cta → cta-secondary-bulletproof | 1 | ✅ Presente |
| Banda cierre | banda-cierre-asimetrico → cta-bulletproof | 1 | ✅ Presente |
| Adicionales (VML de tracking/background) | — | 3 | ✅ 3 adicionales |

Total: 6 VML roundrects — coinciden source e inline.

## Verificación de tablas

21 tablas abiertas / 21 cerradas — balance perfecto en ambos archivos.

## Verificación de meta tags

El HTML incluye `<!DOCTYPE html>`, `<meta charset="UTF-8">`, `<meta name="viewport">`, y `<!--[if mso]>` conditionals para Outlook.

## Veredicto

✅ **PASS** — VML presente en todos los CTAs, tablas balanceadas, meta tags correctos.
