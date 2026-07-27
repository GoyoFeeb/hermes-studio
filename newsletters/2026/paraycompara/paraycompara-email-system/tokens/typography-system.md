# Typography System — Para y Compara Email

> Versión 1.0
> Propósito: Definir la jerarquía tipográfica del sistema

---

## Familia

```css
font-family: Arial, Helvetica, sans-serif;
```

No se usan Google Fonts ni fuentes externas. Arial/Helvetica garantiza compatibilidad en todos los clientes de correo.

---

## Escala tipográfica

| Token | Uso | Desktop | Móvil | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|---|
| `--h1` | Título hero | 30px | 26px | 800 | 1.15 | 0 |
| `--h2` | Título sección | 22px | 20px | 800 | 1.2 | 0 |
| `--h3` | Título card | 16px | 15px | 700 | 1.25 | 0 |
| `--body` | Texto general | 16px | 15px | 400 | 1.55 | 0 |
| `--body-small` | Texto card | 13px | 13px | 400 | 1.45 | 0 |
| `--micro` | Microcopy / legal | 12px | 11px | 400 | 1.4 | 0 |
| `--eyebrow` | Etiqueta superior | 12px | 12px | 700 | 1.3 | 2.5px |
| `--cta` | Botón CTA | 16px | 16px | 700 | 1.4 | 0.5px |

---

## Reglas de uso

### H1 — Título hero

- Solo **uno** por newsletter
- Nunca dentro de una card
- Siempre centrado
- Color: `#29262D`
- Margen inferior: 10px

```html
<h1 style="font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:800;color:#29262D;margin:0 0 10px;line-height:1.15;text-align:center;mso-line-height-rule:exactly;">
  Ahorra en tu tarifa de fibra y móvil
</h1>
```

### H2 — Título de sección

- Separador visual entre bloques
- Centrado o alineado a la izquierda
- Color: `#5E2E91` (marca) o `#29262D` (lectura)
- Margen inferior: 24-28px

```html
<p style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:#5E2E91;margin:0 0 24px;line-height:1.2;text-align:center;mso-line-height-rule:exactly;">
  Compara todo tipo de tarifas
</p>
```

### H3 — Título de card

- Siempre dentro de una card
- Color: `#5E2E91`
- Margen inferior: 4-6px

```html
<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#5E2E91;margin:0 0 6px;line-height:1.25;mso-line-height-rule:exactly;">
  Móvil
</p>
```

### Body — Texto general

- Color: `#66616A`
- Máximo 2-3 líneas en cards

```html
<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:400;color:#66616A;margin:0 0 24px;line-height:1.55;mso-line-height-rule:exactly;">
  Compara ofertas de más de 30 compañías y encuentra una opción que encaje mejor contigo.
</p>
```

### Body small — Texto en cards

- Color: `#66616A`
- Cards de categoría y beneficio

```html
<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:400;color:#66616A;margin:0;line-height:1.45;mso-line-height-rule:exactly;">
  Datos y llamadas adaptados a tu consumo.
</p>
```

### Micro — Texto legal / footer

- Color: `#99939B`
- Footer, preheader, microcopy

```html
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:400;color:#99939B;margin:0;line-height:1.4;text-align:center;mso-line-height-rule:exactly;">
  Gratis, rápido y sin complicaciones.
</p>
```

### Eyebrow — Etiqueta superior

- Uppercase
- Letter-spacing: 2.5px
- Color: `#7B1FA2`
- Siempre sobre el H1

```html
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#7B1FA2;margin:0 0 12px;line-height:16px;letter-spacing:2.5px;text-transform:uppercase;mso-line-height-rule:exactly;">
  COMPARA, ELIGE Y AHORRA
</p>
```

### CTA — Botón

- Solo dentro del componente CTA
- No repetir como texto plano

---

## Responsive

| Elemento | Desktop (600px) | Móvil (375px) | Móvil pequeño (320px) |
|---|---|---|---|
| H1 | 30px | 26px | 24px |
| H2 | 22px | 20px | 19px |
| H3 | 16px | 15px | 14px |
| Body | 16px | 15px | 14px |
| Body small | 13px | 13px | 12px |
| Micro | 12px | 11px | 11px |
| Eyebrow | 12px | 12px | 11px |
| CTA | 16px | 15px | 14px |

Los cambios de tamaño se aplican mediante media queries:

```css
@media only screen and (max-width:599px) {
  .h1-responsive { font-size:26px !important; }
  .h2-responsive { font-size:20px !important; }
}
```

---

## Usos permitidos

| Elemento | Etiqueta HTML | Nota |
|---|---|---|
| Título hero | `<h1>` | Solo uno por newsletter |
| Título sección | `<p>` con weight 800 | No es un heading real |
| Título card | `<p>` con weight 700 | No es un heading real |
| Body | `<p>` | — |
| Microcopy | `<p>` | — |
| Eyebrow | `<p>` | — |
| CTA | `<a>` dentro de tabla | — |

**Regla**: Solo un `<h1>` real por newsletter. Los títulos de sección y card se maquetan con `<p>` y peso de fuente.