# Responsive Guidelines — Para y Compara Email System

> Versión 1.0

---

## Breakpoints

| Nombre | Ancho | Uso |
|---|---|---|
| Desktop | 600px | Ancho máximo del contenedor email |
| Tablet | 480px | Tablet vertical / móvil grande |
| Móvil estándar | 375–390px | iPhone, Pixel, Galaxy |
| Móvil pequeño | 320px | iPhone SE / mínimo soportado |

---

## Reglas responsive

### Layout
- Columnas de 2 → 1 columna apilada
- Columnas de 3 → 1 columna apilada
- CTA: ancho completo en todos los viewports
- Trust bar: 3 columnas en desktop → apilado compacto en móvil

### Padding
- Lateral desktop: 24–32px
- Lateral móvil: 16–20px

### Tipografía
- H1: 30px desktop → 26px móvil → 24px (320px)
- Body: 16px desktop → 15px móvil
- Los cambios se aplican mediante media queries

### Imágenes
- `max-width:100%` en todas
- `height:auto` en móvil (clase `.mobile-img`)
- Sin crop, sin zoom forzado

---

## Clases utilitarias

```css
@media only screen and (max-width:599px) {
  .mobile-stack {
    display:block !important;
    width:100% !important;
  }
  .mobile-full {
    width:100% !important;
  }
  .mobile-hide {
    display:none !important;
  }
  .mobile-img {
    width:100% !important;
    height:auto !important;
  }
}
```

---

## Verificación

Para cada campaña, probar como mínimo en:
1. 600px (escritorio)
2. 480px (tablet)
3. 375px (móvil estándar)
4. 320px (móvil pequeño)

Verificar:
- Sin scroll horizontal
- CTA táctil (altura mínima 44px, padding suficiente)
- Cards apiladas sin huecos
- Trust bar compacta
- Footer legible
- Hero proporcionado