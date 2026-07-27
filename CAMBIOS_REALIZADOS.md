# CAMBIOS_REALIZADOS.md

> ⚠️ **OBSOLETO (2026-07-27)** — Registra los cambios del empaquetado original (2026-07-09,
> sistema React Email), no la transformación F0-F5 posterior que sustituyó ese pipeline por
> `engine/`. Para el historial de cambios vigente ver `docs/f1-motor-cerrado.md` a
> `docs/f5-prueba-real-cerrada.md` y `memory.md`.

## Modificaciones sobre los archivos originales

### 1. Scripts — `scripts/*.ts` y `scripts/*.tsx`

| Archivo | Cambio |
|---------|--------|
| `scripts/create-campaign.ts` | Eliminado el mapa `KNOWN_CLIENTS` (ocu, ucademy, ford, audika, verisure, testclient). Ahora deriva nombres automáticamente del slug. Comentarios de ejemplo cambiados a `mi-cliente` genérico. |
| `scripts/check-links.ts` | Ejemplo de uso cambiado de `newsletters/2026/ocu/2026-jul-moneyman` a `newsletters/{year}/{client}/{campaign}` |
| `scripts/preview-html.ts` | Ídem |
| `scripts/validate-newsletter.ts` | Ídem |
| `scripts/export-html.tsx` | Ídem |
| `scripts/production-gate.ts` | Ejemplo de uso cambiado de `newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta` a `newsletters/{year}/{client}/{campaign}` |
| `scripts/validate-claims.ts` | Ídem |
| `scripts/prepare-react-email.ts` | Ídem |

### 2. Configuración

| Archivo | Cambio |
|---------|--------|
| `tsconfig.json` | `include` corregido de `["templates/**/*", "shared/**/*"]` a `["scripts/**/*", "react-email-template/**/*", "newsletters/**/*"]` |
| `.gitignore` | Creado desde cero|
| `.env.example` | Creado desde cero con variables documentadas|

### 3. Nuevos archivos creados

| Archivo | Propósito |
|---------|-----------|
| `README.md` | Documentación completa del sistema|
| `AGENTS.md` | Reglas para Hermes Agent al trabajar en este sistema|
| `INVENTARIO_ORIGEN.md` | Qué contenía cada backup|
| `CAMBIOS_REALIZADOS.md` | Este archivo|
| `GUIA_NUEVO_PROYECTO.md` | Procedimiento paso a paso|
| `RIESGOS_Y_PENDIENTES.md` | Problemas no resueltos y riesgos conocidos|
| `ejemplo-proyecto/` | Proyecto de demostración con marca ficticia|
| `react-email-template/components/types.ts` | Tipos compartidos (faltaban del sistema original)|
| `react-email-template/components/styles.ts` | Estilos compartidos (faltaban del sistema original)|

### 4. Bugs encontrados y corregidos durante validación

| Bug | Archivo | Solución |
|-----|---------|----------|
| Ruta incorrecta `workspace/react-email-template` | `scripts/prepare-react-email.ts` | Cambiado a `react-email-template`|
| `types.ts` no existía | `react-email-template/components/` | Creado con tipos ModuleData, ContentData, CTAData, etc.|
| `styles.ts` no existía | `react-email-template/components/` | Creado con 12 funciones de estilo|
| Faltaban `getBodyStyles` y `getContainerStyles` | styles.ts | Añadidas para template-hermes.tsx|

### 5. Resultados de validación real

- npm install: ✅ 86 paquetes, 0 vulnerabilidades
- create-campaign: ✅ 33 archivos creados
- validate-newsletter: ✅ 10/10 carpetas, 10/10 archivos
- check-links: ✅ sin errores
- validate-claims: ✅ 29 reglas, sin problemas
- prepare-react-email: ✅ 16 archivos, 13 componentes
- export-html: ✅ final.html (3.9KB) + final-inline.html (3.7KB)
- preview-html: ❌ requiere `npx playwright install chromium` (opcional)
- production-gate: ❌ bloquea campaña demo con placeholders (comportamiento esperado)