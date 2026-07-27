# Brand Template — Cómo crear una nueva marca

> Instrucciones para añadir una nueva marca al sistema.

---

## Paso 1: duplicar esta plantilla

```
cp -r brands/_template brands/tu-marca
```

## Paso 2: rellenar brand-tokens.json

```json
{
  "brand": "Tu Marca",
  "version": "1.0.0",
  "extends": "core",
  "colors": {
    "primary": "#HEX",
    "ctaBackground": "#HEX",
    "ctaText": "#HEX",
    ...
  },
  "components": {
    "header": { "backgroundColor": "#HEX" },
    "cta": { "backgroundColor": "#HEX" }
  },
  "assets": {
    "logo": "URL_DEL_LOGO",
    ...
  }
}
```

## Paso 3: añadir logo

Colocar el logo en `brands/tu-marca/assets/logo.png`.
El logo debe ser PNG con fondo transparente.
Dimensiones recomendadas: 200×55px o proporción similar.

## Paso 4: definir voice & copy

Crear `brands/tu-marca/voice-and-copy-guide.md`.
Incluir tono, CTAs recomendados, claims permitidos y prohibidos.

## Paso 5: generar campaña ejemplo

1. Copiar `campaigns/saving/base.html` a `brands/tu-marca/examples/saving.html`
2. Aplicar tokens de marca (colores, logo, CTAs)
3. Probar responsive (600, 390, 320px)

## Paso 6: validar

- [ ] Tokons completos
- [ ] Logo visible
- [ ] CTA con colores de marca
- [ ] VML en botones
- [ ] Footer con datos de marca
- [ ] Previews correctas
- [ ] Sin placeholders accidentales