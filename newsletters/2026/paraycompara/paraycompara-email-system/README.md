# Para y Compara — Email Design System

> Sistema visual reutilizable para newsletters de Para y Compara
> Versión 1.0 — Julio 2026

---

## Principios

1. **Identidad coherente** — Cada newsletter debe sentirse de Para y Compara, no de una plantilla
2. **Copiar y pegar** — Componentes listos para usar en cualquier campaña
3. **Email-first** — Tablas, inline styles, VML, responsive. No web adaptada
4. **Sin dependencias externas** — Sin Google Fonts, sin JavaScript, sin SVG inline
5. **Zero bloqueos** — Outlook, Gmail, Apple Mail: todos ven una versión funcional

---

## Estructura

```
paraycompara-email-system/
│
├── README.md                       ← Este archivo
│
├── tokens/                         ← Tokens de diseño
│   ├── color-system.md
│   ├── typography-system.md
│   ├── spacing-system.md
│   └── design-tokens.json
│
├── components/                     ← 20 componentes reutilizables
│   ├── component-system.html       ← Galería completa (todos los componentes)
│   ├── component-system-inline.html
│   ├── header/
│   ├── hero/
│   ├── cta/
│   ├── cards/
│   ├── trust-bar/
│   ├── steps/
│   ├── footer/
│   └── placeholders/
│
├── campaigns/                      ← 4 plantillas base
│   ├── saving/
│   │   ├── campaign-saving.html
│   │   └── campaign-saving-inline.html
│   ├── educational/
│   │   ├── campaign-educational.html
│   │   └── campaign-educational-inline.html
│   ├── comparison/
│   │   ├── campaign-comparison.html
│   │   └── campaign-comparison-inline.html
│   └── retargeting/
│       ├── campaign-retargeting.html
│       └── campaign-retargeting-inline.html
│
├── guidelines/                     ← Guías de uso
│   ├── voice-and-copy-guide.md
│   ├── asset-spec-system.md
│   ├── icon-spec.md
│   ├── animation-guidelines.md
│   ├── responsive-guidelines.md
│   ├── compatibility-guidelines.md
│   └── qa-checklist-template.md
│
└── previews/                       ← Previews de campañas
```

---

## Cómo usar

### Crear una nueva campaña

1. Elige la plantilla base que mejor se adapte:
   - **Saving**: Conversión directa, hero + trust bar + tarifas + CTA
   - **Educational**: Informativo, hero sin imagen + cards educativas + mini guía
   - **Comparison**: Ayudar a elegir, hero comparativo + criterios
   - **Retargeting**: Corta, recordatorio + beneficios + CTA

2. Copia el HTML editable de la campaña

3. Personaliza:
   - Copy (H1, texto, CTA, microcopy)
   - Imágenes (hero, iconos)
   - Enlaces (CTA, baja, preferencias)

4. Sustituye el placeholder del hero por la imagen definitiva

5. Genera inline con juice (`npm run juice`)

6. Prueba con la checklist de QA

### Sustituir un componente

Cada componente en `component-system.html` tiene su código documentado. Copia el bloque `<tr>` completo y pégalo en tu campaña.

---

## Tokens clave

| Token | Valor | Uso |
|---|---|---|
| Morado primario | `#5E2E91` | Marca |
| Coral CTA | `#FF5A3C` | Acción |
| Fondo lila | `#F8F5FC` | Secciones alternas |
| Texto principal | `#29262D` | Titulares |
| Texto secundario | `#66616A` | Cuerpo |
| Bordes | `#EDE7F3` | Cards |
| H1 desktop | 30px weight 800 | Solo uno por newsletter |
| Padding módulo | 40px 36px | Separación entre bloques |

---

## Compatibilidad

| Cliente | Estado |
|---|---|
| Apple Mail macOS | ✅ Completo |
| Apple Mail iOS | ✅ Completo |
| Yahoo Mail | ✅ Completo |
| Samsung Mail | ✅ Completo |
| Gmail web | ⚠️ Parcial (sin border-radius) |
| Gmail apps | ⚠️ Parcial |
| Outlook web | ⚠️ Parcial |
| Outlook Windows | ⚠️ Parcial (con VML) |
| Outlook móvil | ⚠️ Parcial |

---

## Changelog

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-07-13 | Sistema completo: tokens, 20 componentes, 4 campañas, guías, QA |