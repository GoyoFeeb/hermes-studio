# Auditoría total del sistema + plan de transformación a generación premium

Fecha: 2026-07-17 · Tercera auditoría (referencias: `auditoria-sistema-hermes-2026-07-17.md`, `re-auditoria-sistema-hermes-2026-07-17.md`)

## 0. El objetivo contra el que se audita todo

> "Un prompt → una newsletter premium con estructura perfecta, sea de la campaña que sea, con agentes que cumplan su función de verdad."

Ese objetivo tiene 4 requisitos técnicos concretos. Todo lo que hay en el sistema se evalúa contra ellos:

1. **Conocimiento premium codificado** — lo que hace "premium" a la pieza (jerarquía tipográfica, sombras, ritmo, contraste, composición) debe vivir en componentes y tokens reutilizables, no en un HTML de una campaña concreta.
2. **Agentes ejecutables** — cada agente debe ser un archivo con contrato real (qué lee, qué produce, criterios de cierre verificables), no una fila de tabla.
3. **Un solo motor de renderizado** — decidido: HTML+juice (el único validado con render real).
4. **QA automática que no dependa de memoria** — paridad fuente/inline, gate contra el archivo real, control files verificados por script.

## 1. Inventario completo con veredicto

### 1.1 Piezas que SIRVEN para el objetivo (conservar/evolucionar)

| Pieza | Estado | Valor para el objetivo |
|---|---|---|
| `v5-premium/final-premium-v2.html` + inline (= `09-exports/`) | ✅ Sincronizado tras ronda 10 | **El único artefacto premium validado del sistema.** Es la materia prima de la futura biblioteca de componentes — 15+ rondas de decisiones verificadas con render real están ahí dentro. |
| `brands/paraycompara/tokens/brand-tokens.json` (+ fusión pendiente del prompt 09) | 🟡 v2.1.0, fusión escrita y no ejecutada | El mecanismo de brand pack es correcto. Demostrado con 2 marcas (PyC + Demo azul) que el theming funciona. |
| `pipeline-skill/references/agent-roles.md` | ✅ Buen esqueleto | Los contratos de agente 00-06 (brief→data) están bien pensados: inputs, outputs, criterios de bloqueo. **Sirven como base directa para los archivos de agente reales.** Los de 07-09 hay que reescribirlos (apuntan a React Email). |
| `scripts/validate-claims.ts` (29 reglas) | ✅ Funciona | Ha atrapado errores reales (superlativos, "gratis" sin confirmar). Independiente del motor. |
| `scripts/render-preview.js` + stub libXdamage | ✅ Funciona | El bucle capturar→corregir es la única razón de que exista calidad premium. Debe ser parte obligatoria del agente QA. |
| `scripts/create-campaign.ts`, `check-links.ts` | ✅ Funcionan | Scaffolding y validación de enlaces reutilizables tal cual. |
| Disciplina documental (brief verbatim, claims, bloqueos `[Q-NNN]`, 2 niveles de aprobación) | ✅ Madura | Es la parte del sistema que ya funciona como "agentes de verdad" aunque no haya archivos: el criterio existe y está escrito. |

### 1.2 Piezas ASPIRACIONALES — documentadas pero vacías o fantasma (el mayor autoengaño del sistema)

| Pieza | Lo que dice la documentación | La realidad verificada |
|---|---|---|
| `agentes/` | "10 agentes, cada uno con archivo en agents/NN-name.md" | Directorio **vacío**. 0 archivos. |
| `newsletter-system/campaigns/` | "10 patrones de campaña universales" | **9 de 10 carpetas vacías.** Solo `saving/` tiene 1 archivo (base.html). |
| `newsletter-system/core/components/` | migration-map lista ~13 componentes core (header, hero, cta, cards, trust-bar, steps, footer, placeholders...) | Existen **6**: los 4 premium portados + gallery + divider. Los 8 "movidos" del migration-map **no existen** — la migración documentada nunca se completó o se perdió. |
| `brand-library/_template/` | Plantilla de marca | Muerta (el propio README lo admite: "sin mecanismo activo que la consuma"). |
| Patrones premium del core | "Portados de v5-premium" (changelog v2.1) | Reflejan el estado **pre-G1** (13-jul). Las 15 rondas posteriores de refinamiento no están. Además el ejemplo premium del género `saving` — el de la campaña piloto — nunca se creó. |

