# A/B Comparison — Variante A vs Variante B

> Campaña: `2026-jul-tarifalo-compara-luz`
> Fecha: 2026-07-23

---

## Summary

| | Variante A (Original) | Variante B (Test) |
|---|---|---|
| **Concepto** | "¿Pagas demasiado?" | "Una tarifa que encaje contigo" |
| **Enfoque** | Problema / Advertencia | Personalización / Consumo |
| **Tono** | Urgente, informativo | Cercano, optimista, personalizado |
| **H1** | "¿Pagas demasiado?" | "Encuentra una tarifa que encaje con tu consumo" |
| **CTA principal** | "Comparar tarifas" | "Ver tarifas para mí" |
| **Hipótesis** | — | Personalización → mayor CTR |

---

## Structural Differences

| Aspecto | Variante A | Variante B |
|---|---|---|
| **Hero** | Problema-focused, tono de alerta | Consumo personal, tono aspiracional |
| **Sección de perfiles** | ❌ No existe | ✅ 3 perfiles (estoy en casa, consumo tarde, quiero pagar menos) |
| **Orden de bloques** | hero → beneficios → pasos → cierre → footer | hero → intro → perfiles → beneficios → pasos → cierre → footer |
| **Nº de bloques comerciales** | 4 (hero, beneficios, pasos, cierre) | 6 (hero, intro, perfiles, beneficios, pasos, cierre) |
| **Bloques clickeables** | Solo CTAs individuales | ✅ TODOS los bloques (display:block <a>) |
| **Implementación** | Motor engine (componentes) | Standalone HTML (por clickable blocks) |

---

## Copy Differences

| | Variante A | Variante B |
|---|---|---|
| **Subject lines** | Enfoque en ahorro / alerta | Enfoque en consumo / personalización |
| **Preheaders** | "Ahorra en tu factura..." | "Compara opciones según cómo consumes..." |
| **Hero subtitle** | "Compara y ahorra..." | "Compara opciones disponibles según tus necesidades..." |
| **Microcopy** | "Sin compromiso" | "Proceso sencillo y personalizado." |
| **Perfiles** | No existen | 3 perfiles con tarjetas individuales |

---

## Technical Differences

| | Variante A | Variante B |
|---|---|---|
| **Build system** | `build-newsletter.js` + 6 componentes | Standalone HTML |
| **Clickable blocks** | ❌ Solo CTA buttons | ✅ display:block <a> en cada bloque |
| **VML CTAs** | 2 (hero + cierre) | 4 (hero, intro, pasos, cierre) |
| **Responsive** | @media queries | @media queries (600px + 480px) |
| **CSS inlining** | Juice (vía build) | Juice manual |

---

## Metrics to Compare

| Métrica | Variante A | Variante B | Ganador |
|---|---|---|---|
| **CTR único** | — | — | Pendiente |
| **Tasa de apertura** | — | — | Pendiente |
| **Tasa de rebote** | — | — | Pendiente |
| **CTR por bloque** | Solo CTA | Múltiples bloques | Pendiente |

---

## Hypothesis Validation

**Hipótesis:** "Una comunicación centrada en el consumo personal puede generar más clics que una basada en advertir que el usuario paga demasiado."

**Resultado:** ⏳ Pendiente de datos de campaña real.

**Nota:** Si la hipótesis se valida, considerar:
- Fusionar las mejores partes de ambas variantes en una versión C
- Incorporar el componente de perfiles de consumo como estándar
- Mantener clickable blocks como práctica recomendada
