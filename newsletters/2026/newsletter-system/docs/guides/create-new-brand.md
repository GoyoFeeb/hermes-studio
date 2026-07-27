# Create New Brand — Instrucciones

> Cómo añadir una nueva marca al sistema de newsletters.

---

## 1. Duplicar template

```bash
cp -r brands/_template brands/tu-marca
```

## 2. Configurar tokens

Editar `brands/tu-marca/tokens/brand-tokens.json`:

```json
{
  "brand": "Tu Marca",
  "colors": {
    "primary": "#HEX",
    "ctaBackground": "#HEX",
    ...
  },
  "assets": {
    "logo": "URL_DEL_LOGO"
  }
}
```

## 3. Añadir logo

Colocar en `brands/tu-marca/assets/logo.png`.
Recomendado: PNG, 200×55px, fondo transparente.

## 4. Definir voice

Crear `brands/tu-marca/voice-and-copy-guide.md`.
Incluir tono, CTAs, claims permitidos y prohibidos.

## 5. Generar campaña ejemplo

Copiar `campaigns/saving/base.html` a `brands/tu-marca/examples/saving.html`.
Reemplazar placeholders `[BRAND_COLOR]`, `[LOGO]`, `[CTA_TEXT]` con valores reales.

## 6. Probar

- Preview a 600, 390 y 320px
- Verificar VML en botones
- Verificar footer
- Verificar responsive

## 7. Validar checklist

- [ ] brand-tokens.json completo
- [ ] Logo visible
- [ ] CTA funcional
- [ ] Footer con datos reales
- [ ] Inline generado
- [ ] Previews correctas
- [ ] Sin placeholders accidentales