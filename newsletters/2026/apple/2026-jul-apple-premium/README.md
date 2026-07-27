# Apple — Campaña Genérica Premium

## Descripción

Newsletter HTML premium para Apple con diseño minimalista y aspiracional. Sin bordes de tarjeta, sin sombras, sin barras de acento — solo tipografía masiva, imágenes a sangre dentro del contenedor de 600px, y botones limpios.

**Producto:** Apple — Campaña genérica premium (Ecosistema/Innovación)
**Idioma:** Español
**Tono:** Claro, seguro, aspiracional, minimalista

---

## Archivos

| Archivo | Descripción |
|---------|------------|
| `apple-newsletter.html` | HTML principal con estilos en cabecera + inline (recomendado para edición) |
| `apple-newsletter-inline.html` | Versión juice-inlineada — todos los estilos inline (listo para enviar) |

---

## Estructura de la newsletter

```
┌──────────────────────────────────┐
│          PREHEADER               │  (oculto, texto gancho)
├──────────────────────────────────┤
│          HEADER                  │  (logo Apple, fondo blanco)
├──────────────────────────────────┤
│     ┌────────────────────┐       │
│     │    HERO IMAGE      │       │  1200x750 → 600x375
│     │    (full-bleed)    │       │
│     └────────────────────┘       │
│     [PRODUCTO] (label)           │
│     Potencia para todo lo...     │  H1: 48px
│     Subtítulo (21px)             │
│     [Más información]            │  CTA azul #0071E3 pill
├──────────────────────────────────┤
│  ┌──────┐ ┌──────────────────┐   │
│  │ IMG  │ │ Rendimiento...   │   │  Alternado: img/text
│  │ 300w │ │ que se nota      │   │
│  └──────┘ └──────────────────┘   │
├──────────────────────────────────┤
│  ┌──────────────────┐ ┌──────┐   │
│  │ Diseñado para    │ │ IMG  │   │  Alternado: text/img
│  │ durar            │ │ 300w │   │
│  └──────────────────┘ └──────┘   │
├──────────────────────────────────┤
│  ┌──────┐ ┌──────────────────┐   │
│  │ IMG  │ │ Una experiencia  │   │  Alternado: img/text
│  │ 300w │ │ conectada        │   │
│  └──────┘ └──────────────────┘   │
├──────────────────────────────────┤
│        BLOQUE COMERCIAL          │
│        Desde [PRECIO]            │
│        [FINANCIACIÓN]            │
│        [Comprar]                 │
├──────────────────────────────────┤
│        CTA FINAL                 │
│        Descubre [PRODUCTO]       │  H2: 34px
│        [Más información]         │
├──────────────────────────────────┤
│          FOOTER                  │  Legal, unsubscribe, privacidad
└──────────────────────────────────┘
```

---

## Imágenes — Placeholders

Todas las imágenes son placeholders de `placehold.co` y deben ser reemplazadas antes del envío.

| Sección | Dimensiones originales | Visible en newsletter | Descripción |
|---------|----------------------|-----------------------|-------------|
| Hero | 1200×750px | 600×375px | Producto Apple sobre fondo blanco, iluminación suave |
| Beneficio 1 | 600×400px | 300×200px | Chip/rendimiento — detalle del procesador o pantalla |
| Beneficio 2 | 600×400px | 300×200px | Diseño/materiales — detalle del chasis o acabado |
| Beneficio 3 | 600×400px | 300×200px | Ecosistema Apple — dispositivos conectados |
| Logo header | 44×54px | 44×54px | Logo Apple monocromo negro |
| Logo footer | 20×24px | 20×24px | Logo Apple pequeño gris |

