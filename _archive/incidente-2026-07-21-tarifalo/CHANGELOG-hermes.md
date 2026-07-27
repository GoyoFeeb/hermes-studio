# Engine CHANGELOG

## 2026-07-17 — Prompt 11: Biblioteca de componentes premium

### Creado

- `engine/components/` con 12 archivos (11 componentes + INVENTORY.md):
  - `_shell.html` — envoltorio de página (DOCTYPE, head, media queries, outer table)
  - `preheader.html` — div oculto con meta description
  - `hero.html` — hero asimétrico post-ronda-02 (H1 izq + stat der + CTA 19px VML)
  - `trustBar.html` — pill lila con 3 checks, cada item parametrizado
  - `tarifasHeader.html` — cabecera de sección con kicker rule (reutilizable)
  - `cardTarifa.html` — tarjeta con franja de acento + icono oficial + enlace UTM
  - `pasos.html` — 3 pasos numerados con halo
  - `listaPremium.html` — premiumListRow con badge de icono (4 items)
  - `bandaCierre.html` — closing band con CTA VML 19px
  - `footer.html` — legal + placeholders de baja/preferencias/dirección
  - `ctaBulletproof.html` — parcial VML+fallback compartido por hero y cierre

### Convención de placeholders

- Tokens: `{{token:path.to.field}}`, resuelto contra brand-tokens.json
- Datos de campaña: `{{data:field}}`, resuelto contra campaign-data.json
- Bucles: `{{#each:items}} ... {{/each}}`
- Condicionales: `{{#if:last}}`, `{{#unless:last}}`

### Fuente de extracción

- `newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html`
- Estado post-ronda-10 (CTA 19px bold, iconos oficiales integrados)

### Decisiones

- Los colores de VML (`strokecolor="#FF5A3C" fillcolor="#FF5A3C"`) se mantienen hardcodeados
  en los componentes porque son parte de la identidad de marca y no tienen token separado.
  Si otra marca usara un color CTA distinto, habría que añadirlo a brand-tokens.json.
- Los CDN base URL se parametriza como `{{data:cdnBase}}` para permitir cambio de dominio.
- `design-tokens-premium.json` queda como registro histórico (ya fusionado en brand-tokens.json v2.2.2).
- No se modificó brand-tokens.json — todos los tokens necesarios ya existían en v2.2.2.

### Pendiente (próximo prompt)

- Build script que ensamble los componentes + datos → HTML final
- Schema de campaign-data.json
- Verificación de paridad (conteos fuente vs suma de componentes)