Conclusión de 1.2: **la documentación describe un sistema ~3 veces más grande que el real.** Cualquier agente (humano o IA) que lea los docs y confíe en ellos construirá sobre piezas que no existen. Antes de crecer, hay que hacer que docs = realidad.

### 1.3 Piezas a RETIRAR (motor perdedor y restos)

| Pieza | Motivo |
|---|---|
| `react-email-template/` + `07-code/react-email/` por campaña + `export-html.tsx` + `prepare-react-email.ts` | Motor perdedor (decisión ya tomada: HTML+juice). Su única producción real fue el `final.html` de colores incorrectos ya archivado. Archivar, no borrar. |
| `newsletter-schema.json` (formato módulos React) | Ligado al motor retirado. El concepto de "JSON como fuente de datos de campaña" SÍ se conserva — el schema se redefine para el motor HTML (§3.2). |
| `shot-tmp.js`, `shot-g8.js`, `shot-fix.js`, `convert-icons.py`, `create-circles.js`, `convert-assets.*`, `fix-asset-paths.py` (raíz y scripts/) | Scripts puntuales de sesiones pasadas, superseded por `render-preview.js` y el flujo de ronda 07. Mover a `scripts/_archive/`. |
| `.hermes/desktop-attachments/` | Adjuntos de sesiones, sin función. |
| `ejemplo-proyecto/` | Demo del pipeline viejo (React Email). Útil solo como referencia histórica → archivar. |

### 1.4 Scripts de validación: el hueco estructural

`validate-newsletter.ts` y `production-gate.ts` validan **`06-data/newsletter-data.json`** — estructura, flags, placeholders. Ninguno valida el HTML final. Consecuencias ya sufridas: el gate certificó un HTML con colores de marca incorrectos (H1 de la 1ª auditoría) y no detectó el inline desincronizado (N1 de la 2ª). En el sistema objetivo, el JSON de campaña y el HTML final deben estar **unidos por construcción** (el HTML se genera del JSON) y el gate debe correr sobre ambos.

## 2. Diagnóstico de fondo (por qué el sistema genera "genéricas")

1. **El conocimiento premium no está donde el pipeline lo busca.** El pipeline monta newsletters con componentes genéricos (React Email); lo premium vive en un HTML aparte. Resultado inevitable: la salida automática es genérica.
2. **Los agentes no existen, así que el criterio no se aplica dos veces igual.** agent-roles.md es buen diseño, pero sin archivo ejecutable cada sesión reinventa el rol. La deriva de calidad entre rondas (documentada en las auditorías) es el síntoma.
3. **La estructura "perfecta" no está definida en ningún sitio.** No existe un documento que diga qué secuencia de módulos, con qué ritmo y jerarquía, constituye una newsletter premium de cada género (saving, educational, retargeting...). Está implícita en v5, no explícita en el sistema.
4. **QA depende de acordarse.** Sin scripts de paridad/control-files, los mismos fallos reaparecen (ya ocurrió 2 veces en 48h).
5. **Documentación aspiracional.** Describe capacidades que no existen; los agentes futuros heredarán expectativas falsas.

## 3. Arquitectura objetivo

```
sistema-final/
├── agents/                      ← 9 archivos REALES (§3.1) — el corazón del cambio
├── engine/                      ← motor único HTML (§3.2)
│   ├── components/              ← ~12 componentes premium parametrizados (de v5)
│   ├── schema/                  ← campaign-data.schema.json (módulos del motor HTML)
│   └── build-newsletter.js      ← ensambla componentes+tokens+data → HTML fuente+inline
├── brands/                      ← brand packs (tokens v2.2+, assets, voice) — se mueve aquí desde newsletters/2026/
├── patterns/                    ← recetas de estructura por género (§3.3)
├── scripts/                     ← create-campaign, validate-claims, check-links, render-preview,
│   │                              + NUEVOS: check-parity.js, check-control-files.js
│   └── production-gate          ← ampliado: corre sobre JSON Y sobre HTML final (hash + paridad)
├── docs/                        ← saneada: solo lo que existe
└── newsletters/{year}/{client}/{campaign}/   ← campañas (00-brief … 09-exports), sin código propio
```

