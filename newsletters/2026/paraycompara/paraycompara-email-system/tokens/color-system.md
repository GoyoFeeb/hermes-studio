# Color System — Para y Compara Email

> Versión 1.0
> Propósito: Definir la paleta cromática del sistema de newsletters

---

## Paleta completa

### Primarios

| Token | Hex | Función | Uso principal |
|---|---|---|---|
| `--purple-primary` | `#5E2E91` | Marca | Header, títulos sección, iconos, trust bar, footer |
| `--purple-deep` | `#3E244D` | Contraste profundo | Hover states, variante oscura, fondos alternos |
| `--coral-cta` | `#FF5A3C` | Acción | **Único color para CTA principal** |

### Neutros

| Token | Hex | Función | Uso principal |
|---|---|---|---|
| `--white` | `#FFFFFF` | Fondo principal | Cards, contenedor, hero copy |
| `--lila-bg` | `#F8F5FC` | Fondo alterno | Separar secciones, trust bar, microcards |
| `--exterior-bg` | `#F4F3F9` | Fondo exterior | Body de la newsletter |
| `--text-primary` | `#29262D` | Texto principal | Titulares, body |
| `--text-secondary` | `#66616A` | Texto secundario | Subtítulos, descripciones |
| `--text-tertiary` | `#99939B` | Texto terciario | Microcopy, footer, legal |
| `--border` | `#EDE7F3` | Bordes | Cards, separadores, líneas |

### Funcionales

| Token | Hex | Función |
|---|---|---|
| `--link` | `#5E2E91` | Enlaces en footer |
| `--success` | `#2E7D32` | Badge ahorro, check |
| `--error` | `#D32F2F` | No usar en email |
| `--warning` | `#F57C00` | No usar en email |

---

## Reglas de uso

### ✅ Combinaciones permitidas

| Contexto | Fondo | Texto | Aceptado |
|---|---|---|---|
| Header | `#5E2E91` | `#FFFFFF` | ✅ |
| Hero copy | `#FFFFFF` | `#29262D` | ✅ |
| Sección alterna | `#F8F5FC` | `#29262D` | ✅ |
| Cards | `#FFFFFF` | `#29262D` | ✅ |
| CTA principal | `#FF5A3C` | `#FFFFFF` | ✅ |
| CTA secundario | `#FFFFFF` | `#5E2E91` + borde `#5E2E91` | ✅ |
| Footer | `#F4F3F9` | `#99939B` | ✅ |
| Trust bar | `#EAE0EA` | `#5E2E91` | ✅ |
| Eyebrow | `#FFFFFF` / `#F8F5FC` | `#7B1FA2` | ✅ |

### ❌ Combinaciones prohibidas

| Fondo | Texto | Motivo |
|---|---|---|
| `#5E2E91` | `#FF5A3C` | El coral pierde legibilidad sobre morado |
| `#FF5A3C` | `#5E2E91` | Contraste insuficiente |
| `#F8F5FC` | `#99939B` | Difícil de leer |
| `#FFFFFF` | `#FF5A3C` | El coral no debe usarse como texto |
| `#EDE7F3` | `#66616A` | Bajo contraste |

### 🔴 El coral #FF5A3C solo se usa en:

- ✅ CTA principal (botón)
- ✅ Badge promocional (opcional)
- ❌ No en títulos
- ❌ No en fondos de sección
- ❌ No en decoración
- ❌ No en iconos
- ❌ No en enlaces
- ❌ No en bordes

---

## Contraste

| Combinación | Ratio WCAG | Nivel |
|---|---|---|
| #5E2E91 sobre #FFFFFF | 7.2:1 | AAA ✅ |
| #29262D sobre #FFFFFF | 15.1:1 | AAA ✅ |
| #66616A sobre #FFFFFF | 5.8:1 | AA ✅ |
| #FFFFFF sobre #FF5A3C | 3.8:1 | AA (texto grande) ✅ |
| #FFFFFF sobre #5E2E91 | 7.2:1 | AAA ✅ |
| #99939B sobre #FFFFFF | 3.2:1 | ⚠️ Solo para texto pequeño |

---

## Modo oscuro

El sistema no incluye protecciones específicas para modo oscuro por las siguientes razones:

1. La mayoría de clientes de correo (Gmail, Outlook) invierten colores automáticamente
2. Los fondos claros se oscurecen y el texto oscuro se aclara, manteniendo contraste
3. El logo blanco sobre morado puede invertirse a morado sobre blanco — sigue siendo legible
4. El CTA coral #FF5A3C mantiene buen contraste en ambos modos

Mejora opcional (no implementada por defecto):
```html
<meta name="color-scheme" content="light dark" />
<style>
:root { color-scheme: light dark; }
[data-ogsc] .dark-fix { /* overrides específicos */ }
</style>
```

---

## Ejemplos por componente

| Componente | Fondo | Texto | Borde |
|---|---|---|---|
| Header | `#5E2E91` | `#FFFFFF` | — |
| Hero | `#FFFFFF` | `#29262D` | — |
| Trust bar | `#EAE0EA` | `#5E2E91` | — |
| Card categoría | `#FFFFFF` | `#5E2E91` + `#66616A` | `#EDE7F3` |
| Card beneficio | `#F8F5FC` | `#5E2E91` + `#66616A` | — |
| CTA | `#FF5A3C` | `#FFFFFF` | — |
| Footer | `#F4F3F9` | `#99939B` | `#DCCBD9` |
| Separador | — | — | `#EDE7F3` |