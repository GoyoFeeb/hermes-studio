# INVENTARIO_ORIGEN.md — Qué contenía cada backup y qué se ha hecho

> ⚠️ **HISTÓRICO (2026-07-27)** — Documenta el origen del empaquetado inicial (2026-07-09) desde
> los backups de Hermes Agent. Sigue siendo válido como registro histórico de procedencia; no
> describe la transformación F0-F5 posterior ni el estado actual del sistema (ver `context.md`).

## Backup 1: `hermes-config-backup 1 (1).tgz`

**Origen:** Copia de la configuración de Hermes Agent del ordenador original (~/.hermes/).

### Contenido del backup

| Categoría | Archivos | Acción |
|-----------|----------|--------|
| Configuración de Hermes | `.hermes/config.yaml`, `.hermes/config.yaml.bak` | Excluida (específica del agente, no del sistema de newsletters) |
| Credenciales / secretos | `.hermes/.env`, `.hermes/auth.json`, `.hermes/auth.lock` | Excluidas — contienen tokens, claves API y sesiones |
| Cachés | `.hermes/cache/*`, `.hermes/provider_models_cache.json`, `.hermes/context_length_cache.yaml`, `.hermes/models_dev_cache.json` | Excluidas — temporales, regenerables |
| Sesiones | `.hermes/sessions/*` (5 archivos JSON) | Excluidas — contienen historial de conversaciones del agente |
| Historial | `.hermes/.hermes_history`, `.hermes/.update_check` | Excluidas — temporales |
| Pastes | `.hermes/pastes/*` (~120 archivos) | Excluidas — fragmentos temporales de conversaciones |
| Logs | `.hermes/logs/*` | Excluidas — depuración local |
| Bases de datos | `.hermes/state.db*` | Excluidas — estado interno del agente |
| Binarios | `.hermes/bin/uv`, `.hermes/bin/uvx`, `.hermes/bin/tirith` | Excluidos — específicos del sistema |
| Repositorio Hermes Agent | `.hermes/hermes-agent/` (código fuente completo del agente) | Excluido — no pertenece al sistema de newsletters |
| **Newsletter Pipeline Skill** | `.hermes/skills/creative/newsletter-pipeline/SKILL.md` | **Copiado** a `pipeline-skill/SKILL.md` |
| **Referencias del pipeline** | `.hermes/skills/creative/newsletter-pipeline/references/*` (10 archivos) | **Copiados** a `pipeline-skill/references/` |
| Skills de Hermes (resto) | Todos los demás skills (marketing, devops, media, etc.) | Excluidos — no son parte del sistema de newsletters |
| SOUL.md | `.hermes/SOUL.md` | Excluido — personalidad del agente Hermes |

### Total excluido del backup 1: ~110.000+ archivos
### Total copiado del backup 1: 11 archivos (skill + referencias)

---

## Backup 2: `hermes-newsletter-system-backup (1).tgz`

**Origen:** Proyecto completo del sistema de newsletters.

### Contenido del backup

| Ruta | Acción | Motivo |
|------|--------|--------|
| `package.json` | **Copiado** a raíz | Configuración del proyecto |
| `tsconfig.json` | **Copiado** y **adaptado** | Se corrigieron rutas `include` |
| `scripts/*.ts` (7 scripts) | **Copiados** y **adaptados** | Se eliminaron referencias a clientes reales en comentarios |
| `scripts/*.tsx` (1 script) | **Copiado** y **adaptado** | Igual |
| `workspace/react-email-template/template-hermes.tsx` | **Copiado** a `react-email-template/` | Componente principal de la newsletter |
| `workspace/react-email-template/newsletter-schema.json` | **Copiado** | Esquema de validación JSON |
| `workspace/react-email-template/components/*.tsx` (12 componentes) | **Copiados** | Componentes React Email reutilizables |
| `brand-library/_template/*` (5 archivos) | **Copiados** | Plantilla de marca genérica |
| `brand-library/audika/*` | **Excluido** | Datos de cliente real (Audika) |
| `docs/*.md` (22 documentos) | **Copiados** a `docs/` | Documentación del sistema |
| `newsletters/_campaign-template/*` | **Copiados** | Plantilla de campaña genérica |
| `newsletters/2026/ocu/2026-jul-moneyman/*` | **Excluido** | Campaña con datos reales de OCU |
| `newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta/*` | **Excluido** | Campaña con datos reales de BMW |
| `newsletters/2026/testclient/test-create/*` | **Excluido** | Campaña de prueba con datos ficticios |
| `newsletters/2026/ford/*` | **Excluido** | Carpeta vacía / campaña de cliente real |
| `newsletters/2026/ucademy/*` | **Excluido** | Carpeta vacía / campaña de cliente real |

### Total excluido del backup 2: ~440 archivos (campañas reales + datos de cliente)
### Total copiado del backup 2: ~60 archivos (scripts, componentes, plantillas, docs)

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Archivos analizados totales (backup 1 + 2) | ~110.800 |
| Archivos copiados a `sistema-final` | ~70 |
| Archivos adaptados/saneados | ~10 |
| Archivos excluidos | ~110.730 |
| Nuevos archivos creados | ~10 (README, AGENTS.md, .gitignore, .env.example, etc.) |

## Criterios de exclusión

1. **Datos de clientes reales**: OCU, BMW, Audika, Ford, UCademy, Verisure — nombres, marcas, configuraciones, campañas completas.
2. **Credenciales y secretos**: tokens API, claves, sesiones, cookies.
3. **Cachés y temporales**: cualquier archivo regenerable.
4. **Configuración del agente Hermes**: no pertenece al sistema de newsletters.
5. **Historial de conversaciones**: privado del usuario.
6. **Datos ficticios de prueba**: no deben confundirse con datos reales de ejemplo.