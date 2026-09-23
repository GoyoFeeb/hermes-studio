# Workflow: Hermes Newsletter System

## Visión general

El sistema Hermes Newsletter System produce newsletters mediante un flujo secuencial de 10 agentes especializados (00–09), desde el brief inicial hasta la exportación final. Cada agente tiene una responsabilidad concreta, produce archivos específicos y entrega un handoff al siguiente.

El flujo es estrictamente ordenado. No se pueden saltar fases. El Orchestrator (00) coordina la activación de cada agente, controla la calidad del avance y mantiene la trazabilidad de la campaña.

## Fases del workflow

```
Brief → Análisis visual → Arquitectura → Diseño técnico → Copy → Datos → React Email → QA → Exportación
```

### Fase 00 — Coordinación (Orchestrator)

| Aspecto | Detalle |
|---|---|
| Agente | 00 — Orchestrator |
| Estado | created |
| Input | Brief del usuario, instrucciones, assets |
| Output | campaign-status.md, task-log.md, handoff.md hacia 01 |
| Criterio de avance | Campaña creada con estructura de carpetas mínima |

El Orchestrator no produce la newsletter. Produce archivos de control y activa a los agentes en orden. Es el responsable de mantener la coherencia global y evitar errores estructurales.

### Fase 01 — Briefing

| Aspecto | Detalle |
|---|---|
| Agente | 01 — Briefing Strategist |
| Estado | briefing |
| Input | Información desordenada del usuario (brief, landing, capturas, enlaces, textos) |
| Output | 00-brief/brief.md, 00-brief/requirements.md, 00-brief/source-links.md |
| Handoff | Hacia 02 — Brand Visual Analyst |
| Criterio de avance | Brief completo con cliente, objetivo, CTA principal, enlace principal, restricciones legales |
| Bloqueo si falta | Cliente, objetivo, CTA principal, enlace principal, restricciones legales aplicables |

### Fase 02 — Análisis visual y de marca

| Aspecto | Detalle |
|---|---|
| Agente | 02 — Brand Visual Analyst |
| Estado | analysis |
| Input | brief.md, requirements.md, source-links.md, assets en 01-inputs/ |
| Output | 02-analysis/brand-analysis.md, 02-analysis/visual-identity-report.md, 02-analysis/risks.md |
| Handoff | Hacia 03 — Newsletter Architect |
| Criterio de avance | Colores, tipografías, botones, tono visual y limitaciones de email documentados |
| Bloqueo si falta | Inputs visuales, cliente/marca no identificable, contradicciones visuales irreconciliables |

### Fase 03 — Arquitectura de newsletter

| Aspecto | Detalle |
|---|---|
| Agente | 03 — Newsletter Architect |
| Estado | strategy |
| Input | brief.md, requirements.md, brand-analysis.md, visual-identity-report.md, risks.md |
| Output | 03-strategy/campaign-angle.md, 03-strategy/message-hierarchy.md, 03-strategy/module-selection.md, 03-strategy/structure.md |
| Handoff | Hacia 04 — Email Designer |
| Criterio de avance | Estructura definida: orden de módulos, función de cada uno, CTA principal y secundarios, jerarquía de mensajes, criterio desktop/mobile |
| Bloqueo si falta | CTA principal, objetivo de campaña, menos de 2 inputs de fase previa utilizables |

### Fase 04 — Diseño técnico de email

| Aspecto | Detalle |
|---|---|
| Agente | 04 — Email Designer |
| Estado | design |
| Input | strategy/ completo, analysis/ completo, brief/ completo |
| Output | 04-design/layout.md, 04-design/desktop-spec.md, 04-design/mobile-spec.md, 04-design/assets-notes.md |
| Handoff | Hacia 05 — Copywriter |
| Criterio de avance | Ancho de contenedor, paddings, colores aplicados, tamaños de imagen, comportamiento responsive, limitaciones Outlook evaluadas |
| Bloqueo si falta | Análisis visual, arquitectura, paleta de color, estilo de botón |

### Fase 05 — Copy

| Aspecto | Detalle |
|---|---|
| Agente | 05 — Copywriter |
| Estado | copy |
| Input | design/ completo, strategy/ completo, brief/ completo, analysis/ completo |
| Output | 05-copy/subject-lines.md, 05-copy/preheaders.md, 05-copy/body-copy.md, 05-copy/cta-options.md |
| Handoff | Hacia 06 — Newsletter Data Specialist |
| Criterio de avance | Mínimo 3 opciones de asunto, copy completo por módulo, CTAs con enlaces, textos legales copiados textualmente, consistencia asunto→preheader→titular→CTA |
| Bloqueo si falta | Brief, arquitectura, especificación visual con espacios de texto, CTA principal |

### Fase 06 — Datos estructurados

| Aspecto | Detalle |
|---|---|
| Agente | 06 — Newsletter Data Specialist |
| Estado | data |
| Input | Body copy, CTAs, estructura de módulos, especificación visual, assets |
| Output | 06-data/newsletter-data.json, 06-data/newsletter-data.ts |
| Handoff | Hacia 07 — React Email Developer |
| Criterio de avance | JSON válido sintácticamente, todos los módulos presentes, todos los CTAs con href, todas las imágenes con src y alt, textos legales copiados textualmente |
| Bloqueo si falta | Body copy, especificación visual, estructura de módulos, CTA href obligatorio, JSON no válido |

