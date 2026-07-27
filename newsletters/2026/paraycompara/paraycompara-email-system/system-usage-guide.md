# System Usage Guide — Para y Compara Email Design System

> Versión 1.0
> Cómo usar, mantener y extender el sistema

---

## Cómo crear una nueva campaña

### Paso 1: elegir plantilla base

| Tipo | Plantilla | Cuándo usarla |
|---|---|---|
| Ahorro | `campaigns/saving/campaign-saving.html` | Conversión directa. Hero + tarifas + CTA |
| Educativa | `campaigns/educational/campaign-educational.html` | Informar y generar confianza |
| Comparativa | `campaigns/comparison/campaign-comparison.html` | Ayudar a decidir entre opciones |
| Retargeting | `campaigns/retargeting/campaign-retargeting.html` | Recuperar interés, campaña corta |

### Paso 2: personalizar

1. **Hero** — Sustituir el placeholder del hero:
   ```html
   src="URL_DEL_ASSET" alt="Compara tarifas..."
   ```
   Ver `guidelines/asset-spec-system.md` para especificaciones.

2. **Copy** — Editar:
   - Eyebrow (uppercase, letter-spacing 2.5px, max 25 char)
   - H1 (max 55 char, sin punto final)
   - Texto introductorio (max 120 char)
   - CTA (max 20 char, acción clara)
   - Microcopy (opcional)
   - Cards (título + body, max 70 char cada uno)

3. **Enlaces** — Reemplazar:
   - `[UNSUBSCRIBE_LINK]` → URL real de baja
   - `[PREFERENCES_LINK]` → URL real de preferencias
   - URL del CTA → URL de destino
   - `[DIRECCIÓN FÍSICA — pendiente del cliente]` → dirección real

4. **Iconos** — Sustituir iconos de cards si la campaña lo requiere.
   Ver `guidelines/icon-spec.md`.

### Paso 3: generar inline

```bash
# Desde la raíz del sistema
npm install juice  # una vez
node -e "const j=require('juice').default||require('juice');const fs=require('fs');fs.writeFileSync('campaña-inline.html',j(fs.readFileSync('campaña.html','utf-8')));"
```

### Paso 4: probar

Usar la checklist en `guidelines/qa-checklist-template.md`. Probar como mínimo:

- 600px (desktop)
- 390px (móvil)
- 320px (móvil pequeño)

### Paso 5: enviar

El archivo `*-inline.html` está listo para copiar en Doctorsender, Mailchimp o HubSpot.

---

## Cómo sustituir un componente

1. Abrir `components/component-system.html`
2. Localizar el componente deseado
3. Copiar el bloque `<tr>...</tr>` completo (contenido dentro del `.component-preview`)
4. Pegar en la campaña
5. Ajustar tamaños de fuente si es responsive (usar clases `mobile-*`)

---

## Cómo añadir un nuevo color

1. Añadirlo a `tokens/design-tokens.json`
2. Documentarlo en `tokens/color-system.md`:
   - Hex, función, combinaciones permitidas/prohibidas
   - Ratio de contraste
3. Usar el mismo hex en HTML

---

## Cómo modificar el sistema responsive

1. Editar `tokens/spacing-system.md` si cambian las escalas
2. Editar los estilos CSS en los componentes HTML
3. Actualizar `guidelines/responsive-guidelines.md`
4. Probar en 600, 480, 390, 375 y 320px

---

## Código para generar inline

```bash
node -e "
const j = require('juice').default || require('juice');
const fs = require('fs');
const html = fs.readFileSync('input.html', 'utf-8');
fs.writeFileSync('output-inline.html', j(html));
console.log('OK');
"
```

---

## Checklist rápida post-creación

- [ ] Hero placeholder sustituido (o documentado como pendiente)
- [ ] Enlaces CTA reales
- [ ] Enlaces baja/preferencias reales
- [ ] Inline generado
- [ ] Preview visual en 600px y 390px
- [ ] Sin scroll horizontal
- [ ] Un solo h1
- [ ] lang="es"
- [ ] VML en CTAs
- [ ] Footer completo