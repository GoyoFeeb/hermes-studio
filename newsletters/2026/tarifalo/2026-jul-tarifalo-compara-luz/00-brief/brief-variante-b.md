# Brief — Variante B: "Una tarifa que encaje contigo"

> Campaña: `2026-jul-tarifalo-compara-luz` · Variante: **B**  
> Fecha: 2026-07-23  
> Autor: Hermes Agent

---

## 1. A/B Test Hypothesis

| Campo | Valor |
|---|---|
| **Variante original (A)** | "¿Pagas demasiado?" — enfoque en problema/advertencia |
| **Variante B (esta)** | "Una tarifa que encaje contigo" — enfoque en personalización/consumo |
| **Hipótesis** | Una comunicación centrada en el consumo personal puede generar más clics que una basada en advertir que el usuario paga demasiado. |
| **Métrica primaria** | CTR único hacia el comparador |
| **Métrica secundaria** | Tasa de apertura, tasa de rebote |

---

## 2. Concepto creativo

**Concepto:** "Una tarifa que encaje contigo"  
**Tono:** Cercano, ágil, transparente, optimista, personalizado  
**H1:** "Encuentra una tarifa que encaje con tu consumo"  
**CTA principal:** "Ver tarifas para mí"

En lugar de alertar sobre un posible sobrecoste, esta variante invita al usuario a reflexionar sobre cómo consume energía y le ofrece una solución a medida.

---

## 3. Diferencias estructurales con Variante A

| Aspecto | Variante A | Variante B |
|---|---|---|
| **Concepto** | ¿Pagas demasiado? (problema) | Una tarifa que encaje contigo (personalización) |
| **Hero** | Problema/advertencia | Consumo personal |
| **Sección perfiles** | No existe | 3 perfiles de usuario (estoy en casa, consumo tarde, quiero pagar menos) |
| **Bloque clickeable** | CTA individual | TODOS los bloques comerciales (display:block <a>) |
| **Orden de bloques** | hero → beneficios → pasos → cierre → footer | hero → perfiles → beneficios → pasos → cierre → footer |
| **Implementación** | Motor engine con componentes | Standalone HTML (por necesidad de clickable blocks) |

---

## 4. Audiencia

Misma audiencia que la campaña original: suscriptores de Tarífalo que aún no han completado el comparador de tarifas de luz.

---

## 5. Datos del comparador

- URL de tracking: `{{TRACKING_URL}}`
- URL de logo: `{{LOGO_URL}}`
- URL hero image: `{{HERO_IMAGE_URL}}`
- URL iconos: `{{ICON_PERSONALIZED_URL}}`, `{{ICON_COMPANIES_URL}}`, `{{ICON_FREE_URL}}`
- URLs legales: `{{LEGAL_PRIVACY_URL}}`, `{{LEGAL_NOTICE_URL}}`, `{{PREFERENCES_URL}}`, `{{UNSUBSCRIBE_URL}}`

---

## 6. Nota técnica — Standalone HTML

La Variante B se entrega como **archivo HTML independiente** (no construido con el motor de componentes). Esto es necesario porque:

1. Los componentes existentes (`columns-3-beneficios`, `pasos`, etc.) no soportan `clickable: true` ni `href` por elemento individual dentro de las columnas.
2. El requisito de que **todos los bloques comerciales sean completamente cliqueables** requiere envolver cada celda en un `<a>` con `display:block`, un cambio estructural que no pueden acomodar los templates actuales del motor sin una refactorización mayor.

**Excepción documentada:** Esta es una variante A/B independiente cuyo HTML no pasa por `build-newsletter.js`. Se entrega con CSS inline y versión juice-inlineada.

---

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Desviación visual respecto a Variante A | Se mantienen colores, tipografías y espaciados del brand pack v2.2.3 |
| Múltiples enlaces en un mismo email pueden saturar | Solo afecta a los 6 bloques comerciales; los legales permanecen separados |
| Outlook puede ignorar display:block en <a> | Se usa `mso-hide:all` clean; VML solo para el CTA principal |
