# Desktop Spec — Nike Pegasus 42

## Módulo 1: header-logo

| Campo | Valor | Notas |
|-------|-------|-------|
| `header.logoSrc` | `https://PENDING-NIKE-LOGO/` | Pendiente de capturar de nike.com |
| `header.logoAlt` | `Nike` | |
| `header.logoWidth` | 80 | Swoosh más pequeño que logos de otras marcas |
| `header.logoHeight` | 28 | |
| `header.label` | `RUNNING` | Eyebrow/kicker en #111111, 11px/500, uppercase |

## Módulo 2: hero-imagen

| Campo | Valor | Notas |
|-------|-------|-------|
| `hero.bannerSrc` | `https://PENDING-CDN-UPLOAD/nike/hero-banner.png` | Placeholder hasta subir PNG |
| `hero.bannerAlt` | `Nike Pegasus 42 — zapatilla de running` | |
| `hero.brandName` | `Nike Pegasus 42` | Marca + modelo |
| `hero.h1` | `Diseñado para correr.` | 28px/500, blanco sobre primary |
| `hero.subtitle` | `Men's Road Running Shoes` | 16px/400, #A0A0A0 sobre primary |
| `cta.href` | `https://www.nike.com/t/pegasus-42-mens-road-running-shoes-S1bYkOza/IB1873-702` | |
| `cta.label` | `Comprar el Pegasus 42` | |

**Contraste WCAG:** título blanco sobre #111111 → 16.5:1 ✅ PASS | subtitle #A0A0A0 sobre #111111 → 6.9:1 ✅ PASS

## Módulo 3: intro-cta

| Campo | Valor | Notas |
|-------|-------|-------|
| `intro.title` | `Diseñado para correr.` | 20px/500, #111111 |
| `intro.body` | `El Nike Pegasus 42 lleva la amortiguación responsive a un nuevo nivel. Con una unidad Air Zoom curvada full-length y una malla ultraligera, cada zancada se siente con más energía que nunca.` | 14px/400, #707072 |
| `cta.href` | Misma URL de producto | |
| `cta.label` | `Comprar el Pegasus 42` | |

## Módulo 4: card-tarifa-3

| Campo | Valor | Notas |
|-------|-------|-------|
| `eyebrow` | `NUEVA GENERACIÓN` | 12px/700, uppercase, #111111 |
| `title` | `Tecnología que impulsa.` | 20px/500, #111111 |
| `subtitle` | `Tres razones para dar el salto al Pegasus 42.` | 14px/400, #707072 |
| `items[0].icon` | `https://PENDING-NIKE-ICON-AIRZOOM/` | Icono real de Nike (amortiguación) pendiente de capturar — o usar un bullet minimal como texto si no se consigue |
| `items[0].title` | `Air Zoom Full-Length` | |
| `items[0].body` | `Unidad curvada que ofrece una sensación propulsiva desde el talón hasta la puntera, con el mayor retorno de energía de Nike.` | |
| `items[0].href` | Misma URL de producto | |
| `items[0].linkLabel` | `Más información` | |
| `items[1].icon` | `https://PENDING-NIKE-ICON-FIT/` | |
| `items[1].title` | `Ajuste mejorado` | |
| `items[1].body` | `Más espacio en la puntera y el antepié respecto al modelo anterior, para una pisada más natural y cómoda.` | |
| `items[1].href` | Misma URL | |
| `items[1].linkLabel` | `Más información` | |
| `items[2].icon` | `https://PENDING-NIKE-ICON-BREATHABLE/` | |
| `items[2].title` | `Upper transpirable` | |
| `items[2].body` | `Malla ligera más suave y transpirable que en iteraciones anteriores, manteniendo el pie fresco en todo momento.` | |
| `items[2].href` | Misma URL | |
| `items[2].linkLabel` | `Más información` | |

## Módulo 5: banda-cierre

| Campo | Valor | Notas |
|-------|-------|-------|
| `closing.title` | `¿Preparado para la próxima zancada?` | 20px/500, #FFFFFF sobre #111111 |
| `closing.body` | `El Pegasus 42 te espera. Descubre por qué es la zapatilla de running diario más icónica de Nike.` | 14px/400, #A0A0A0 sobre #111111 |
| `cta.href` | Misma URL de producto | |
| `cta.label` | `Comprar el Pegasus 42` | |

## Módulo 6: footer

| Campo | Valor | Notas |
|-------|-------|-------|
| `footer.brandName` | `Nike` | |
| `footer.tagline` | `Just Do It.` | |
| `footer.disclosure` | `Esta comunicación es un borrador de prueba (isTestCampaign).` | |
| `footer.unsubscribeUrl` | `[UNSUBSCRIBE_LINK]` | Merge-tag ESP |
| `footer.preferencesUrl` | `[PREFERENCES_LINK]` | Merge-tag ESP |
| `footer.legalLine` | `© Nike, Inc. All Rights Reserved.` | |
