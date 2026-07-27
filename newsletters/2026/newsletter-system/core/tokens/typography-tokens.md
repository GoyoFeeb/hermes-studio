# Core Typography Tokens — Universal

> Sistema base, sin dependencia de marca.

---

## Familia

```css
font-family: Arial, Helvetica, sans-serif;
```

## Escala base

| Token | Desktop | Mobile | Weight | Line-height | Uso |
|---|---|---|---|---|---|
| `--h1` | 30px | 26px | 800 | 1.15 | Título hero (uno por newsletter) |
| `--h2` | 22px | 20px | 800 | 1.2 | Título sección |
| `--h3` | 16px | 15px | 700 | 1.25 | Título card |
| `--body` | 16px | 15px | 400 | 1.55 | Texto general |
| `--body-small` | 13px | 13px | 400 | 1.45 | Texto card |
| `--micro` | 12px | 11px | 400 | 1.4 | Footer, microcopy |
| `--eyebrow` | 12px | 12px | 700 | 1.3 | Etiqueta superior, uppercase |
| `--cta` | 16px | 15px | 700 | 1.4 | Botón |

## Reglas

- Un solo `<h1>` por newsletter
- Sin Google Fonts
- Las marcas pueden overridear sizes, weights y colors
- No pueden cambiar la familia (Arial/Helvetica por compatibilidad)