### 3.1 Los agentes reales (archivos `agents/NN-*.md`)

Base: los contratos 00-06 de agent-roles.md, que ya son buenos. Cambios clave:

| Agente | Cambio respecto al diseño actual |
|---|---|
| 00 Orchestrator | + checklist de cierre de ronda VERIFICABLE (corre check-control-files y check-parity antes de dar por cerrada cualquier fase; ningún "pendiente" sobrevive sin entrada en next-steps.md). |
| 01 Briefing | Sin cambios de fondo (contrato actual válido). |
| 02 Brand Analyst | + produce/actualiza el brand pack (`brands/{cliente}/tokens.json`) como entregable de primera clase, no solo análisis en prosa. |
| 03 Architect | + elige el **patrón de género** de `patterns/` y lo adapta; su entregable es la secuencia exacta de componentes del motor (no módulos abstractos). |
| 04 Designer | + hereda TODO el criterio premium codificado: contraste WCAG con umbrales correctos (lección del CTA), ritmo editorial ("no dos secciones consecutivas con la misma composición"), disciplina de sombras, tracking, espaciado — extraído de component-patterns.md y las 15 rondas. |
| 05 Copywriter | Sin cambios de fondo (claims safety ya maduro). |
| 06 Data Specialist | JSON contra el **nuevo** schema del motor HTML. |
| 07 **HTML Email Developer** (antes React Email Dev) | Reescrito: ensambla `engine/components/` + brand tokens + data JSON via `build-newsletter.js`; solo escribe HTML nuevo si el componente no existe — y entonces lo añade AL MOTOR, no a la campaña. |
| 08 QA | + bucle de render OBLIGATORIO (render-preview 320/375/600/600-dark + inspección de capturas) como criterio de cierre, no opcional. + paridad fuente/inline. |
| 09 Export | + verificación de assets en CDN (HTTP 200 por cada URL del HTML) antes de cerrar. |

### 3.2 El motor (`engine/`)

- **Componentes**: extraer de `v5-premium/final-premium-v2.html` (post-ronda 10, con CTA 19px e iconos oficiales) los ~12 bloques reales: header, hero editorial asimétrico, trust bar, cards de producto con franja de acento, pasos, lista premium (premiumListRow), banda de cierre, footer legal, divider, preheader, CTA bulletproof (VML 19px), stat pill. Cada uno parametrizado con placeholders de token (`{{color.primary}}`, `{{radius.card}}`...) y de contenido (`{{title}}`, `{{cta.href}}`...).
- **`build-newsletter.js`**: lee campaign-data.json + brand-tokens.json + la receta del patrón → sustituye placeholders → concatena → escribe fuente → juice → inline → **verifica paridad él mismo**. Esto une por construcción lo que hoy se desincroniza a mano.
- Los 6 componentes actuales de `core/components/` (pre-G1) se archivan: la extracción se hace desde la pieza final, no desde ellos.

### 3.3 Los patrones de género (`patterns/`)

Un archivo por género con la ESTRUCTURA premium explícita: secuencia de componentes, reglas de ritmo, dónde va cada CTA, qué es opcional. El primero se escribe gratis: `saving.md` es exactamente la estructura de v5 (header → hero asimétrico → trust bar → cards → pasos → lista "antes de decidir" → banda de cierre → footer). Educational/retargeting salen de los ejemplos premium ya existentes en brands/paraycompara/examples/, actualizados. El resto de géneros (las 9 carpetas vacías) se crean **cuando haya una campaña real que los necesite** — no antes. Prohibido volver a crear estructura vacía.

