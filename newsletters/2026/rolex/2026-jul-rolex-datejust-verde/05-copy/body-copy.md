# Body Copy — Rolex Datejust "Una fecha para recordar"

## Módulo 1: header-logo
- `header.logoSrc` — asset pendiente (Q-004)
- `header.label`: **OYSTER PERPETUAL**

## Módulo 2: hero-imagen
- `hero.bannerAlt`: **Rolex Datejust con esfera verde oliva, acero Oystersteel y oro Everose**
- `hero.brandName`: **ROLEX**
- `hero.h1`: **Una fecha para recordar**
- `hero.subtitle`: El Datejust con esfera verde oliva, acero Oystersteel y oro Everose.
- `cta.label`: **Descubrir el Datejust**

## Módulo 3: intro-cta-asimetrico
- `intro.title`: **Una ventana a las 3.**
- `intro.body`: Presentado en 1945, el Datejust fue el primer reloj de pulsera en mostrar la fecha en una ventana sobre la esfera. Ocho décadas después, sigue siendo el gesto que lo define.
- `cta.label`: **Ver la colección Datejust**

## Módulo 4: columns-3-beneficios-sin-icono
- `beneficiosSection.title`: **Cuatro razones materiales.**
- Beneficio 1:
  - `title`: **Oystersteel y oro Everose**
  - `body`: El bisel estriado y el brazalete combinan acero resistente a la corrosión con el tono cálido del oro Everose, la aleación de oro rosa propia de Rolex.
- Beneficio 2:
  - `title`: **Hermeticidad Oyster**
  - `body`: La caja Oyster protege el mecanismo interior con una estanqueidad que ha definido la relojería de herramienta moderna.
- Beneficio 3:
  - `title`: **Cronómetro Superlativo certificado**
  - `body`: Cada Datejust supera los controles de precisión, resistencia e impermeabilidad de la certificación oficial de cronómetro superlativo.
- Beneficio 4:
  - `title`: **La lupa Cyclops**
  - `body`: Sobre la ventana de fecha, a las 3h, la lupa Cyclops amplía la lectura sin alterar el equilibrio de la esfera.
- `beneficiosSection.highlight`: **Presentado en 1945**
- `beneficiosSection.highlightNote`: Icono constante en la relojería Rolex.

## Módulo 5: banda-cierre-asimetrico
- `closing.title`: **Descubrir el Datejust en persona.**
- `closing.body`: Localice un distribuidor oficial Rolex y viva el Datejust de cerca.
- `cta.label`: **Descubrir el Datejust**

## Módulo 6: footer
- `footer.brandName`: **Rolex**
- `footer.tagline`: **Relojería suiza.**
- `footer.disclosure`: Esta comunicación es un borrador de campaña de prueba (isTestCampaign). El contenido procede de observación pública de rolex.com y no ha sido aprobado por Rolex.
- `footer.legalLine`: © Rolex 2026

## Validación de claims (contra `scripts/lib/claim-rules.ts`, 29 reglas)

| Texto | Riesgo | Decisión |
|-------|--------|----------|
| "Una fecha para recordar" | 🟢 Ninguno — cita real del titular de rolex.com, sin cifra ni promesa | ✅ Aprobado |
| "Presentado en 1945" | 🟢 Ninguno — hecho histórico observado directamente en la página fuente | ✅ Aprobado |
| "oro Everose, la aleación de oro rosa propia de Rolex" | 🟢 Ninguno — hecho de material públicamente documentado, no una cifra ni comparativo | ✅ Aprobado |
| "hermeticidad Oyster... estanqueidad" | 🟢 Ninguno — no se cuantifica en metros/ATM (dato no verificado esta ronda, deliberadamente omitido) | ✅ Aprobado |
| "cronómetro superlativo certificado" | 🟢 Ninguno — texto observado directamente en la esfera del reloj fotografiado ("SUPERLATIVE CHRONOMETER OFFICIALLY CERTIFIED") | ✅ Aprobado |
| "lupa Cyclops... amplía la lectura" | 🟢 Ninguno — característica visible y observada directamente, no una cifra de aumento | ✅ Aprobado |
| Ninguna coincide con las 29 reglas de `claim-rules.ts` (sin "garantizado", "edición limitada", cifras técnicas de automoción/finanzas, superlativos comparativos "el más...", etc.) | 🟢 | ✅ Aprobado |
| Ningún precio, referencia de catálogo, disponibilidad ni cifra de resistencia al agua/reserva de marcha | 🟢 | ✅ Aprobado — coherente con `00-brief/requirements.md` |