Formato recomendado: **JPG** con fondo blanco o gris claro (#F5F5F7).
Todas las imágenes deben tener `display:block`, dimensiones explícitas, y alt text descriptivo.

---

## URLs a configurar

Buscar y reemplazar los siguientes placeholders en ambos archivos HTML:

| Placeholder | Descripción |
|-------------|-------------|
| `[CTA_URL]` | URL del botón "Más información" |
| `[BUY_URL]` | URL del botón "Comprar" |
| `[SITE_URL]` | URL del sitio web (para texto del footer) |
| `[PRODUCTO]` | Nombre del producto real |
| `[chip]` | Nombre del chip/procesador |
| `[PRECIO]` | Precio real (ej: "1.299 €") |
| `[FINANCIACIÓN]` | Texto de financiación (ej: "desde 54,12 €/mes") |
| `[LEGAL_TEXT_PLACEHOLDER]` | Texto legal del bloque comercial |
| `[COMPANY_NAME]` | Nombre de la empresa |
| `[DIRECCIÓN_COMPLETA]` | Dirección postal completa |
| `[UNSUBSCRIBE_LINK]` | Enlace de baja (unsubscribe) |
| `[PRIVACY_URL]` | URL de la política de privacidad |
| `[TERMS_URL]` | URL de términos y condiciones |

---

## Comportamiento responsive

- **Breakpoint:** 599px
- **Desktop (600px+):** Layout de dos columnas en beneficios (imagen | texto alternado)
- **Mobile (<600px):** Todo se apila verticalmente. Tipografía se reduce progresivamente (H1 → 40px, H2 → 28px).
- **Imágenes:** `width:100%; height:auto` en mobile
- **Paddings:** Aumentan en mobile para mejor legibilidad (24px laterales)

---

## Outlook consideraciones

- **Botones:** VML `v:roundrect` para bulletproof buttons en Outlook
- **Fallback inline:** `<a>` con padding, bgcolor y border-radius para clientes modernos
- **Tablas:** `border-collapse:collapse` en Outlook conditional comments
- **Fuente:** Outlook usa su propia pila — `Segoe UI` es la mejor opción de la pila para Outlook
- **Anchura:** `width:600px` con max-width para Outlook — no hay degradación

### Limitaciones conocidas en Outlook

1. **Border-radius ignorado** en botones → se usa VML roundrect como fallback
2. **Alt text truncado** en imágenes → mantener bajo 100 caracteres
3. **Responsive no funciona** → layout de 600px fijo es la experiencia Outlook
4. **Padding inconsistente** en celdas de tabla → validar visualmente
5. **Fuentes personalizadas** → fallback a Arial/Segoe UI

---

## Apple Mail / Dark Mode

- `prefers-color-scheme: dark` soportado en Apple Mail y Outlook for iOS
- Clases `.apple-dark-bg`, `.apple-dark-text`, `.apple-dark-link` preparadas para dark mode
- Colores de fondo explícitos en todas las tablas
- Sin dependencia de imágenes de fondo

---

## Brand tokens

Los tokens de diseño están en `brands/apple/tokens/brand-tokens.json`:

- **Color primario:** #1D1D1F (texto)
- **Color secundario:** #6E6E73 (texto secundario)
- **CTA:** #0071E3 (azul Apple)
- **Fondo claro:** #F5F5F7
- **Tipografía:** -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif
- **Radio botón:** 50px (pill)

---

## Editor visual

Para previsualizar y editar, abre `apple-newsletter.html` en:

- **VS Code** con Live Preview o HTML Preview extension
- **Navegador** directamente (arrastrar al navegador)
- **React Email** (si se integra en el pipeline): `npm run preview-html`

---

## Validación

Antes de enviar, asegúrate de:

1. ✅ Reemplazar todos los `[PLACEHOLDER]` con contenido real
2. ✅ Verificar que todas las imágenes tienen dimensiones explícitas
3. ✅ Probar en Outlook (web + desktop + mobile)
4. ✅ Probar en Gmail (web + mobile)
5. ✅ Probar en Apple Mail
6. ✅ Validar enlaces (`npm run check-links` si está disponible)
7. ✅ Revisar `visual-qa.md` para la checklist completa

---

## Notas de diseño

Esta newsletter es una **excepción arquitectónica** en el sistema de producción. Los componentes existentes del engine (`card-tarifa`, `columns-3-beneficios`, etc.) tienen bordes, sombras y barras de acento estructurales incompatibles con el lenguaje visual de Apple. Por eso esta newsletter es **standalone** — HTML creado manualmente siguiendo los principios de diseño de Apple:

- **Cero bordes** de tarjeta o sombras
- **Cero barras** de acento o reglas decorativas
- **Tipografía masiva** (H1 48px, H2 32px)
- **Imágenes a sangre** dentro del contenedor de 600px
- **Espacio en blanco** como elemento de diseño
- **Una sola CTA** por sección, limpia y bulletproof
- **Paleta mínima** — solo #1D1D1F, #6E6E73, #0071E3, #F5F5F7
