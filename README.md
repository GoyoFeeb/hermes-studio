# Sistema de Producción Multi-Agente de Newsletters

> ⚠️ **OBSOLETO (2026-07-27)** — Este documento describe el empaquetado original del sistema
> (2026-07-09) sobre el pipeline **React Email**, que fue **archivado** en la transformación
> F1-F5 (jul 2026) y sustituido por un motor propio (`engine/`). Componentes, scripts
> (`prepare-react-email`, `export-html.tsx`) y la lista de comandos aquí descrita ya no
> reflejan el sistema actual. Fuente de verdad actual: `context.md`, `AGENTS.md`, `memory.md`
> y `engine/README.md`.

**Hermes Newsletter System** — Un pipeline automatizado de 10 agentes para producir newsletters HTML profesionales con React Email, control de calidad multi-fase y exportación lista para producción.

---

## Tabla de Contenidos

1. [¿Qué hace el sistema?](#1-qué-hace-el-sistema)
2. [Arquitectura](#2-arquitectura)
3. [Requisitos](#3-requisitos)
4. [Instalación](#4-instalación)
5. [Configuración](#5-configuración)
6. [Comandos disponibles](#6-comandos-disponibles)
7. [Cómo crear un nuevo proyecto](#7-cómo-crear-un-nuevo-proyecto)
8. [Cómo añadir una nueva newsletter](#8-cómo-añadir-una-nueva-newsletter)
9. [Cómo previsualizar](#9-cómo-previsualizar)
10. [Cómo compilar y exportar](#10-cómo-compilar-y-exportar)
11. [Cómo añadir imágenes, enlaces y variables](#11-cómo-añadir-imágenes-enlaces-y-variables)
12. [Solución de problemas comunes](#12-solución-de-problemas-comunes)

---

## 1. ¿Qué hace el sistema?

Hermes Newsletter System es un **pipeline multi-agente** que automatiza la creación de newsletters HTML desde un brief inicial hasta el HTML final listo para enviar. Combina:

- Un **orquestador inteligente** (IA) que coordina 10 agentes especializados, cada uno con una responsabilidad única.
- **React Email** como motor de renderizado, con 12 componentes reutilizables (Hero, Header, Text, CTA, Cards, Benefits, TwoColumns, ImageText, Footer, Legal, etc.).
- **Validación automatizada** mediante 5 scripts de control: validación de estructura, enlaces, claims, exportación y previsualización.
- **Plantillas de campaña** predefinidas con estructura de carpetas estándar (fases 00–09).
- **Production Gate** que ejecuta todas las validaciones en un solo comando antes de liberar.

### Flujo de trabajo resumido

1. El usuario define un **brief** con objetivos, CTA, enlaces y contenido.
2. El pipeline ejecuta 9 fases secuenciales (agentes 01–09).
3. Cada fase produce artefactos concretos en su carpeta asignada.
4. Un **QA especializado** revisa visual, responsive, enlaces, Outlook y accesibilidad.
5. El **Export Manager** genera el HTML final inlneado, previsualización y notas de entrega.
6. El **Production Gate** valida todo antes de aprobar el envío.

---

## 2. Arquitectura

### Pipeline de 10 agentes

| ID | Agente | Responsabilidad | Escribe en |
|:---|:-------|:----------------|:-----------|
| 00 | **Orchestrator** | Dirigir el pipeline, mantener archivos de control | `campaign-status.md`, `handoff.md`, `task-log.md` |
| 01 | **Briefing Strategist** | Estructurar inputs en un brief claro | `00-brief/` |
| 02 | **Brand Visual Analyst** | Analizar identidad visual, colores, tipografía | `02-analysis/` |
| 03 | **Newsletter Architect** | Definir estructura modular, jerarquía, CTAs | `03-strategy/` |
| 04 | **Email Designer** | Convertir arquitectura en specs visuales/técnicos | `04-design/` |
| 05 | **Copywriter** | Redactar asuntos, preheaders, cuerpo, CTAs | `05-copy/` |
| 06 | **Newsletter Data Specialist** | Producir JSON/TS estructurado para la plantilla | `06-data/` |
| 07 | **React Email Developer** | Implementar en React Email | `07-code/` |
| 08 | **Email QA Specialist** | Revisar calidad visual, responsive, enlaces, Outlook | `08-qa/` |
| 09 | **Export Manager** | Preparar HTML final, inline, assets, previsualización | `09-exports/` |

### Orden de fases (estricto, nunca se salta)

```
Briefing (01) → Análisis (02) → Arquitectura (03) → Diseño (04)
  → Copy (05) → Datos (06) → Desarrollo React Email (07)
  → QA (08) → Exportación (09)
```

Cada fase tiene **criterios de salida estrictos**. El Orchestrator verifica que los entregables existan antes de avanzar.

### Estados de campaña

```
created → briefing → analysis → strategy → design → copy
  → data → development → qa → export → completed
                      ↓
                 corrections (si QA detecta errores)

En cualquier punto → blocked (si falta información crítica)
```

### Estructura de directorios de una campaña

```
newsletters/{año}/{cliente}/{campaña}/
├── 00-brief/            — brief.md, requirements.md, source-links.md
├── 01-inputs/           — materiales brutos, assets, screenshots
├── 02-analysis/         — brand-analysis.md, visual-analysis.md, risks.md
├── 03-strategy/         — campaign-angle.md, message-hierarchy.md, module-selection.md
├── 04-design/           — layout.md, desktop-spec.md, mobile-spec.md, assets-notes.md
├── 05-copy/             — subject-lines.md, preheaders.md, body-copy.md, cta-options.md
├── 06-data/             — newsletter-data.json, newsletter-data.ts
├── 07-code/             — react-email/ (componentes + newsletter.tsx)
├── 08-qa/               — visual-qa.md, responsive-qa.md, outlook-qa.md, links-qa.md, final-checklist.md
├── 09-exports/          — final.html, final-inline.html, preview.png, delivery-notes.md
├── README.md
├── campaign-status.md
├── handoff.md
├── task-log.md
└── next-steps.md
```

### Componentes React Email

El sistema incluye 12 componentes reutilizables en `react-email-template/components/`:

| Componente | Función |
|:-----------|:--------|
| `HeroBlock` | Imagen principal de cabecera |
| `HeaderBlock` | Logo + encabezado |
| `TextBlock` | Bloques de texto con formato |
| `ImageTextBlock` | Imagen + texto lado a lado |
| `CTA` | Botón de llamada a la acción |
| `CardsGridBlock` | Grid de tarjetas |
| `BenefitsGridBlock` | Grid de beneficios/features |
| `TwoColumnsBlock` | Diseño de dos columnas |
| `FooterBlock` | Pie con enlaces sociales |
| `LegalBlock` | Texto legal, unsubscribe, preferencias |
| `ModuleRenderer` | Renderizador dinámico de módulos |
| `types.ts` / `styles.ts` | Tipos y estilos compartidos |

---

## 3. Requisitos

### Software necesario

| Herramienta | Versión mínima | Opcional |
|:------------|:---------------|:---------|
| **Node.js** | 18+ | — |
| **npm** | 9+ | — |
| **Playwright** | — | Sí (para previsualizaciones en PNG) |

### Verificar versiones

```bash
node --version   # debe ser ≥ 18
npm --version    # debe ser ≥ 9
```

### Nota sobre Playwright

Playwright se instala como dependencia npm. Para generar capturas de pantalla (PNG) de las newsletters, ejecuta:

```bash
npx playwright install chromium
```

Si no necesitas previsualizaciones en imagen, el resto del sistema funciona sin Playwright.

---

## 4. Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio> mi-proyecto-newsletter
cd mi-proyecto-newsletter

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Verificar instalación
npm run create-campaign -- --help
```

---

## 5. Configuración

Copia `.env.example` a `.env` y completa las variables:

```env
# === HERMES NEWSLETTER SYSTEM ===

# --- Configuración de la campaña por defecto ---
DEFAULT_FROM_NAME=        # Remitente por defecto (ej: "Mi Empresa")
DEFAULT_FROM_EMAIL=       # Email remitente (ej: "newsletter@miempresa.com")
DEFAULT_UNSUBSCRIBE_LINK= # URL de baja (ej: "https://miempresa.com/unsub")
DEFAULT_PREFERENCES_LINK= # URL de preferencias (ej: "https://miempresa.com/prefs")

# --- CRM / Plataforma de envío (opcional) ---
# MAILCHIMP_API_KEY=
# SENDGRID_API_KEY=
# CRM_BASE_URL=
# CRM_LIST_ID=

# --- Imágenes y assets (CDN o ruta base) ---
# ASSETS_BASE_URL=https://cdn.ejemplo.com/newsletters/

# --- Playwright (para preview-html) ---
# PLAYWRIGHT_BROWSERS_PATH=

# --- Outlook QA (ruta a archivos para pruebas de compatibilidad) ---
# OUTLOOK_TEST_FILE=
```

Todas las variables son opcionales pero **recomendadas**. Sin `DEFAULT_UNSUBSCRIBE_LINK` y `DEFAULT_FROM_EMAIL`, el sistema usará placeholders que deberás reemplazar manualmente.

---

## 6. Comandos disponibles

### 6.1 `npm run create-campaign`

Crea la estructura de carpetas para una nueva campaña.

```bash
npm run create-campaign -- --year 2026 --client mi-cliente --campaign 2026-jul-campana
```

Parámetros:
- `--year` — Año (ej: 2026)
- `--client` — Nombre del cliente (ej: mi-cliente)
- `--campaign` — Nombre de la campaña (ej: 2026-jul-campana)

Resultado: Crea `newsletters/2026/mi-cliente/2026-jul-campana/` con toda la estructura de carpetas y archivos de control.

---

### 6.2 `npm run validate-newsletter`

Valida que la estructura de la campaña sea correcta.

```bash
npm run validate-newsletter -- --campaign newsletters/2026/mi-cliente/2026-jul-campana
```

Parámetros:
- `--campaign` — Ruta a la carpeta de la campaña

Validaciones que realiza:
- Estructura de carpetas (00-brief, 02-analysis, …, 09-exports)
- Archivos de control (campaign-status.md, handoff.md, task-log.md)
- newsletter-data.json (si existe)
- Enlace de baja y preferencias

---

### 6.3 `npm run check-links`

Verifica que los enlaces en el newsletter-data.json sean válidos.

```bash
# Verificación offline (sintaxis)
npm run check-links -- --campaign newsletters/2026/mi-cliente/2026-jul-campana

# Verificación online (HTTP HEAD real)
npm run check-links -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --online

# Modo estricto (sin advertencias permitidas)
npm run check-links -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --strict
```

Parámetros:
- `--campaign` — Ruta a la campaña
- `--online` — (opcional) Verifica que las URLs respondan HTTP 200
- `--strict` — (opcional) Errores fatales en lugar de advertencias

---

### 6.4 `npm run prepare-react-email`

Prepara los archivos de la campaña para renderizar con React Email.

```bash
npm run prepare-react-email -- --campaign newsletters/2026/mi-cliente/2026-jul-campana
```

Parámetros:
- `--campaign` — Ruta a la campaña
- `--force` — (opcional) Sobrescribe archivos existentes

---

### 6.5 `npm run export-html`

Genera el HTML final a partir de los datos de la campaña.

```bash
# Exportación estándar (HTML con referencias externas)
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana

# Exportación con CSS inline (recomendado para email)
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --inline

# Forzar sobrescritura
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --force
```

Parámetros:
- `--campaign` — Ruta a la campaña
- `--inline` — (opcional) Incluye CSS inline para compatibilidad con clientes de email
- `--force` — (opcional) Sobrescribe archivos existentes

Resultado: Genera `09-exports/final.html` y opcionalmente `09-exports/final-inline.html`.

---

### 6.6 `npm run preview-html`

Abre una previsualización visual de la newsletter en el navegador o genera una captura PNG.

```bash
# Vista previa en navegador
npm run preview-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana

# Vista previa con ancho personalizado
npm run preview-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --width 600

# Forzar regeneración de captura
npm run preview-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --force
```

Parámetros:
- `--campaign` — Ruta a la campaña
- `--force` — (opcional) Regenera la captura si ya existe
- `--width` — (opcional) Ancho en px (default: 600)
- `--height` — (opcional) Alto en px (default: 2000)

---

### 6.7 `npm run validate-claims`

Valida que los claims promocionales y legales sean correctos.

```bash
# Validación estándar
npm run validate-claims -- --campaign newsletters/2026/mi-cliente/2026-jul-campana

# Validación en modo producción (más estricta)
npm run validate-claims -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --production
```

Parámetros:
- `--campaign` — Ruta a la campaña
- `--production` — (opcional) Aplica reglas más estrictas

---

### 6.8 `npm run production-gate`

Ejecuta todas las validaciones de producción en un solo comando.

```bash
npm run production-gate -- --campaign newsletters/2026/mi-cliente/2026-jul-campana
```

Este comando ejecuta **secuencialmente**:
1. `validate-newsletter` — Validación estructural
2. `check-links` — Verificación de enlaces
3. `validate-claims` — Validación de claims
4. `export-html --inline` — Exportación con CSS inline

Si cualquiera de las validaciones falla, el proceso se detiene y reporta el error.

---

## 7. Cómo crear un nuevo proyecto

Sigue estos pasos para arrancar un proyecto desde cero:

### Paso 1: Clonar

```bash
git clone <url-del-repositorio> nombre-del-proyecto
cd nombre-del-proyecto
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar entorno

```bash
cp .env.example .env
nano .env   # o cualquier editor
```

Completa al menos:
- `DEFAULT_FROM_NAME`
- `DEFAULT_FROM_EMAIL`
- `DEFAULT_UNSUBSCRIBE_LINK`

### Paso 4: Crear brand library (opcional pero recomendado)

Crea una carpeta en `brand-library/` para tu cliente con:

```
brand-library/mi-cliente/
├── brand-profile.md     — Perfil de marca, tono, voz
├── colors.json          — Paleta de colores
├── typography.json      — Tipografía
├── components.json      — Configuración de componentes
└── legal-notes.md       — Notas legales estándar
```

Puedes usar `brand-library/_template/` como referencia.

### Paso 5: Verificar que todo funciona

```bash
node --version
npm --version
npm run production-gate -- --help
```

---

## 8. Cómo añadir una nueva newsletter

### Paso 1: Crear la campaña

```bash
npm run create-campaign -- --year 2026 --client mi-cliente --campaign 2026-jul-campana
```

Esto crea `newsletters/2026/mi-cliente/2026-jul-campana/` con toda la estructura.

### Paso 2: Ejecutar el pipeline (agentes 00→09)

Ejecuta los agentes en orden estricto. Cada agente produce artefactos en su carpeta correspondiente:

| Paso | Agente | Acción | Artefacto principal |
|:-----|:-------|:-------|:--------------------|
| 1 | **01-Briefing Strategist** | Analizar inputs y crear brief | `00-brief/brief.md` |
| 2 | **02-Brand Visual Analyst** | Analizar identidad visual | `02-analysis/brand-analysis.md` |
| 3 | **03-Newsletter Architect** | Definir estructura modular | `03-strategy/structure.md` |
| 4 | **04-Email Designer** | Especificaciones visuales | `04-design/layout.md` |
| 5 | **05-Copywriter** | Redactar contenido | `05-copy/body-copy.md` |
| 6 | **06-Newsletter Data Specialist** | Crear JSON de datos | `06-data/newsletter-data.json` |
| 7 | **07-React Email Developer** | Implementar en React Email | `07-code/` |
| 8 | **08-Email QA Specialist** | Revisar calidad | `08-qa/final-checklist.md` |
| 9 | **09-Export Manager** | Exportar HTML final | `09-exports/final.html` |

**Importante**: No saltar fases. El Orchestrator (agente 00) verifica los entregables de cada fase antes de avanzar.

### Paso 3: Validar en cada fase

Después de que el agente 06 (Newsletter Data Specialist) completa su trabajo, puedes ejecutar validaciones automatizadas:

```bash
# Validar estructura
npm run validate-newsletter -- --campaign newsletters/2026/mi-cliente/2026-jul-campana

# Validar enlaces (offline)
npm run check-links -- --campaign newsletters/2026/mi-cliente/2026-jul-campana
```

### Paso 4: Previsualizar

Después del agente 07 (React Email Developer):

```bash
# Preparar para React Email
npm run prepare-react-email -- --campaign newsletters/2026/mi-cliente/2026-jul-campana

# Exportar HTML
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --inline

# Previsualizar en navegador
npm run preview-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana
```

### Paso 5: QA y producción

```bash
# Validar claims
npm run validate-claims -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --production

# Ejecutar production gate (todo en uno)
npm run production-gate -- --campaign newsletters/2026/mi-cliente/2026-jul-campana
```

---

## 9. Cómo previsualizar

### Vista previa en navegador

```bash
npm run preview-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana
```

Esto genera un archivo HTML en `09-exports/` y lo abre en tu navegador predeterminado (si es compatible).

### Vista previa con ancho personalizado

```bash
npm run preview-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --width 480
```

Útil para simular móvil (320–480 px) o escritorio (600 px).

### Captura PNG

Si tienes Playwright instalado, el comando `preview-html` también genera `09-exports/final-preview.png`.

Para instalar Playwright:

```bash
npx playwright install chromium
```

### Vista previa desde el archivo HTML exportado

```bash
open newsletters/2026/mi-cliente/2026-jul-campana/09-exports/final.html
```

O simplemente arrastra el archivo a tu navegador.

---

## 10. Cómo compilar y exportar

### Exportación estándar

```bash
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana
```

Genera `09-exports/final.html` con estilos CSS externos.

### Exportación con CSS inline (recomendado para email)

```bash
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --inline
```

Genera `09-exports/final-inline.html` con todos los estilos inlineados. Este archivo es el que debes subir a tu plataforma de envío (Mailchimp, SendGrid, etc.).

### Exportación forzada

Si ya existe un archivo de exportación y quieres sobrescribirlo:

```bash
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-campana --force
```

### ¿Qué archivo usar?

| Archivo | Cuándo usarlo |
|:--------|:--------------|
| `final.html` | Desarrollo, debugging, revisión |
| `final-inline.html` | **Producción** — subir a Mailchimp/SendGrid/etc. |

---

## 11. Cómo añadir imágenes, enlaces y variables

### Estructura del `newsletter-data.json`

El archivo `06-data/newsletter-data.json` es la **única fuente de verdad** para el contenido de la newsletter. Sigue este esquema:

```json
{
  "metadata": {
    "campaignName": "2026-jul-campana",
    "clientName": "Mi Cliente",
    "subjectLine": "Asunto del email",
    "preheader": "Preheader del email",
    "fromName": "Mi Empresa",
    "fromEmail": "newsletter@miempresa.com",
    "version": "1.0.0",
    "createdAt": "2026-07-09"
  },
  "settings": {
    "containerWidth": 600,
    "backgroundColor": "#F4F4F4",
    "containerBackgroundColor": "#FFFFFF",
    "fontFamily": "Arial, sans-serif"
  },
  "modules": [
    {
      "type": "hero",
      "image": {
        "src": "https://cdn.ejemplo.com/newsletters/hero.jpg",
        "alt": "Descripción de la imagen",
        "width": 600,
        "height": 300
      }
    },
    {
      "type": "text",
      "content": "<h1>Título principal</h1><p>Texto del párrafo</p>"
    },
    {
      "type": "cta",
      "button": {
        "text": "Descubre más",
        "href": "https://ejemplo.com/oferta",
        "backgroundColor": "#FF6600",
        "textColor": "#FFFFFF"
      }
    }
  ]
}
```

### Añadir imágenes

Edita el array `modules[]` en `newsletter-data.json`:

1. **Hero**: Añade un módulo con `"type": "hero"` e `"image"`.
2. **Imagen + texto**: Usa `"type": "image-text"` con `"image"` y `"text"`.
3. **Cards**: Usa `"type": "cards-grid"` con un array `"cards"`, cada una con su propia `"image"`.

**Importante**: Todas las imágenes deben tener `src` (URL absoluta o relativa a `ASSETS_BASE_URL`), `alt` (texto alternativo) y dimensiones (`width`/`height`).

### Añadir enlaces

Los enlaces pueden aparecer en varios módulos:

- **CTA**: `button.href` — enlace principal del botón.
- **Cards**: `cards[].button.href` — enlace por tarjeta.
- **Texto**: HTML inline dentro de `content`.
- **Footer**: `socialLinks[].href` — enlaces a redes sociales.
- **Legal**: `unsubscribeLink`, `preferencesLink` en el módulo legal.

**Verificación**: Siempre ejecuta `npm run check-links -- --campaign ...` después de añadir o modificar enlaces.

### Añadir variables

El sistema soporta **variables de entorno** a través del archivo `.env`:

| Variable | Dónde se usa |
|:---------|:-------------|
| `DEFAULT_FROM_NAME` | `metadata.fromName` |
| `DEFAULT_FROM_EMAIL` | `metadata.fromEmail` |
| `DEFAULT_UNSUBSCRIBE_LINK` | Módulo legal → `unsubscribeLink` |
| `DEFAULT_PREFERENCES_LINK` | Módulo legal → `preferencesLink` |
| `ASSETS_BASE_URL` | Prefijo para rutas relativas de imágenes |

También puedes usar **variables en el JSON** referenciando valores del archivo `.env` mediante placeholders que se resuelven en tiempo de exportación.

### Tipos de módulos disponibles

| `type` | Componente | Para qué sirve |
|:-------|:-----------|:---------------|
| `hero` | HeroBlock | Imagen principal de cabecera |
| `header` | HeaderBlock | Logo + nombre |
| `text` | TextBlock | Bloques de texto con HTML |
| `image-text` | ImageTextBlock | Imagen + texto lado a lado |
| `cta` | CTA | Botón de llamada a la acción |
| `cards-grid` | CardsGridBlock | Grid de 2–4 tarjetas |
| `benefits-grid` | BenefitsGridBlock | Grid de beneficios/features |
| `two-columns` | TwoColumnsBlock | Dos columnas de contenido |
| `footer` | FooterBlock | Pie con enlaces sociales |
| `legal` | LegalBlock | Texto legal, unsubscribe, preferencias |

---

## 12. Solución de problemas comunes

### Error: `command not found: tsx`

```bash
npm install
```

O, si el problema persiste:

```bash
npx tsx --version
```

### Error: `Cannot find module 'juice'`

```bash
npm install juice
```

El módulo `juice` se usa para inlinear CSS en la exportación con `--inline`.

### Error: `Campaign directory not found`

Verifica la ruta:

```bash
ls newsletters/2026/mi-cliente/2026-jul-campana/
```

La ruta debe ser **relativa a la raíz del proyecto**, empezando por `newsletters/...`.

### Error: `newsletter-data.json not found`

El agente 06 (Newsletter Data Specialist) debe crear este archivo. Si no existe:

1. Verifica que la fase 06 se ejecutó correctamente.
2. Comprueba `06-data/newsletter-data.json`.
3. Ejecuta `npm run validate-newsletter` para diagnóstico.

### Error: `Invalid JSON in newsletter-data.json`

Valida el JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('newsletters/2026/mi-cliente/2026-jul-campana/06-data/newsletter-data.json','utf8'))"
```

### Error: Playwright: `chromium not found`

```bash
npx playwright install chromium
```

O, si no necesitas capturas PNG, simplemente ignora este error — el resto del sistema funciona sin Playwright.

### Error: `--inline option requires juice`

El flag `--inline` necesita el paquete `juice` para inlinear CSS. Instálalo:

```bash
npm install juice
```

### El HTML exportado no se ve bien en Outlook

1. Asegúrate de usar `--inline` para exportar (Outlook ignora CSS externo).
2. Usa tablas en lugar de divs (React Email lo maneja automáticamente).
3. Verifica las reglas de Outlook en `08-qa/outlook-qa.md` después del QA.
4. Anchura máxima recomendada: 600 px.

### La previsualización no abre el navegador

El comando `preview-html` genera el archivo HTML pero puede no abrir el navegador automáticamente en todos los sistemas. Abre manualmente:

```bash
open newsletters/2026/mi-cliente/2026-jul-campana/09-exports/final.html
```

### Error en production-gate: una validación falló

Revisa el log del comando. Cada validación reporta qué falló exactamente. Corre las validaciones individualmente para aislar el problema:

```bash
npm run validate-newsletter -- --campaign ...
npm run check-links -- --campaign ... --online --strict
npm run validate-claims -- --campaign ... --production
```

### Quiero reutilizar una campaña como plantilla

Copia la carpeta de la campaña completa y renómbrala:

```bash
cp -r newsletters/2026/cliente-a/campana-anterior newsletters/2026/cliente-b/nueva-campana
```

Luego edita `campaign-status.md` para resetear el estado a `created` y vacía los archivos de contenido.

---

## Licencia

Propietario. Uso interno. Consulta con el equipo antes de distribuir.

## Documentación adicional

La documentación completa está en `docs/`:

| Documento | Contenido |
|:----------|:----------|
| `docs/campaign-lifecycle.md` | Ciclo de vida completo de campañas |
| `docs/workflow.md` | Flujo de trabajo detallado |
| `docs/production-gate.md` | Guía del Production Gate |
| `docs/preview-html.md` | Uso detallado de preview |
| `docs/export-html.md` | Uso detallado de export |
| `docs/qa-process.md` | Proceso de QA |
| `docs/check-links-strict.md` | Validación estricta de enlaces |
| `docs/validate-claims.md` | Validación de claims |
| `docs/email-compatibility-rules.md` | Reglas de compatibilidad email |
| `docs/troubleshooting.md` | Troubleshooting avanzado |
| `docs/naming-conventions.md` | Convenciones de nombres |
| `docs/system-validation.md` | Validación del sistema |
| `docs/pipeline-audit-*.md` | Auditorías de pipeline |
| `docs/first-real-campaign-*.md` | Guías para primeras campañas |
