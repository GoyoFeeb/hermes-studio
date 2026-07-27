# QA Checklist Template — Para y Compara

> Versión 1.0
> Instrucciones: Marca cada ítem como PASS, FAIL, WARNING o N/A

---

## Visual

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 1 | Hero image presente y correcta | | |
| 2 | Sin iconos de imagen rota | | |
| 3 | Colores de marca (#5E2E91, #FF5A3C) | | |
| 4 | Tipografía correcta (Arial/Helvetica) | | |
| 5 | Jerarquía visual clara | | |
| 6 | Espaciados coherentes con el sistema | | |
| 7 | Cards visualmente consistentes | | |
| 8 | CTA visible y con padding suficiente | | |
| 9 | Sin texto cortado / overflow | | |
| 10 | Footer equilibrado | | |

## Responsive

| # | Ítem | 600px | 480px | 390px | 375px | 320px |
|---|---|---|---|---|---|---|
| 11 | Sin scroll horizontal | | | | | |
| 12 | Columnas apiladas correctamente | | | | | |
| 13 | CTA a ancho completo | | | | | |
| 14 | Texto legible, sin compresión | | | | | |
| 15 | Imágenes fluidas | | | | | |
| 16 | Paddings consistentes | | | | | |
| 17 | Hero proporcionado | | | | | |
| 18 | Footer legible | | | | | |

## Outlook

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 19 | Botones con VML | | |
| 20 | Border-radius con fallback | | |
| 21 | Sin flexbox / grid | | |
| 22 | Sin position:absolute | | |
| 23 | Sin columnas rotas | | |
| 24 | mso-line-height-rule presente | | |

## Enlaces

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 25 | CTA principal — href correcto | | |
| 26 | CTA final — href correcto | | |
| 27 | Enlace de baja | | |
| 28 | Enlace de preferencias | | |
| 29 | Sin enlaces vacíos | | |
| 30 | Sin placeholders accidentales | | |

## Accesibilidad

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 31 | Un solo h1 | | |
| 32 | alt descriptivos en imágenes clave | | |
| 33 | alt="" en iconos decorativos | | |
| 34 | Contraste > 4.5:1 en texto | | |
| 35 | CTA comprensible sin contexto visual | | |
| 36 | Tamaño mínimo 11px | | |
| 37 | Contenido útil sin imágenes | | |

## Modo oscuro

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 38 | Logo legible en modo oscuro | | |
| 39 | CTA visible | | |
| 40 | Fondos no desaparecen | | |
| 41 | Texto no se pierde | | |

## Imágenes

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 42 | URL CDN verificada (HTTP 200) | | |
| 43 | display:block en todas | | |
| 44 | width/height explícitos | | |
| 45 | max-width:100% | | |
| 46 | Sin file:// ni rutas locales | | |
| 47 | Sin SVG inline | | |

## CTA

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 48 | Color #FF5A3C | | |
| 49 | Texto blanco | | |
| 50 | Altura mínima 50px (padding) | | |
| 51 | Radio pill | | |
| 52 | VML para Outlook | | |
| 53 | Ancho completo en móvil | | |
| 54 | Mismo estilo en hero y final | | |
| 55 | Sin duplicación de copy en imagen | | |

## Placeholders

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 56 | [UNSUBSCRIBE_LINK] identificado | | |
| 57 | [PREFERENCES_LINK] identificado | | |
| 58 | Dirección física pendiente | | |
| 59 | Asset hero placeholder presente | | |

## Legal

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 60 | Copyright presente | | |
| 61 | Dirección física o placeholder | | |
| 62 | Texto RGPD/LOPD suficiente | | |

## Preheader

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 63 | Visible solo en modo oculto | | |
| 64 | font-size:1px | | |
| 65 | mso-hide:all | | |
| 66 | Texto atractivo para inbox | | |

## Código

| # | Ítem | Resultado | Notas |
|---|---|---|---|
| 67 | lang="es" | | |
| 68 | role="presentation" en tablas | | |
| 69 | Estilos inline | | |
| 70 | Media queries presentes | | |
| 71 | Sin JavaScript | | |
| 72 | Sin CSS incompatible | | |
| 73 | Sin código residual (React Email, etc.) | | |

---

## Resumen

| Categoría | PASS | FAIL | WARNING | N/A | Total |
|---|---|---|---|---|---|
| Visual | | | | | 10 |
| Responsive | | | | | 8 |
| Outlook | | | | | 6 |
| Enlaces | | | | | 6 |
| Accesibilidad | | | | | 7 |
| Modo oscuro | | | | | 4 |
| Imágenes | | | | | 6 |
| CTA | | | | | 8 |
| Placeholders | | | | | 4 |
| Legal | | | | | 3 |
| Preheader | | | | | 4 |
| Código | | | | | 7 |
| **Total** | | | | | **73** |