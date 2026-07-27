# Guía para crear un nuevo proyecto de newsletter

> ⚠️ **OBSOLETO (2026-07-27)** — Describe el flujo sobre el pipeline React Email original
> (`prepare-react-email`, agente 07 "React Email Developer"), archivado tras la transformación
> F1-F5. El agente 07 actual ejecuta `engine/build-newsletter.js`, no genera React Email. Ver
> `AGENTS.md` para el flujo actual y `engine/README.md` para el motor.

## 1. Preparación inicial

```bash
# Clonar o copiar el sistema base
cp -r /ruta/al/sistema-final /ruta/de/tu/nuevo-proyecto
cd /ruta/de/tu/nuevo-proyecto

# Instalar dependencias
npm install

# Copiar y configurar entorno
cp .env.example .env
# Edita .env con tus valores
```

### Requisitos del sistema

- Node.js 18+ (probado con 20+)
- npm 9+
- Playwright (solo para `preview-html`): `npx playwright install chromium`

## 2. Crear una campaña nueva

```bash
npm run create-campaign -- \
  --year 2026 \
  --client mi-cliente \
  --campaign 2026-jul-lanzamiento \
  --date 2026-07-15 \
  --cta "Descubre más" \
  --url "https://ejemplo.com/oferta"
```

Esto crea `newsletters/2026/mi-cliente/2026-jul-lanzamiento/` con la plantilla completa (00-brief a 09-exports).

### Parámetros

| Parámetro | Requerido | Descripción |
|-----------|-----------|-------------|
| `--year` | Sí | Año de 4 dígitos |
| `--client` | Sí | Slug del cliente (minúsculas, guiones) |
| `--campaign` | Sí | Nombre único de la campaña |
| `--date` | No | Fecha YYYY-MM-DD (por defecto: hoy) |
| `--cta` | No | Texto del CTA principal |
| `--url` | No | URL principal |
| `--client-name` | No | Nombre visible del cliente |
| `--force` | No | Sobrescribir si existe |

## 3. Ejecutar el pipeline multi-agente

El pipeline consta de 10 agentes que deben ejecutarse en orden estricto:

### Fase 00 — Orquestador
Configura los archivos de control (`campaign-status.md`, `handoff.md`, `task-log.md`, `next-steps.md`) y dirige el flujo.

### Fase 01 — Briefing Strategist
Lee los inputs y escribe `00-brief/brief.md` estructurado.

### Fase 02 — Brand Visual Analyst
Analiza la marca y escribe `02-analysis/` (brand-analysis.md, visual-analysis.md, risks.md).

### Fase 03 — Newsletter Architect
Define la estructura modular y escribe `03-strategy/`.

### Fase 04 — Email Designer
Convierte la arquitectura en especificaciones visuales y escribe `04-design/`.

### Fase 05 — Copywriter
Redacta asuntos, preheaders, cuerpo y CTAs.

### Fase 06 — Newsletter Data Specialist
Produce `06-data/newsletter-data.json` y `06-data/newsletter-data.ts`.

### Fase 07 — React Email Developer
Implementa en React Email usando los datos y diseño definidos.

### Fase 08 — Email QA Specialist
Revisa: visual, responsive, enlaces, Outlook, accesibilidad.

### Fase 09 — Export Manager
Genera HTML final, HTML inlinneado, previsualización y notas de entrega.

> **Regla de oro:** Nunca saltar una fase. Cada una construye sobre la anterior.

## 4. Validar en cada fase

### Validación de estructura del newsletter
```bash
npm run validate-newsletter -- --campaign newsletters/2026/mi-cliente/2026-jul-lanzamiento
```

### Comprobación de enlaces
```bash
npm run check-links -- --campaign newsletters/2026/mi-cliente/2026-jul-lanzamiento
```

### Validación de claims comerciales
```bash
npm run validate-claims -- --campaign newsletters/2026/mi-cliente/2026-jul-lanzamiento
```

### Preparar React Email (después de fase 06)
```bash
npm run prepare-react-email -- --campaign newsletters/2026/mi-cliente/2026-jul-lanzamiento
```

## 5. Exportar y previsualizar

### Exportar a HTML
```bash
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-lanzamiento
```

Con CSS inline:
```bash
npm run export-html -- --campaign newsletters/2026/mi-cliente/2026-jul-lanzamiento --inline
```

### Generar previsualización (PNG)
```bash
npm run preview-html -- --campaign newsletters/2026/mi-cliente/2026-jul-lanzamiento
```

Requiere Playwright con Chromium instalado.

## 6. Production Gate (validación final)

Antes de marcar una campaña como lista para producción, ejecuta las 3 validaciones:

```bash
npm run production-gate -- --campaign newsletters/2026/mi-cliente/2026-jul-lanzamiento
```

Esto ejecuta en orden:
1. `validate-newsletter --production`
2. `check-links --strict`
3. `validate-claims --production`

Todos deben salir con código 0.

## 7. Checklist de publicación

- [ ] Todos los módulos tienen contenido real (sin `[PENDIENTE]`)
- [ ] `productionReady` = true en newsletter-data.json
- [ ] `isTestCampaign` = false
- [ ] `fromEmail` es una dirección real
- [ ] Todos los enlaces funcionan (check-links --online)
- [ ] Las imágenes tienen src real y alt text
- [ ] El pie incluye baja y preferencias
- [ ] Los claims han pasado validate-claims --production
- [ ] La previsualización en PNG se ve correcta
- [ ] El HTML se ha exportado con --inline
- [ ] campaign-status.md refleja estado `completed`

## 8. Ejemplo completo

```bash
# 1. Crear campaña
npm run create-campaign -- \
  --year 2026 --client ejemplo --campaign 2026-jul-lanzamiento \
  --date 2026-07-15 --cta "Saber más" --url "https://ejemplo.com" \
  --client-name "Ejemplo S.L."

# 2. Validar estructura inicial
npm run validate-newsletter -- --campaign newsletters/2026/ejemplo/2026-jul-lanzamiento

# 3. Preparar React Email (tras fase 06)
npm run prepare-react-email -- --campaign newsletters/2026/ejemplo/2026-jul-lanzamiento

# 4. Exportar
npm run export-html -- --campaign newsletters/2026/ejemplo/2026-jul-lanzamiento

# 5. Production Gate
npm run production-gate -- --campaign newsletters/2026/ejemplo/2026-jul-lanzamiento
```
