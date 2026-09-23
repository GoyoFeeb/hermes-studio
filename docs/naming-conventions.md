# Naming Conventions: Hermes Newsletter System

## Campañas

Cada campaña se organiza dentro de la estructura:

```
newsletters/{año}/{cliente}/{nombre-campana}/
```

### Formato de nombre de campaña

```
{año}-{mes}-{cliente}-{descriptivo}
```

Ejemplos:

- `2026-jul-moneyman`
- `2026-aug-back-to-school`
- `2026-sep-service-reminder`
- `2026-oct-halloween-promo`

### Carpeta de campaña completa

```
newsletters/2026/ocu/2026-jul-moneyman/
├── 00-brief/
├── 01-inputs/
├── 02-analysis/
├── 03-strategy/
├── 04-design/
├── 05-copy/
├── 06-data/
├── 07-code/
├── 08-qa/
└── 09-exports/
```

## Carpetas

| Carpeta | Convención | Formato |
|---|---|---|
| Fases | Prefijo numérico de 2 dígitos + guión | `00-brief/`, `01-inputs/`, `02-analysis/`, ... `09-exports/` |
| Clientes | Minúsculas, sin espacios, sin acentos | `ocu/`, `ucademy/`, `ford/`, `audika/` |
| Años | 4 dígitos | `2025/`, `2026/`, `2027/` |
| Workspace | Minúsculas, guiones | `react-email-template/`, `html-email-template/`, `design-system/` |

## Archivos de control

| Archivo | Convención | Ubicación |
|---|---|---|
| Estado de campaña | `campaign-status.md` | Raíz de la campaña |
| Registro de tareas | `task-log.md` | Raíz de la campaña |
| Handoff | `handoff.md` | Raíz de la campaña (sobrescrito en cada transición) |
| Bloqueo | `blocked-reason.md` | Raíz de la campaña (solo si aplica) |
| Aprobación pendiente | `approval-needed.md` | Raíz de la campaña (solo si aplica) |
| Notas de entrega | `delivery-notes.md` | `09-exports/` |
| Resumen de fase | `phase-summary.md` | Raíz de la campaña (opcional) |

## Archivos por fase

| Fase | Archivos | Formato |
|---|---|---|
| 00-brief | `brief.md`, `requirements.md`, `source-links.md`, `open-questions.md` | Markdown |
| 02-analysis | `brand-analysis.md`, `visual-identity-report.md`, `risks.md` | Markdown |
| 03-strategy | `campaign-angle.md`, `message-hierarchy.md`, `module-selection.md`, `structure.md` | Markdown |
| 04-design | `layout.md`, `desktop-spec.md`, `mobile-spec.md`, `assets-notes.md` | Markdown |
| 05-copy | `subject-lines.md`, `preheaders.md`, `body-copy.md`, `cta-options.md` | Markdown |
| 06-data | `newsletter-data.json`, `newsletter-data.ts` | JSON + TypeScript |
| 07-code | `newsletter.tsx`, `index.tsx`, `components/*.tsx`, `styles.ts`, `package.json`, `tsconfig.json` | TypeScript / React Email |
| 08-qa | `visual-qa.md`, `responsive-qa.md`, `outlook-qa.md`, `links-qa.md`, `final-checklist.md`, `return.md` (si aplica) | Markdown |
| 09-exports | `final.html`, `final-inline.html` (opcional), `final-preview.png`, `delivery-notes.md` | HTML + PNG + Markdown |

## Archivos de exportación

| Archivo | Descripción | Convención |
|---|---|---|
| `final.html` | HTML completo, listo para email marketing | Siempre se genera |
| `final-inline.html` | HTML con todos los estilos inline | Opcional, solo si la plataforma lo requiere |
| `final-preview.png` | Captura de preview a 600px de ancho | PNG, full-page |
| `delivery-notes.md` | Notas de entrega con instrucciones | Siempre se genera |

## Assets e imágenes

| Tipo | Convención | Ejemplo |
|---|---|---|
| Logo | `logo.png`, `logo-{variante}.png` | `logo.png`, `logo-white.png` |
| Hero | `hero.jpg`, `hero-{formato}.jpg` | `hero.jpg`, `hero-mobile.jpg` |
| Foto producto | `product-{nombre}.jpg` | `product-headphones.jpg` |
| Icono | `icon-{nombre}.png` | `icon-check.png`, `icon-gift.png` |
| Botón | `btn-{nombre}.png` | `btn-cta.png` (solo si es imagen) |
| Social | `social-{red}.png` | `social-facebook.png`, `social-x.png` |
| Fondo | `bg-{nombre}.jpg` | `bg-hero.jpg` |
| Banner | `banner-{nombre}.jpg` | `banner-promo.jpg` |
| Footer | `footer-logo.png` | `footer-logo.png` |

