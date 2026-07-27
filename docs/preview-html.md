# Preview HTML — Script de captura visual

## Objetivo

Generar una captura PNG de preview visual a partir del HTML exportado de una campaña, para inspección visual sin necesidad de abrir el archivo manualmente.

## Dependencias requeridas

El script necesita Playwright con el navegador Chromium instalado:

| Paquete | Propósito |
|---|---|
| `playwright` | Automatización de navegador para captura de pantalla |
| Chromium (via `playwright install chromium`) | Navegador headless |

### Instalación

```bash
npm install playwright
npx playwright install chromium
```

## Uso

### Comando básico

```bash
npm run preview-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman
```

### Ruta absoluta

```bash
npm run preview-html -- \
  --campaign /Users/javi/hermes-newsletter-system/newsletters/2026/ocu/2026-jul-moneyman
```

### Opciones

| Flag | Descripción |
|---|---|
| `--campaign` | (Obligatorio) Ruta a la carpeta de la campaña |
| `--force` | (Opcional) Sobrescribe `final-preview.png` si ya existe |
| `--width` | (Opcional) Ancho del viewport. Default: 600 |
| `--height` | (Opcional) Alto del viewport. Default: 2000 |

### Ejemplo completo

```bash
npm run preview-html -- \
  --campaign newsletters/2026/ocu/2026-jul-moneyman \
  --force \
  --width 600 \
  --height 2000
```

## Archivo generado

El script escribe en `{campaign}/09-exports/`:

| Archivo | Descripción |
|---|---|
| `final-preview.png` | Captura de pantalla del HTML renderizado (full-page) |

## Flujo de trabajo esperado

```
1. Exportar HTML:
   npm run export-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman

2. Generar preview visual:
   npm run preview-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman

3. Abrir final-preview.png para inspección visual rápida
```

## Limitaciones actuales

- No captura en clientes de email reales (Outlook, Gmail). Solo renderiza el HTML en Chromium.
- No mide compatibilidad con clientes de email (para eso está el QA manual).
- No valida enlaces dinámicamente.
- No genera comparación antes/después.

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| "Falta dependencia playwright" | Playwright no está instalado | `npm install playwright && npx playwright install chromium` |
| "No se encuentra 09-exports/final.html" | El HTML no se ha exportado aún | Ejecutar `export-html` primero |
| "Ya existe final-preview.png" | El archivo ya existe y no se usó `--force` | Añadir `--force` |
| Error al cargar file:// | Permisos del HTML o ruta incorrecta | Verificar que final.html existe y es legible |

## Advertencias

- **No envía emails.** Este script solo genera una captura PNG local.
- **No convierte una campaña de prueba en producción.** Solo genera una preview visual.
- **El preview es en Chromium headless.** No representa el aspecto real en Outlook, Gmail, Apple Mail, etc. Para compatibilidad real, usar el proceso de QA.
- **No sustituye la validación en clientes reales.** Usar el preview como herramienta rápida de inspección, no como certificación de compatibilidad.

## Scripts relacionados

| Script | Propósito |
|---|---|
| `export-html` | Generar final.html desde React Email |
| `validate-newsletter` | Validar estructura de campaña |
| `check-links` | Validar enlaces offline |
