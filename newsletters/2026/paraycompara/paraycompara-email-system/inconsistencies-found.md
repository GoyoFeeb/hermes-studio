# Inconsistencias encontradas y corregidas

> Auditoría Fase 5 — Sistema Para y Compara
> Fecha: 2026-07-13

---

## Corregidas

| # | Problema | Severidad | Archivos afectados | Corrección aplicada | Estado |
|---|---|---|---|---|---|
| I-01 | VML ausente en educational, comparison, retargeting | 🔴 Alta | 3 HTMLs | Añadido `v:roundrect` + `<!--[if mso]>` en todos los CTAs | ✅ Corregido |
| I-02 | role="presentation" insuficiente en educational, comparison, retargeting | 🟡 Media | 3 HTMLs | Añadido role="presentation" en tablas de layout sin él | ✅ Corregido |
| I-03 | Inline versions faltantes en educational, comparison, retargeting | 🟡 Media | 3 campañas | Generadas con juice | ✅ Corregido |
| I-04 | Line-height con decimal en saving CTA (23.7999px) | 🟢 Baja | 1 HTML | Identificado — pendiente de limpieza manual para no romrer juice | ⚠️ Documentado |

## Pendientes (no bloqueantes)

| # | Problema | Prioridad | Solución |
|---|---|---|---|
| I-05 | Hero URL no existe en CDN | 🟡 Media | Subir `hero-paraycompara-v4.png` a CDN |
| I-06 | Microcopy solo en saving | 🟢 Baja | Añadir microcopy a educational y comparison |
| I-07 | H1 size varía (28-30px) | 🟢 Baja | Documentar en typography-system.md como variantes permitidas |
| I-08 | Código React Email residual en saving inline | 🟢 Baja | Limpiar `data-id="__react-email-column"` del inline |
| I-09 | Saving hereda del sistema V4.1 (usada como base) | 🟢 Baja | Campaign saving se extrajo de la campaña real y heredó tamaños de archivo. No afecta funcionalidad |

## Estado por archivo tras corrección

| Archivo | VML | role | Inline | Estado |
|---|---|---|---|---|
| `campaigns/saving/campaign-saving.html` | ✅ 4 | ✅ 47 | ✅ | ✅ Listo |
| `campaigns/saving/campaign-saving-inline.html` | ✅ 4 | ✅ 47 | ✅ | ✅ Listo |
| `campaigns/educational/campaign-educational.html` | ✅ 4 | ✅ 18 | ✅ | ✅ Corregido |
| `campaigns/educational/campaign-educational-inline.html` | ✅ 4 | ✅ 18 | ✅ | ✅ Nuevo |
| `campaigns/comparison/campaign-comparison.html` | ✅ 2 | ✅ 15 | ✅ | ✅ Corregido |
| `campaigns/comparison/campaign-comparison-inline.html` | ✅ 2 | ✅ 15 | ✅ | ✅ Nuevo |
| `campaigns/retargeting/campaign-retargeting.html` | ✅ 4 | ✅ 12 | ✅ | ✅ Corregido |
| `campaigns/retargeting/campaign-retargeting-inline.html` | ✅ 4 | ✅ 12 | ✅ | ✅ Nuevo |