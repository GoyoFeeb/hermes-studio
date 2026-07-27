# Visual Verification Flow

> Cómo ejecutar el bucle de verificación visual antes de cerrar cualquier ronda de diseño.

---

## Regla fundamental

**Ninguna ronda de diseño se cierra sin captura antes/después revisada.**

Cada cambio en el HTML editable debe pasar por este flujo antes de marcarse como completado:

```
HTML editable → juice (inline) → render-preview.js → comparar capturas → aprobar
```

---

## Script

```
scripts/render-preview.js
```

### Uso

```bash
node scripts/render-preview.js \
  --file ruta/del/archivo.html \
  --out-prefix ruta/prefijo-de-salida
```

### Ejemplo

```bash
# Baseline de la pieza actual
node scripts/render-preview.js \
  --file newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html \
  --out-prefix newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/baseline/base
```

### Salida

| Archivo | Ancho | Propósito |
|---|---|---|
| `{prefix}-320.png` | 320px | Móvil pequeño (verificación apilado) |
| `{prefix}-375.png` | 375px | Móvil estándar |
| `{prefix}-600.png` | 600px | Escritorio email |
| `{prefix}-600-dark.png` | 600px | Modo oscuro (confirmar que no se invierte) |

El script falla con exit code ≠ 0 si la navegación falla, el archivo no existe, o cualquier captura da error.

---

## Flujo completo por ronda

### Paso 0: checksum del HTML original

```bash
shasum -a 256 fuente.html > fuente.sha256
```

### Paso 1: captura "antes"

```bash
node scripts/render-preview.js --file fuente.html --out-prefix ronda-N/before
```

### Paso 2: modificar el HTML

Editar el archivo HTML directamente. Prohibido modificar `final-premium-v2.html` y su inline al mismo tiempo — siempre editar el editable, luego regenerar el inline con juice.

### Paso 3: inline

```bash
node -e "
const j=require('juice').default||require('juice');
const fs=require('fs');
const h=fs.readFileSync('fuente.html','utf-8');
fs.writeFileSync('fuente-inline.html',j(h));
"
```

### Paso 4: captura "después"

```bash
node scripts/render-preview.js --file fuente.html --out-prefix ronda-N/after
```

### Paso 5: revisar ambas

Abrir los PNGs generados y comparar visualmente antes/después. Prestar atención a:
- Regresiones visuales (algo que funcionaba y dejó de hacerlo)
- Cambios no intencionados (colores, espaciados, fuentes)
- Comportamiento en modo oscuro (la captura dark debe ser idéntica a la clara)
- Apilado mobile a 320px

### Paso 6: documentar

- Actualizar `comparison-before-after.md` con tabla de cambios
- Actualizar `qa-report.md` con los checks de la ronda
- Actualizar los 4 archivos de control de la campaña
- Si se introducen nuevos patrones, actualizar `component-patterns.md` y `design-tokens-premium.json`

### Paso 7: verificar que el HTML no cambió sin querer

```bash
shasum -c fuente.sha256   # debe dar OK para la versión "antes"
```

---

## Requisitos del entorno

- Node.js 18+
- Playwright 1.40+ (`npm install playwright`)
- Chromium (`npx playwright install chromium`)
- Acceso de red para fuentes externas (fonts.gstatic.com, CDN de imágenes)
- Resolución mínima de pantalla virtual: 600×3000px