# Compatibility Guidelines — Para y Compara Email System

> Versión 1.0

---

## Clientes soportados

| Cliente | Nivel de soporte |
|---|---|
| Gmail web | ⚠️ Parcial (sin border-radius, GIF no automático) |
| Gmail Android | ⚠️ Parcial |
| Gmail iOS | ⚠️ Parcial |
| Apple Mail macOS | ✅ Completo |
| Apple Mail iOS | ✅ Completo |
| Outlook web | ⚠️ Parcial (media queries limitadas) |
| Outlook Windows | ⚠️ Parcial (sin border-radius, sin GIF, con VML) |
| Outlook móvil | ⚠️ Parcial |
| Yahoo Mail | ✅ Completo |
| Samsung Mail | ✅ Completo |

---

## Requisitos técnicos obligatorios

### HTML
- Tablas para layout (`<table>`, no `<div>`)
- `role="presentation"` en todas las tablas de layout
- `border="0" cellpadding="0" cellspacing="0"`
- Ancho máximo del contenedor: 600px

### Estilos
- Inline styles en todos los elementos
- Evitar `<style>` en `<head>` — usar juice para inline
- Sin flexbox
- Sin CSS grid
- Sin position:absolute
- Sin JavaScript
- Sin animaciones CSS esenciales

### Imágenes
- `display:block` en todas
- `width` y `height` explícitos
- `max-width:100%` en imágenes
- `alt` text en todas
- Sin SVG inline complejo
- Sin background-image críticas

### Botones
- VML `v:roundrect` para Outlook
- Fallback con `background-color` en `<td>` 
- `<a>` con `display:inline-block`
- `mso-line-height-rule:exactly`
- Altura mínima 50px

### Tipografía
- `font-family: Arial, Helvetica, sans-serif;`
- Sin Google Fonts ni fuentes externas
- `mso-line-height-rule:exactly` en todos los `<p>`

### Responsive
- Media query: `@media only screen and (max-width:599px)`
- Clases utilitarias: `.mobile-stack`, `.mobile-hide`, `.mobile-img`

### Outlook condicionales

```html
<!--[if mso]>
<v:roundrect ... />
<![endif]-->
<!--[if !mso]><!-->
  Fallback HTML
<!--<![endif]-->
```

### Preheader

```html
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;
  max-height:0;max-width:0;font-size:1px;font-family:Arial,Helvetica,sans-serif;
  color:#FFFFFF;mso-hide:all;">
  Texto de preheader
</div>
```

---

## Lo que NO funciona en ciertos clientes

| Componente | Dónde falla | Fallback |
|---|---|---|
| border-radius en cards | Gmail, Outlook Windows | Sin radio — diseño sigue funcional |
| border-radius en botones | Gmail | VML en Outlook, CSS fallback en Gmail |
| Media queries | Outlook Windows | No se aplican — diseño adaptado a 600px base |
| GIF animado | Outlook, Gmail a veces | Poster estático como fallback |
| Google Fonts | Todos los clientes | No usar — Arial/Helvetica universal |
| Background-image | Outlook | No usar para contenido crítico |
| position:absolute | Outlook | No usar |
| Flexbox / Grid | Outlook, Gmail | No usar |
| :hover | Gmail, Outlook móvil | Solo mejora secundaria |