Los assets se almacenan en:

- **Originales**: `01-inputs/images/` dentro de la campaña
- **Exportados**: `09-exports/assets/` (solo si se empaquetan)
- **CDN**: URLs absolutas en newsletter-data.json

## Nombres de módulos (type en JSON)

Los tipos de módulo en newsletter-data.json siguen esta convención:

| type | Significado |
|---|---|
| `header` | Cabecera con logo |
| `hero` | Módulo principal con imagen + titular + CTA |
| `text-block` | Bloque de texto con titular y cuerpo |
| `cta-block` | Bloque centrado en un CTA o botón |
| `social-proof` | Testimonios, reseñas, pruebas sociales |
| `image-block` | Módulo que contiene solo una imagen |
| `two-columns` | Dos columnas de contenido |
| `products` | Grid o lista de productos |
| `divider` | Separador visual |
| `legal` | Módulo con texto legal (solo texto, footer legal) |
| `footer` | Pie de newsletter con legal + enlaces |
| `custom` | Módulo sin componente asignado (riesgo) |

## Versiones

| Elemento | Convención | Ejemplo |
|---|---|---|
| Sistema | Semver | `2.0.0` |
| Campaña | `{año}.{mes}.{intento}` | `2026.07.1` |
| JSON data | Semver en metadata | `"version": "1.0.0"` |
| Export HTML | Ninguna (el archivo es la versión) | `final.html` |

## IDs de módulo en newsletter-data.json

Formato: `module-{N}` para módulos secuenciales, `module-{nombre}` para módulos fijos.

| Módulo | ID |
|---|---|
| Header | `module-1` |
| Hero | `module-2` |
| Bloques de texto | `module-3`, `module-4`, ... |
| CTA principal | `module-{N}` (donde aparece) |
| Footer | `module-footer` |
| Legal | `module-legal` (si es separado del footer) |

## IDs de error en QA

Formato: `{prefijo}-{NNN}`

| Tipo QA | Prefijo |
|---|---|
| Visual QA | `VQ-001`, `VQ-002` |
| Responsive QA | `RQ-001`, `RQ-002` |
| Outlook QA | `OQ-001`, `OQ-002` |
| Links QA | `LQ-001`, `LQ-002` |
| Copy QA | `CQ-001`, `CQ-002` |

## Convenciones generales

- **Idioma**: español para documentación y comunicaciones internas; inglés para nombres de campos JSON, types, y props de componentes.
- **Case**: kebab-case para carpetas (`react-email-template/`); PascalCase para componentes React (`Hero.tsx`); camelCase para campos JSON (`subjectLine`, `containerWidth`).
- **Sin espacios**: ningún nombre de archivo o carpeta debe contener espacios. Usar guiones.
- **Sin acentos**: evitar acentos y caracteres especiales en nombres de archivo.
- **Sin mayúsculas en carpetas**: las carpetas usan minúsculas y guiones.

## Convención UTM (definida en ronda G8, 2026-07-16)

Todos los enlaces comerciales de una newsletter llevan parámetros UTM. Los placeholders
legales (`[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]`) quedan exentos — los resuelve el ESP.

Formato:

```
{url}?utm_source=newsletter&utm_medium=email&utm_campaign={nombre-campaña}&utm_content={modulo}
```

- `utm_campaign`: el nombre de carpeta de la campaña (ej. `2026-jul-ahorra-fibra-movil`).
- `utm_content`: identifica el módulo de origen del clic, en kebab-case. Valores estándar:

| Módulo | utm_content |
|---|---|
| CTA del hero | `hero-cta` |
| Tarjeta de producto/servicio | `card-{slug}` (ej. `card-movil`, `card-fibra`, `card-convergente`, `card-tv`) |
| CTA de banda de cierre | `closing-cta` |
| Enlace editorial secundario | `editorial-{slug}` |
| Footer (si hay enlaces comerciales) | `footer-{slug}` |

Los valores definitivos (dominio de tracking, utm_source por lista, etc.) pueden ajustarse
con el cliente, pero **ninguna pieza pasa el production gate con enlaces comerciales sin UTM**.
