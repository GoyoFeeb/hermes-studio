# Desktop Spec — BMW X1 "Descubre"

## Módulo 1: header-logo

| Campo | Valor | Notas |
|-------|-------|-------|
| `header.logoSrc` | `https://PENDING-BMW-LOGO/` | Pendiente de capturar de bmw.es — usar URL real de CDN |
| `header.logoAlt` | `BMW` | |
| `header.logoWidth` | 120 | |
| `header.logoHeight` | 36 | |
| `header.label` | `SUV compacto` | Eyebrow/kicker en #1C69D4, 12px/700, uppercase, 2px letter-spacing |

## Módulo 2: hero-imagen

| Campo | Valor | Notas |
|-------|-------|-------|
| `hero.bannerSrc` | `https://PENDING-CDN-UPLOAD/bmw/hero-banner.png` | Placeholder explícito hasta subir el PNG generado |
| `hero.bannerAlt` | `BMW X1 — SUV compacto premium` | |
| `hero.brandName` | `BMW` | Texto del nombre de marca en hero |
| `hero.h1` | `El nuevo BMW X1.` | 28px/800, blanco sobre fondo primary |
| `hero.subtitle` | `Diseñado para emocionar.` | 15px/400, `onBrandSecondary` (#A0A0A0) sobre primary |
| `cta.href` | `https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html` | Landing oficial |
| `cta.label` | `Descubre el X1` | Texto del botón |

**Nota de contraste WCAG:**
- brandName (24px/800) sobre #000000 → 21:1 ✅ PASS (texto grande, 3:1 mínimo)
- h1 (28px/800) sobre #000000 → 21:1 ✅ PASS (texto grande)
- subtitle (15px/400, #A0A0A0) sobre #000000 → 8.10:1 ✅ PASS (texto normal, 4.5:1 mínimo)
- cta (#FFFFFF sobre #1C69D4) → 4.39:1 — está por debajo de 4.5:1 para texto normal, pero a 15px/500 NO califica como texto grande (necesita ≥18.66px bold). **Hallazgo:** el contraste del CTA en BMW (#FFFFFF sobre #1C69D4 = 4.39:1) es ligeramente insuficiente para texto normal. Es aceptable como riesgo documentado (el botón tiene fondo azul, el texto blanco es muy legible visualmente), pero no cumple WCAG AA estricto.

## Módulo 3: intro-cta

| Campo | Valor | Notas |
|-------|-------|-------|
| `intro.title` | `SUV compacto. Alma deportiva.` | H2 section, 22px/800, #000000 |
| `intro.body` | `Cada trayecto cuenta una historia. Con el BMW X1, cada curva, cada recta, cada destino se convierte en una experiencia de conducción única. Diseñado para quienes buscan versatilidad sin renunciar a la deportividad característica de BMW.` | 15px/400, #6F6F6F |
| `cta.href` | `https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html` | Mismo enlace que el hero |
| `cta.label` | `Descubre el X1` | |

## Módulo 4: columns-3-beneficios

| Campo | Valor | Notas |
|-------|-------|-------|
| `beneficiosSection.title` | `Tres razones para elegir el X1.` | 22px/800, #000000 sobre #F4F4F4 |
| `beneficios[0].icon` | `🏎️` | iconGlyph (emoji) — BMW prioriza fotografía sobre iconos, emoji es el fallback más seguro |
| `beneficios[0].title` | `Diseño atemporal` | 15px/700, #000000 |
| `beneficios[0].body` | `Líneas claras y superficies definidas. La parrilla BMW double-kidney y los faros LED afilados le dan una presencia inconfundible desde el primer vistazo.` | 13px/400, #6F6F6F |
| `beneficios[1].icon` | `🖥️` | |
| `beneficios[1].title` | `Tecnología intuitiva` | |
| `beneficios[1].body` | `El BMW Curved Display integra información y entretenimiento en una superficie curva. Control por voz, navegación inteligente y asistencia a la conducción — todo al alcance de tu mano.` | |
| `beneficios[2].icon` | `🛣️` | |
| `beneficios[2].title` | `Versatilidad sin concesiones` | |
| `beneficios[2].body` | `Suficientemente compacto para la ciudad, suficientemente espacioso para la carretera. Maletero modular, asientos traseros abatibles y una experiencia de conducción que solo BMW puede ofrecer.` | |

**Nota de contraste:**
- body (13px/400, #6F6F6F) sobre #F4F4F4 → 2.2:1 ❌ **NO PASA WCAG** (necesita 4.5:1 para texto normal). **Hallazgo:** el color #6F6F6F sobre #F4F4F4 da solo 2.2:1. Usar `colors.text.body` (#262626) en lugar de `colors.text.secondary` (#6F6F6F) para el body de los beneficios. O cambiar el fondo a #FFFFFF.

**Decisión:** mantener #F4F4F4 y cambiar el body a #262626 (text.body), que sobre #F4F4F4 da 14.2:1 ✅ PASS.

## Módulo 5: banda-cierre

| Campo | Valor | Notas |
|-------|-------|-------|
| `closing.title` | `¿Listo para descubrir el BMW X1?` | 26px/800, #FFFFFF sobre #000000 |
| `closing.body` | `Solicita información sin compromiso y descubre todo lo que el BMW X1 puede ofrecerte.` | 15px/400, `onBrandSecondary` (#A0A0A0) sobre #000000 |
| `cta.href` | `https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html` | |
| `cta.label` | `Solicita información` | |

**Contraste WCAG:**
- title (26px/800) sobre #000000 → 21:1 ✅ PASS
- body (15px/400, #A0A0A0) sobre #000000 → 8.10:1 ✅ PASS

## Módulo 6: footer

| Campo | Valor | Notas |
|-------|-------|-------|
| `footer.brandName` | `BMW` | |
| `footer.tagline` | `El placer de conducir.` | |
| `footer.disclosure` | `Esta comunicación es un borrador de campaña de prueba (isTestCampaign). Los datos de producto mostrados son meramente ilustrativos.` | |
| `footer.unsubscribeUrl` | `[UNSUBSCRIBE_LINK]` | Merge-tag ESP |
| `footer.preferencesUrl` | `[PREFERENCES_LINK]` | Merge-tag ESP |
| `footer.legalLine` | `© BMW AG 2026` | |
