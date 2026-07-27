# Hermes Newsletter System

> **Tipo:** Mixto — desarrollo software + operación de producción de newsletters  
> **Estado:** Motor cerrado en F5; en validación activa con campañas de prueba multi-marca  
> **Fecha de contexto:** 2026-07-27

---

## 1. Resumen Ejecutivo

Hermes Newsletter System automatiza la producción de newsletters HTML premium para múltiples
marcas cliente mediante un pipeline de 10 agentes y un motor determinista de render. El sistema
transforma un brief en `campaign-data.json`, aplica un brand pack y un patrón de género, y genera
`final.html` + `final-inline.html` con verificaciones automáticas. El pipeline React Email quedó
archivado; el camino vigente es `engine/` con HTML propio y `juice`.

## 2. Contexto Y Problema

El problema original era que la calidad premium se conseguía mediante rondas manuales de HTML,
capturas y ajustes, mientras el pipeline automático producía resultados inferiores y difíciles de
auditar. Además, el antiguo gate validaba datos del pipeline React Email, no el HTML final real.
Hermes resuelve esto separando la capa creativa/agentica de la capa determinista de render y
certificando el output antes de exportar.

## 3. Objetivos

- Objetivo principal: producir newsletters HTML premium desde un brief con mínima intervención
  manual y cierre verificable.
- Objetivos secundarios:
  - Mantener brand packs reutilizables por cliente.
  - Evitar outputs parciales o HTML final manipulado a mano.
  - Bloquear producción cuando falten datos, assets, claims aprobados o control files.
  - Permitir pruebas internas sin confundirlas con producción real.

## 4. Audiencia Y Stakeholders

**Usuarios objetivo:** equipo interno que opera Hermes/Claude/Codex para producir campañas.  
**Stakeholders clave:** responsables de marketing/email, QA, legal/compliance, cliente final que
aprueba assets, claims, CTAs y datos comerciales.

## 5. Estado Actual

El motor F0-F5 está cerrado y documentado. Existen campañas de prueba para marcas reales y tres
patrones vigentes: `saving`, `institutional` y `fotografia-primero`. El template base ya crea
`06-data/campaign-data.json`. El cierre operativo es `npm run production-gate`, alias de
`production-gate-motor`, con Gate 0 + Gates 1-11. `npm test` usa `node --test`. La deuda F2
queda cerrada salvo `card-tarifa-2`, bloqueada hasta que una campaña real la necesite.

## 6. Stack Y Arquitectura

**Stack:** Node.js 18+, TypeScript vía `tsx`, CommonJS en `engine/`, `ajv`, `juice`,
`playwright`, `sharp`, `node --test`.

**Arquitectura:** dos capas. La primera es un pipeline multiagente que produce artefactos por
fase. La segunda es un motor determinista que convierte `campaign-data.json` + brand pack +
patrón en HTML final verificable.

**Integraciones:** sitios públicos de marcas para captura/hero, CDNs de assets, plataformas de
email como destino final, posibles sesiones Hermes/Claude/Codex como operadores.

## 7. Sector Y Modelo De Negocio

**Sector:** email marketing, automatización creativa, producción de campañas CRM.  
**Modelo de negocio:** herramienta interna/reutilizable para acelerar producción de newsletters
premium multi-marca reduciendo trabajo manual, errores de QA y riesgo de claims.  
**KPIs de éxito:** campañas completas por prompt, gates pasados, reducción de intervención
manual, tiempo de producción, número de bloqueos detectados antes de exportación.

## 8. Restricciones Y Condicionantes

- Compatibilidad de email: Outlook, Gmail, mobile, CSS inline, VML, sin JavaScript.
- Claims comerciales trazables al brief; no inventar ahorro, gratuidad, urgencia o exclusividad.
- Datos públicos no equivalen a datos aprobados por cliente.
- No crear patrones/componentes sin necesidad real.
- No revivir React Email desde `_archive/`.
- No entregar `.env`, `node_modules`, `.DS_Store`, binarios sueltos ni outputs de prueba.

## 9. Notas Para La IA

La IA debe actuar como operador técnico del sistema, no como diseñador improvisado fuera del
motor. Debe leer `AGENTS.md`, `context.md`, `memory.md`, `.agent/*` y el agente de fase que
corresponda antes de ejecutar una campaña. Cuando haya contradicción documental, ganan los
archivos operativos actuales y el código. Para cerrar producción, el único gate real es
`production-gate-motor` vía `npm run production-gate`.

## 10. Deep Search Targets

### Tecnología

- Compatibilidad CSS real en clientes de email.
- `juice` y transformaciones de CSS inline.
- JSON Schema con `ajv` para estructuras modulares.
- Estrategias de testing con `node --test` en proyectos mixtos JS/TS.

### Mercado Y Competencia

- Mailchimp, Braze, Iterable, Salesforce Marketing Cloud, Beehiiv y sistemas de templating CRM.
- Workflows de QA de email marketing enterprise.

### Regulación Y Estándares

- GDPR y normativa de email marketing.
- Claims publicitarios en España/UE para salud, finanzas, energía y automoción.
- WCAG para contraste de copy en email.

### Tendencias Y Contexto Externo

- Dark mode en email.
- Personalización multi-marca con agentes de IA.
- Validación automática de campañas antes de envío.

### Referencias Técnicas

- `AGENTS.md`, `context.md`, `memory.md`.
- `engine/README.md` y `engine/CHANGELOG.md`.
- `docs/roadmap-deuda-tecnica.md`.
- `pipeline-skill/references/script-usage.md`.
