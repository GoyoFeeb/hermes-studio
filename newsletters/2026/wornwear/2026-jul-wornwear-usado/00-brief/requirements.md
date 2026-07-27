# Requirements: Patagonia Worn Wear — 2026-jul-wornwear-usado

## Requisitos funcionales

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| R-001 | La newsletter debe cargarse en Outlook desktop, Gmail web, Apple Mail, Yahoo Mail | Alta | Pendiente |
| R-002 | Sin JavaScript | Alta | Pendiente |
| R-003 | CSS inline en la versión final | Alta | Pendiente |
| R-004 | VML bulletproof buttons para Outlook (border-radius) | Alta | Pendiente |
| R-005 | Alt text descriptivo en todas las imágenes | Media | Pendiente |
| R-006 | Dimensiones explícitas (width/height) en todas las imágenes | Media | Pendiente |
| R-007 | Versión responsive (mobile ≤ 599px) | Alta | Pendiente |
| R-008 | Sin file:// ni rutas absolutas locales en producción | Alta | Pendiente |
| R-009 | URLs CDN con HTTPS verificable (HTTP 200) | Alta | Pendiente |
| R-010 | Dark mode handling básico (color-scheme, meta) | Media | Pendiente |
| R-011 | Enlace de baja y preferencias funcionales (tokenizados) | Alta | Pendiente |

## Requisitos de contenido

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| C-001 | Idioma: español | Alta | Pendiente |
| C-002 | Cifras ambientales: ninguna sin fuente verificada | 🔴 Bloqueante | Pendiente |
| C-003 | Precios: ninguno sin fuente verificada | 🔴 Bloqueante | Pendiente |
| C-004 | CTA label coherente con voz real de la marca | Alta | Pendiente |
| C-005 | utm_content por módulo en cada CTA | Alta | Pendiente |
| C-006 | Footer legal en español con placeholders declarados | Media | Pendiente |
| C-007 | Logo: PNG o texto (no SVG solo) | Media | Pendiente |

## Requisitos técnicos

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| T-001 | campaign-data.json debe validar contra engine/schema/campaign-data.schema.json | Alta | Pendiente |
| T-002 | build-newsletter.js debe producir BUILD OK sin placeholders {{ sin resolver | Alta | Pendiente |
| T-003 | production-gate-motor: 11 gates en verde o bloqueos documentados | Alta | Pendiente |
| T-004 | brand-tokens.json en brands/wornwear/tokens/ versión ≥ 2.2.0 | Alta | Pendiente |