### 3.4 El flujo "un prompt"

```
Prompt del usuario (brief mínimo: cliente, objetivo, CTA, URL, datos confirmados)
  → 01 estructura el brief          → bloquea si falta algo crítico
  → 02 carga/crea brand pack        → tokens reales, nunca inventados
  → 03 elige patrón + secuencia     → estructura premium garantizada por receta
  → 04 especifica valores           → criterio premium heredado del archivo de agente
  → 05 escribe copy                 → claims safety
  → 06 rellena campaign-data.json   → validado contra schema
  → 07 build-newsletter.js          → HTML premium por construcción (componentes validados)
  → 08 render + QA visual + paridad → capturas obligatorias
  → 09 export + assets HTTP 200     → gate sobre JSON y HTML
```

La calidad deja de depender de 15 rondas de refinamiento porque las 15 rondas ya están dentro de los componentes.

## 4. Plan de ejecución por fases (cada fase = prompts para Hermes)

| Fase | Contenido | Depende de | Resultado verificable |
|---|---|---|---|
| **F0** (en curso) | Ejecutar prompt 09 (fusión tokens) + subir 8 PNGs al CDN (manual, tuya) | — | brand-tokens v2.2.0; HTTP 200 × 8 |
| **F1 — Motor** | Extraer los ~12 componentes de v5 a `engine/components/` con placeholders; escribir `build-newsletter.js` + `campaign-data.schema.json`; patrón `saving.md`. **Prueba de fuego incluida**: reconstruir la newsletter piloto desde data+componentes y comparar render contra el original (diff visual de capturas). | F0 | La pieza piloto se regenera desde el motor con paridad visual |
| **F2 — Agentes** | Escribir los 9 archivos `agents/*.md` (§3.1). Los 00-06 adaptando agent-roles.md; 07-09 nuevos para el motor HTML. | F1 (para que 07 tenga motor real que usar) | 9 archivos con contratos ejecutables y criterios de cierre verificables |
| **F3 — Verificación** | `check-parity.js` (fuente vs inline, hash), `check-control-files.js` (4 archivos sincronizados por transición), production-gate ampliado (JSON + HTML + assets HTTP 200). | F1 | Los 3 fallos históricos (colores, inline, control files) son irreproducibles |
| **F4 — Limpieza** | Archivar: react-email-template, 07-code/react-email por campaña, ejemplo-proyecto, scripts puntuales, componentes core pre-G1, carpetas de campaña vacías, brand-library. Sanear docs (migration-map fantasma, README) para que documentación = realidad. | F1-F3 | `find` no encuentra nada aspiracional; docs auditables |
| **F5 — Prueba real** | Campaña nueva de PyC (otro tema) ejecutada end-to-end con un solo prompt, **cero intervención manual de diseño**. Comparar resultado contra v5. | F1-F4 | El criterio de éxito del §0, medido |

Orden interno recomendado: F0 → F1 → F2 → F3 → F4 → F5. F1 es la fase más grande (probablemente 3-4 prompts: extracción de componentes / build script / schema+patrón / prueba de fuego). F2 otros 2-3 prompts (agentes por bloques). F3 y F4 un prompt cada una.

## 5. Qué NO hacer (lecciones de las 3 auditorías)

- No crear más estructura vacía "para el futuro" (campaigns/ con 9 carpetas vacías, brand-library muerta). Todo lo que se cree debe usarse en la misma fase.
- No documentar como hecho lo que no está verificado (migration-map fantasma, "production-ready" sobre archivo equivocado, "PASS" de contraste incorrecto).
- No dejar pendientes en prosa: todo fleco abierto → entrada en next-steps.md con responsable, o no se cierra la ronda.
- No mantener dos representaciones de lo mismo (dos tokens, dos motores, tres finales) — cada duplicación de esta campaña acabó en desincronización.
- No editar piezas directamente desde fuera del sistema: los prompts a Hermes son el mecanismo, y los agentes-archivo (F2) son su versión definitiva.
