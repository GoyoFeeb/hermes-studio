# Desktop Spec — Rolex Datejust "Una fecha para recordar"

## Módulo 1: header-logo

| Campo | Valor | Notas |
|-------|-------|-------|
| `header.logoSrc` | `https://PENDING-ROLEX-LOGO/` | Pendiente — corona Rolex es SVG inline en el header real, sin URL de CDN localizable en esta ronda (Q-004) |
| `header.logoAlt` | `Rolex` | |
| `header.logoWidth` | 90 | |
| `header.logoHeight` | 32 | |
| `header.label` | `OYSTER PERPETUAL` | Eyebrow real observado en rolex.com — nombre de la colección, no un claim de marketing. #212121, 12px/700, uppercase, 2px letter-spacing |

## Módulo 2: hero-imagen

| Campo | Valor | Notas |
|-------|-------|-------|
| `hero.bannerSrc` | `https://PENDING-CDN-UPLOAD/hero-banner.png` | Placeholder hasta generar y subir el PNG (ver `06-data/campaign-data.json` y `09-exports/delivery-notes.md`) |
| `hero.bannerAlt` | `Rolex Datejust con esfera verde oliva, acero Oystersteel y oro Everose` | |
| `hero.brandName` | `ROLEX` | Kicker de marca, 24px/700 |
| `hero.h1` | `Una fecha para recordar` | 34px/700, blanco, sobre fondo `colors.primary` (#127749) — cita real (rolex.com), 5 palabras |
| `hero.subtitle` | `El Datejust con esfera verde oliva, acero Oystersteel y oro Everose.` | 15px/300, `colors.onBrandSecondary` (#ECECEC) sobre primary — paráfrasis descriptiva, no copia literal |
| `cta.href` | `https://www.rolex.com/es/watches/datejust` | Landing oficial, fuente de toda la investigación |
| `cta.label` | `Descubrir el Datejust` | Sin verbo de compra directa |

**Nota de contraste WCAG** (ver también `04-design/layout.md`):
- brandName (24px/700) sobre #127749 → 5.58:1 ✅ PASS
- h1 (34px/700) sobre #127749 → 5.58:1 ✅ PASS (texto grande, umbral 3:1, con margen de sobra)
- subtitle (15px/300, #ECECEC) sobre #127749 → 4.73:1 ✅ PASS (ajustado tras corrección del pack v1.0.1)
- CTA (#FFFFFF sobre #127749, 15px/700) → 5.58:1 ✅ PASS

## Módulo 3: intro-cta-asimetrico

| Campo | Valor | Notas |
|-------|-------|-------|
| `intro.title` | `Una ventana a las 3.` | H2, 22px/700, #212121, alineado a la izquierda (64%) |
| `intro.body` | `Presentado en 1945, el Datejust fue el primer reloj de pulsera en mostrar la fecha en una ventana sobre la esfera. Ocho décadas después, sigue siendo el gesto que lo define.` | 15px/300, #666666, alineado a la izquierda |
| `cta.href` | `https://www.rolex.com/es/watches/datejust` | Mismo enlace que el hero |
| `cta.label` | `Ver la colección Datejust` | CTA secundario (pastilla outline), columna derecha (36%) |

**Nota de contenido:** "Presentado en 1945" y "ventana sobre la esfera a las 3h" son hechos verbatim observados en la página fuente (ver `02-analysis/visual-analysis.md`) — el resto de la frase es redacción propia, no copia literal del párrafo real.

**Contraste:** body (15px/300, #666666) sobre #FFFFFF → 5.74:1 ✅ PASS.

## Módulo 4: columns-3-beneficios-sin-icono

| Campo | Valor | Notas |
|-------|-------|-------|
| `beneficiosSection.title` | `Cuatro razones materiales.` | 22px/700, #212121 sobre #F8F8F8 |
| `beneficios[0].title` | `Oystersteel y oro Everose` | 13px/700, #212121 |
| `beneficios[0].body` | `El bisel estriado y el brazalete combinan acero resistente a la corrosión con el tono cálido del oro Everose, la aleación de oro rosa propia de Rolex.` | 13px/300, #666666 |
| `beneficios[1].title` | `Hermeticidad Oyster` | |
| `beneficios[1].body` | `La caja Oyster protege el mecanismo interior con una estanqueidad que ha definido la relojería de herramienta moderna.` | |
| `beneficios[2].title` | `Cronómetro Superlativo certificado` | |
| `beneficios[2].body` | `Cada Datejust supera los controles de precisión, resistencia e impermeabilidad de la certificación oficial de cronómetro superlativo.` | |
| `beneficios[3].title` | `La lupa Cyclops` | |
| `beneficios[3].body` | `Sobre la ventana de fecha, a las 3h, la lupa Cyclops amplía la lectura sin alterar el equilibrio de la esfera.` | |
| `beneficiosSection.highlight` | `Presentado en 1945` | Insignia final, 14px/700, #212121, borde #D4D4D4 |
| `beneficiosSection.highlightNote` | `Icono constante en la relojería Rolex.` | 11px/300, #666666 |

**Nota de contenido:** 4 ítems (extremo superior del rango 2-4 admitido por el componente) — las 4 razones son observaciones directas de la página fuente (materiales visibles en el producto fotografiado, texto "SUPERLATIVE CHRONOMETER OFFICIALLY CERTIFIED" en la esfera, lupa Cyclops visible en el zoom del vídeo, ventana de fecha a las 3h citada en el copy real). Ninguna cifra técnica no verificada (calibre, reserva de marcha, resistencia al agua en metros).

**Contraste:** body (13px/300, #666666) sobre #F8F8F8 → 5.41:1 ✅ PASS (corregido en el pack v1.0.1, ver `layout.md`).

## Módulo 5: banda-cierre-asimetrico

| Campo | Valor | Notas |
|-------|-------|-------|
| `closing.title` | `Descubrir el Datejust en persona.` | 22px/700, #FFFFFF sobre `colors.deep` (#0B3E27), a todo el ancho arriba |
| `closing.body` | `Localice un distribuidor oficial Rolex y viva el Datejust de cerca.` | 15px/300, `colors.onBrandSecondary` (#ECECEC) sobre deep — "localizador de distribuidores" es una función real observada en el header de rolex.com, no un dato inventado |
| `cta.href` | `https://www.rolex.com/es/watches/datejust` | Mismo destino que el hero |
| `cta.label` | `Descubrir el Datejust` | CTA suelto, alineado a la izquierda, ancho fijo (280px desktop) |

**Contraste:**
- title (22px/700) sobre #0B3E27 → 12.12:1 ✅ PASS
- body (15px/300, #ECECEC) sobre #0B3E27 → 10.26:1 ✅ PASS

## Módulo 6: footer

| Campo | Valor | Notas |
|-------|-------|-------|
| `footer.brandName` | `Rolex` | |
| `footer.tagline` | `Relojería suiza.` | Descriptor factual mínimo — sin eslogan inventado |
| `footer.disclosure` | `Esta comunicación es un borrador de campaña de prueba (isTestCampaign). El contenido procede de observación pública de rolex.com y no ha sido aprobado por Rolex.` | Mismo patrón que BMW X1 (public-source-campaign-pattern) |
| `footer.unsubscribeUrl` | `[UNSUBSCRIBE_LINK]` | Merge-tag ESP |
| `footer.preferencesUrl` | `[PREFERENCES_LINK]` | Merge-tag ESP |
| `footer.legalLine` | `© Rolex 2026` | |
