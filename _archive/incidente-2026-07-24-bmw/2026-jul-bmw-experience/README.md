# BMW — Campaña "Diseñado para emocionar"

## Descripción

Newsletter HTML premium para BMW con diseño editorial ultra-premium. Sin bordes de tarjeta, sin sombras, sin barras de acento — solo tipografía limpia, imágenes a sangre dentro del contenedor de 600px, y botones rectangulares con el azul BMW (#0066B1).

**Producto:** BMW — Campaña genérica premium "Diseñado para emocionar"
**Idioma:** Español
**Tono:** Editorial, premium, aspiracional, emocional, automotriz

---

## Archivos

| Archivo | Descripción |
|---------|------------|
| `bmw-newsletter.html` | HTML principal con estilos en cabecera + inline (recomendado para edición) |
| `bmw-newsletter-inline.html` | Versión juice-inlineada — todos los estilos inline + @media queries (listo para enviar) |

---

## Estructura de la newsletter

```
┌──────────────────────────────────┐
│          PREHEADER               │  (oculto, "Descubre una nueva forma de disfrutar cada trayecto.")
├──────────────────────────────────┤
│          HEADER                  │  (logo BMW 60×60, fondo blanco)
├──────────────────────────────────┤
│     ┌────────────────────┐       │
│     │    HERO IMAGE      │       │  1200×700 → 600×350
│     │    (full-bleed)    │       │  BMW en carretera, conducción dinámica
│     └────────────────────┘       │
│     Diseñado para emocionar.     │  H1: 44px #000000 bold
│     Tecnología, precisión...     │  Subtítulo 18px #6F6F6F
│     [Descubre tu BMW]            │  CTA azul #0066B1 rectangular
├──────────────────────────────────┤
│  El placer de conducir...        │  H2: 28px intro editorial
├──────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Serie1│ │  X1  │ │  i4  │     │  3 modelos en columna
│  │180px │ │180px │ │180px │     │
│  └──────┘ └──────┘ └──────┘     │
├──────────────────────────────────┤
│   TECNOLOGÍA (fondo #F4F4F4)    │
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │LCD   │ │ASST  │ │CONN  │     │  3 atributos con iconos 60×60
│  └──────┘ └──────┘ └──────┘     │
├──────────────────────────────────┤
│     ┌────────────────────┐       │
│     │  BMW ELÉCTRICO     │       │  600×300, fondo oscuro #262626
│     └────────────────────┘       │
│   Conduce el futuro.            │  H2: 32px blanco
│   [Explora BMW eléctricos]      │  CTA azul sobre fondo oscuro
├──────────────────────────────────┤
│  Hay sensaciones que no...      │  H2 test drive
│  [Solicita una prueba]          │  CTA final
├──────────────────────────────────┤
│          FOOTER                  │  Legal, unsubscribe, privacidad
│          fondo #F4F4F4           │
└──────────────────────────────────┘
```

---

## Imágenes — Placeholders

Todas las imágenes son placeholders de `placehold.co` y deben ser reemplazadas antes del envío.

| Sección | Dimensiones originales | Visible en newsletter | Descripción |
|---------|----------------------|-----------------------|-------------|
| Hero | 1200×700px | 600×350px | BMW en carretera, conducción dinámica, paisaje abierto |
| Modelo Serie 1 | 400×300px | 180×135px | BMW Serie 1 — frontal deportivo, diseño compacto |
| Modelo X1 | 400×300px | 180×135px | BMW X1 — SUV compacto, presencia robusta |
| Modelo i4 | 400×300px | 180×135px | BMW i4 — Gran Coupé eléctrico, líneas aerodinámicas |
| Logo header | 80×80px | 60×60px | BMW logo roundel, blanco y negro |
| Logo footer | 24×24px | 24×24px | BMW logo pequeño, gris |
| Icono Curved Display | 60×60px | 60×60px | Icono pantalla curva BMW |
| Icono Asistencia | 60×60px | 60×60px | Icono asistencia a la conducción |
| Icono ConnectedDrive | 60×60px | 60×60px | Icono conectividad BMW |
| Electrificado | 1200×600px | 600×300px | BMW i4/iX eléctrico, iluminación azul, fondo oscuro |

Formato recomendado: **JPG** con alta calidad. Fondo blanco o estudio para modelos, paisaje para hero.
Todas las imágenes deben tener `display:block`, dimensiones explícitas, y alt text descriptivo.

---

## URLs a configurar

Buscar y reemplazar los siguientes placeholders en ambos archivos HTML:

| Placeholder | Descripción |
|-------------|-------------|
| `[CTA_URL]` | URL del botón "Descubre tu BMW" — página principal o configurador |
| `[ELECTRIC_URL]` | URL del botón "Explora BMW eléctricos" — página de vehículos eléctricos |
| `[TESTDRIVE_URL]` | URL del botón "Solicita una prueba" — formulario de test drive |
| `[SITE_URL]` | URL del sitio web (para texto del footer) |
| `[COMPANY_NAME]` | Nombre del concesionario o entidad legal |
| `[DIRECCIÓN_COMPLETA]` | Dirección postal completa |
| `[UNSUBSCRIBE_LINK]` | Enlace de baja (unsubscribe) |
| `[PRIVACY_URL]` | URL de la política de privacidad |
| `[TERMS_URL]` | URL de términos y condiciones |

---

## Comportamiento responsive

- **Breakpoint:** 599px
- **Desktop (600px+):** Layout de 3 columnas en modelos y tecnología
- **Mobile (<600px):** Todo se apila verticalmente. Tipografía se reduce progresivamente (H1 → 36px, H2 → 24px).
- **Imágenes modelos:** `width:100%; height:auto; max-width:280px` en mobile
- **Paddings:** Se mantienen 20px laterales en mobile
- **Spacers:** Se reducen para evitar whitespace excesivo en mobile

---

## Outlook consideraciones

- **Botones:** VML `v:roundrect` con `arcsize="4%"` para bulletproof buttons rectangulares en Outlook
- **Fallback inline:** `<a>` con padding, bgcolor y border-radius=2px para clientes modernos
- **Tablas:** `border-collapse:collapse` en Outlook conditional comments
- **Fuente:** Outlook usa su propia pila — Arial es compatible nativamente
- **Anchura:** `width:600px` con max-width para Outlook — no hay degradación

### Limitaciones conocidas en Outlook

1. **Border-radius de 2px** ignorado en Outlook → se usa VML roundrect con arcsize pequeño como fallback
2. **Alt text truncado** en imágenes → mantener bajo 100 caracteres
3. **Responsive no funciona** → layout de 600px fijo es la experiencia Outlook
4. **Padding inconsistente** en celdas de tabla → validar visualmente
5. **Dark mode no** tiene soporte nativo en Outlook desktop

---

## Dark Mode

- `prefers-color-scheme: dark` soportado en Apple Mail y Outlook for iOS
- Clases `.bmw-dark-bg`, `.bmw-dark-text`, `.bmw-dark-link` preparadas para dark mode
- Colores de fondo explícitos en todas las tablas
- La sección electrificada (fondo oscuro #262626) ya tiene buen contraste en dark mode

---

## Brand tokens

Los tokens de diseño están en `brands/bmw/tokens/brand-tokens.json`:

| Token | Valor | Uso |
|-------|-------|-----|
| **Color primario** | `#000000` | Headlines, títulos principales |
| **Color texto cuerpo** | `#262626` | Texto de párrafo |
| **Color secundario** | `#6F6F6F` | Subtítulos, texto secundario |
| **CTA azul** | `#0066B1` | Fondo de botones CTA |
| **Fondo claro** | `#F4F4F4` | Sección tecnología, footer |
| **Fondo oscuro** | `#262626` | Sección electrificada |
| **Tipografía** | Arial, Helvetica, sans-serif | Pila tipográfica completa |
| **Radio botón** | 2px | Rectangular (no pill) |
| **Padding botón** | 14px 36px | Botones CTA |

---

## Principios de diseño BMW

Esta newsletter es una **excepción arquitectónica** en el sistema de producción, como la newsletter de Apple. Los componentes existentes del engine (diseñados para marcas de comparación/energía) tienen bordes de tarjeta, sombras y barras de acento incompatibles con el lenguaje visual premium de BMW.

- **Cero bordes** de tarjeta o sombras
- **Cero barras** de acento o reglas decorativas
- **Tipografía limpia** con Arial/Helvetica — sin fuentes personalizadas
- **Imágenes a sangre** dentro del contenedor de 600px
- **Espacio en blanco** como elemento de diseño
- **Una sola CTA** por sección — azul BMW (#0066B1) solo en botones
- **Paleta mínima** — solo #000000, #262626, #6F6F6F, #FFFFFF, #F4F4F4, #0066B1
- **Botones rectangulares** (2px radius) — no pill shape
- **Tono editorial** — copy aspiracional, emocional, automotriz

---

## Editor visual

Para previsualizar y editar, abre `bmw-newsletter.html` en:

- **VS Code** con Live Preview o HTML Preview extension
- **Navegador** directamente (arrastrar al navegador)

---

## Validación

Antes de enviar, asegúrate de:

1. ✅ Reemplazar todos los `[PLACEHOLDER]` con contenido real
2. ✅ Verificar que todas las imágenes tienen dimensiones explícitas
3. ✅ Probar en Outlook (web + desktop + mobile)
4. ✅ Probar en Gmail (web + mobile)
5. ✅ Probar en Apple Mail
6. ✅ Sustituir imágenes de placehold.co por imágenes reales de BMW
7. ✅ Revisar `visual-qa.md` para la checklist completa
