# QA Report — Variante B: "Una tarifa que encaje contigo"

> Campaña: `2026-jul-tarifalo-compara-luz-variante-b`
> Fecha: 2026-07-23
> Autor: Hermes Agent

---

## 1. Resumen

| Estado | |
|---|---|
| **HTML principal** | ✅ OK |
| **HTML inline** | ✅ OK (juice-inlined) |
| **Copy** | ✅ OK |
| **Brief** | ✅ OK |
| **Bloques clickeables** | ✅ 12 bloques comerciales + 4 VML CTAs |
| **Enlaces legales separados** | ✅ 4 enlaces independientes |

---

## 2. Verificación de estructura HTML

### 2.1. Requisitos base

| # | Requisito | Estado | Notas |
|---|---|---|---|
| 1 | 600px max width | ✅ | `email-container` con `max-width:600px` |
| 2 | Tablas para layout | ✅ | Tablas anidadas, sin divs flojos |
| 3 | CSS inline | ✅ | Juice applied; @media queries preservadas en <style> |
| 4 | VML bulletproof CTA | ✅ | 4 CTAs con VML roundrect + !mso fallback |
| 5 | @media queries responsive | ✅ | Breakpoints a 600px y 480px |
| 6 | Imágenes con width/height/alt/display:block | ✅ | Logo e iconos |
| 7 | Sin JavaScript | ✅ | No se usa JS |
| 8 | color-scheme: light only | ✅ | Meta tag presente |
| 9 | outlook.com-friendly | ✅ | VML + inline styles + MSO conditional comments |

### 2.2. Bloques clickeables

| # | Bloque | Tipo de wrapper | Estado |
|---|---|---|---|
| 1 | Header (logo) | No clickable | ✅ Correcto (no es bloque comercial) |
| 2 | Hero | display:block <a> wrappeando tabla entera | ✅ OK |
| 3 | Hero CTA (Outlook) | VML roundrect href | ✅ OK |
| 4 | Intro CTA | display:block <a> wrappeando tabla entera | ✅ OK |
| 5 | Intro CTA (Outlook) | VML roundrect href | ✅ OK |
| 6 | Perfil 1 | display:block <a> sobre card con borde | ✅ OK |
| 7 | Perfil 2 | display:block <a> sobre card con borde | ✅ OK |
| 8 | Perfil 3 | display:block <a> sobre card con borde | ✅ OK |
| 9 | Beneficio 1 | display:block <a> sobre columna | ✅ OK |
| 10 | Beneficio 2 | display:block <a> sobre columna | ✅ OK |
| 11 | Beneficio 3 | display:block <a> sobre columna | ✅ OK |
| 12 | Paso 1 | display:block <a> sobre columna | ✅ OK |
| 13 | Paso 2 | display:block <a> sobre columna | ✅ OK |
| 14 | Paso 3 | display:block <a> sobre columna | ✅ OK |
| 15 | Steps CTA (Outlook) | VML roundrect href | ✅ OK |
| 16 | Banda cierre | display:block <a> wrappeando tabla entera | ✅ OK |
| 17 | Banda cierre CTA (Outlook) | VML roundrect href | ✅ OK |
| 18 | Footer (legal) | Enlaces separados <a> | ✅ NO clickable comercial |

**Total bloques comerciales clickeables:** 12 (display:block) + 4 (VML fallback)

**Nota:** No hay un único `<a>` wrappeando todo el documento — cada bloque tiene su propio enlace independiente.

### 2.3. Enlaces legales

| Enlace | URL | Estado |
|---|---|---|
| Política de privacidad | `{{LEGAL_PRIVACY_URL}}` | ✅ Separado, underline |
| Aviso legal | `{{LEGAL_NOTICE_URL}}` | ✅ Separado, underline |
| Preferencias de comunicación | `{{PREFERENCES_URL}}` | ✅ Separado, underline |
| Darse de baja | `{{UNSUBSCRIBE_URL}}` | ✅ Separado, underline |

---

## 3. Verificación de Copy

### 3.1. Subject Lines

10 subject lines creados, rango: personalización/consumo. ✅

### 3.2. Preheaders

