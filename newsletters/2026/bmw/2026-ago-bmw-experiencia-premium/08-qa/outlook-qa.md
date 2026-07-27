# Outlook QA — BMW Experiencia Premium

| Aspecto | Estado | Notas |
|---------|--------|-------|
| CTA con VML (v:roundrect) | ✅ | `cta-bulletproof.html` genera VML |
| CTA secundario (intro-cta) | ✅ | Misma estructura VML |
| Fallback de fuentes | ✅ | Arial/Helvetica/sans-serif seguro |
| Layout basado en tablas | ✅ | Tablas anidadas, sin CSS Grid/Flexbox |
| Sin JavaScript | ✅ | |
| Imágenes con dimensiones explícitas | ✅ | Hero banner 600×350px |

## Outlook específico

- VML arcsize: 50% (default pill) — compatible con Outlook Desktop
- No se usa `mso-line-height-rule: exactly` innecesario
- Fondo oscuro (banda-cierre) con `bgcolor="#000000"` en `<td>` — compatible