### Fase 07 — Desarrollo React Email

> **[SUPERSEDED — F4, 2026-07-21]** Esta fase describe el pipeline React Email, archivado (ver
> `_archive/f4-react-email-pipeline/README.md`). El contrato vigente es
> `agents/07-html-email-developer.md`: ejecuta `engine/build-newsletter.js` sobre
> `campaign-data.json`, no genera código React. Tabla conservada como referencia histórica.

| Aspecto | Detalle |
|---|---|
| Agente | 07 — React Email Developer |
| Estado | development |
| Input | newsletter-data.json, design/ completo, architecture/ completo |
| Output | 07-code/react-email/ (componentes por módulo, newsletter.tsx, index.tsx, styles.ts) |
| Handoff | Hacia 08 — Email QA Specialist |
| Criterio de avance | newsletter.tsx consume newsletter-data.json, todos los módulos tienen componente, sin errores TSX, sin imports rotos, sin datos hardcodeados |
| Bloqueo si falta | newsletter-data.json, JSON no válido, errores TSX que impiden compilación, imágenes críticas sin fallback |

### Fase 08 — QA

| Aspecto | Detalle |
|---|---|
| Agente | 08 — Email QA Specialist |
| Estado | qa |
| Input | HTML renderizado, JSON, componentes, design specs, brief |
| Output | 08-qa/visual-qa.md, 08-qa/responsive-qa.md, 08-qa/outlook-qa.md, 08-qa/links-qa.md, 08-qa/final-checklist.md |
| Handoff | Hacia 09 — Export Manager (si aprobado) o al agente de corrección (si devuelto) |
| Criterio de avance | Sin errores critical, checklist final completo, decisión = aprobado |
| Bloqueo si hay | Errores critical: textos legales incorrectos, CTAs sin href, imágenes sin src, JSON inválido, precios incorrectos |

### Fase 09 — Exportación

| Aspecto | Detalle |
|---|---|
| Agente | 09 — Export Manager |
| Estado | export → completed |
| Input | HTML renderizado, JSON, assets, QA final-checklist |
| Output | 09-exports/final.html, 09-exports/final-inline.html (opcional), 09-exports/final-preview.png, 09-exports/assets/ (opcional), 09-exports/delivery-notes.md |
| Criterio de cierre | QA aprobado, HTML generado, enlaces verificados, imágenes accesibles, delivery-notes completo, campaign-status.md actualizado a completed |
| Bloqueo si | QA no aprobado, renderizado falla, imágenes críticas inaccesibles, enlaces de baja/preferencias faltan |

## Reglas de avance

1. El flujo es estrictamente secuencial. No se puede avanzar a la fase N+1 hasta que la fase N esté completa y validada.
2. El Orchestrator es el único autorizado para activar agentes y declarar fases completas.
3. Cada fase debe generar un handoff hacia la siguiente antes de darse por terminada.
4. Si un agente detecta que falta información crítica de fases anteriores, devuelve el trabajo al agente responsable (nunca al inicio del flujo).
5. Excepción: el usuario puede solicitar saltar una fase, pero debe quedar registrado en task-log.md.

## Cuándo bloquear

Una campaña se bloquea (estado: blocked) si:

- Falta CTA principal
- Falta enlace principal
- Faltan textos legales obligatorios
- Falta objetivo de campaña
- No hay assets mínimos
- Hay contradicción entre brief y requisitos
- Hay promoción sin condiciones claras
- Una URL no funciona
- Falta aprobación de estructura cuando se requiere
- QA no está aprobado antes de exportación

Cuando se bloquea, el Orchestrator genera blocked-reason.md y detiene el flujo hasta que el usuario resuelva la causa.

## Cuándo devolver a un agente anterior

| Problema | Devuelto a |
|---|---|
| JSON no válido | 06 — Newsletter Data Specialist |
| Layout no respeta mobile | 04 — Email Designer |
| Código rompe Outlook | 07 — React Email Developer |
| CTA no coincide con brief | 05 — Copywriter o 06 |
| Faltan assets | 01 — Briefing Strategist |
| HTML final no corresponde al React Email aprobado | 09 — Export Manager |
| Error en textos legales | 05 — Copywriter (verificar, no modificar) |

Cuando se devuelve, QA genera return.md con instrucciones específicas. El Orchestrator reactiva al agente correspondiente y luego reactiva QA para re-verificar.

## Cuándo exportar

Solo se exporta cuando:

1. QA está aprobado (handoff de 08 con resultado ✅).
2. El checklist final está completo sin errores critical.
3. Todos los módulos tienen su componente.
4. Los enlaces son absolutos y funcionales.
5. Las imágenes son accesibles o están empaquetadas.
6. Los textos legales están presentes y correctos.

La exportación marca la campaña como completed.
