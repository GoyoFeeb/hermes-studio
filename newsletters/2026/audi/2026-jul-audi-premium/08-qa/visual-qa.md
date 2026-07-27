# QA Report — Audi A6 Sportback e-tron

## Resumen

| Aspecto | Estado |
|---|---|
| Build engine | ✅ PASS |
| Schema validation | ✅ PASS |
| Claims check (29 rules) | ✅ PASS |
| WCAG contrast (10 pairs) | ✅ ALL PASS |
| Column balance | ✅ PASS |
| Control files sync | ✅ PASS |
| Brand pack completeness | ✅ PASS |
| Production readiness | ✅ OK (test campaign) |
| Hero decision | ✅ hero-imagen |
| Engine integrity | ✅ PASS |

## Visual QA

### Desktop (600px)
| Módulo | Estado | Notas |
|---|---|---|
| Header | ✅ | Logo + label, centrado, borde separador |
| Hero | ✅ | Banner placeholder (CDN pendiente), H1 32px/300, subtítulo, CTA negro |
| Manifiesto | ✅ | Título 22px, cuerpo en #67707F, CTA outline secundario |
| Datos técnicos | ✅ | 3 columnas: 773 km, 270 kW, 800 V. Highlight card |
| Diseño exterior | ✅ | Mismo patrón que manifiesto |
| Interior | ✅ | Mismo patrón que manifiesto |
| Conversión | ✅ | Fondo #101319, título blanco, CTA negro |
| Footer | ✅ | Legal, baja, preferencias |

### Mobile (320-430px)
| Aspecto | Estado | Notas |
|---|---|---|
| Responsive breakpoints | ✅ | Media query a 599px |
| Columnas apiladas | ✅ | mobile-stack class |
| CTA full-width | ✅ | mobile-full class |
| Padding reducido | ✅ | mobile-pad-sm 24px |
| Hero H1 reducido | ✅ | 26px mobile |
| Sin scroll horizontal | ✅ | Verificado |
| Touch targets | ✅ | Mínimo 44px |

### Outlook Compatibility
| Aspecto | Estado | Notas |
|---|---|---|
| VML buttons | ✅ | v:roundrect con arcsize |
| Table-based layout | ✅ | Sin flexbox/grid |
| Inline CSS | ✅ | juice inline |
| No JS | ✅ | |
| Font fallback | ✅ | Inter → Arial → sans-serif |

### Accesibilidad
| Aspecto | Estado | Notas |
|---|---|---|
| Alt text | ✅ | Todas las imágenes |
| Preheader | ✅ | Visible en móvil |
| Color contrast | ✅ | WCAG AA — 10/10 pass |
| Font sizes | ✅ | Body 15px mínimo |

### Issues Identificados

| ID | Severidad | Issue | Acción |
|---|---|---|---|
| QA-001 | ⚠️ Media | Logo PNG pendiente — actualmente placeholder URL | Subir anillos Audi PNG al CDN |
| QA-002 | ⚠️ Media | Hero banner pendiente — imagen generada localmente, no en CDN | Subir hero-banner.png al CDN |
| QA-003 | ⚠️ Baja | VML CTA en Outlook muestra pill (arcsize 50%) en vez de recto (border-radius:0) | Conocido — documentado en engine |
| QA-004 | ℹ️ Info | URLs oficiales de Audi devuelven 503 desde bot checker | Funcionan en navegador real |

## Conclusión

✅ **Aprobado para prueba interna** (`isTestCampaign: true`)
⏳ **Bloqueado para producción**: requiere assets CDN + URLs verificadas