10 preheaders creados, complementan subject lines. ✅

### 3.3. Body Copy

| Bloque | Título | CTA | Estado |
|---|---|---|---|
| Header | Tarífalo — comparador de tarifas de luz | — | ✅ |
| Hero | Encuentra una tarifa que encaje con tu consumo | Ver tarifas para mí | ✅ |
| Intro | ¿Cómo consumes energía en casa? | Encontrar mi tarifa | ✅ |
| Perfiles | Tres perfiles, una solución | — | ✅ |
| Beneficios | Comparar puede ser muy sencillo | — | ✅ |
| Pasos | Tres pasos para empezar a comparar | Empezar mi comparación | ✅ |
| Cierre | Descubre si existe una tarifa mejor para ti | Comparar ahora | ✅ |

---

## 4. Verificación de tokens de marca

| Token | Valor esperado | Uso en HTML | Estado |
|---|---|---|---|
| primary | `#003049` | Fondos hero, títulos, números paso | ✅ |
| deep | `#002035` | Fondo banda cierre, badge stat | ✅ |
| light | `#004B6B` | Eyebrow text | ✅ |
| ctaBackground | `#F77F00` | Botones CTA, VML | ✅ |
| ctaText | `#002035` | Texto botones CTA | ✅ |
| sectionLila/alt | `#FFF1E0` | Perfiles + Pasos backgrounds | ✅ |
| global | `#FFF6E7` | Fondo exterior + footer | ✅ |
| onBrandSecondary | `#FCE4C8` | Texto secundario sobre brand | ✅ |
| border | `#E0D5C5` | Bordes tarjetas | ✅ |
| accentHaloLight | `#FFE0B0` | Halo pasos + separador footer | ✅ |
| footerSeparator | `#D4C5B5` | Separador | links footer |
| text.secondary | `#666666` | Body text | ✅ |
| text.tertiary | `#999999` | — | — |

---

## 5. Verificación responsive

| Breakpoint | Comportamiento | Estado |
|---|---|---|
| >600px | 3 columnas en línea, padding normal | ✅ |
| ≤600px | Stack vertical (mobile-stack), padding reducido | ✅ |
| ≤480px | Títulos más pequeños, padding mínimo | ✅ |
| mobile-full | Tablas CTA a ancho completo | ✅ |
| mobile-hero-h1 | H1 se reduce a 26px→24px | ✅ |

---

## 6. Riesgos conocidos

| Riesgo | Estado | Acción |
|---|---|---|
| display:block en <a> no soportado en Outlook | ⚠️ Bajo | VML roundrect en CTAs como fallback; el resto de bloques pueden no ser clickeables en Outlook clásico |
| Imágenes placeholder no cargadas | ⚠️ Medio | {{LOGO_URL}}, {{ICON_*_URL}} son placeholders; sustituir antes de envío |
| Anidamiento de <a> dentro de VML | ⚠️ Bajo | VML roundrect dentro de display:block wrapper; Outlook ignora el wrapper externo y usa el VML |
| Sin preview visual real | ⚠️ Bajo | No se ha renderizado en Litmus/Email on Acid |

---

## 7. Recomendaciones pre-envío

- [ ] Sustituir `{{TRACKING_URL}}` por URL real de tracking
- [ ] Sustituir `{{LOGO_URL}}` por URL real del logo PNG de Tarífalo
- [ ] Sustituir `{{HERO_IMAGE_URL}}` por URL real de imagen de hero (si aplica)
- [ ] Sustituir `{{ICON_PERSONALIZED_URL}}`, `{{ICON_COMPANIES_URL}}`, `{{ICON_FREE_URL}}`
- [ ] Sustituir `{{LEGAL_PRIVACY_URL}}`, `{{LEGAL_NOTICE_URL}}`, `{{PREFERENCES_URL}}`, `{{UNSUBSCRIBE_URL}}`
- [ ] Rellenar `Razón Social: [POR DETERMINAR]` con datos reales
- [ ] Testear en Litmus o Email on Acid (Outlook, Gmail, Apple Mail)
- [ ] Verificar que Juice inlinó correctamente en `tarifalo-luz-variante-b-inline.html`
