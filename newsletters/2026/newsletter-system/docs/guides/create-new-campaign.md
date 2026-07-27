# Create New Campaign — Instrucciones

> Cómo crear una campaña nueva para cualquier marca.

---

## 1. Elegir patrón base

| Patrón | Ruta | Cuándo usarlo |
|---|---|---|
| Saving | `campaigns/saving/base.html` | Conversión directa |
| Educational | `campaigns/educational/base.html` | Informar y generar confianza |
| Comparison | `campaigns/comparison/base.html` | Ayudar a decidir |
| Retargeting | `campaigns/retargeting/base.html` | Recuperar interés |
| Promotional | `campaigns/promotional/base.html` | Lanzamientos y promociones |
| Launch | `campaigns/launch/base.html` | Nuevos productos/servicios |
| Editorial | `campaigns/editorial/base.html` | Newsletters de contenido |
| Nurturing | `campaigns/nurturing/base.html` | Lead nurturing |
| Transactional | `campaigns/transactional/base.html` | Confirmaciones, alerts |
| Reactivation | `campaigns/reactivation/base.html` | Win-back |

## 2. Añadir marca

1. Copiar el patrón a `brands/<marca>/examples/<campaña>.html`
2. Reemplazar placeholders de marca:
   - `[BRAND_COLOR]` → color primario de la marca
   - `[LOGO]` → URL del logo
   - `[CTA_TEXT]` → texto del CTA
   - `[URL]` → URL de destino

## 3. Personalizar copy

Ver la guía de voz de la marca para el tono adecuado.

## 4. Generar inline

```bash
node -e "
const j=require('juice').default||require('juice');
const fs=require('fs');
const html=fs.readFileSync('input.html','utf-8');
fs.writeFileSync('input-inline.html',j(html));
"
```

## 5. Probar

- Preview a 600, 390 y 320px
- Check responsive
- Check VML
- Check footer

## 6. Checklist

- [ ] Logo correcto
- [ ] Colores de marca
- [ ] CTA funcional
- [ ] Enlaces reales
- [ ] Footer completo
- [ ] Inline generado
- [ ] Previews correctas