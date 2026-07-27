# Riesgos y Pendientes Conocidos

> ⚠️ **OBSOLETO (2026-07-27)** — Riesgos identificados en el empaquetado original (2026-07-09,
> dependencias React Email nunca ejecutadas). El sistema se validó y transformó completamente
> desde entonces (F0-F5, ver `docs/f5-prueba-real-cerrada.md`); estos riesgos ya no aplican al
> motor actual. Riesgos y pendientes vigentes: `memory.md` §"Known Gotchas".

> Este documento lista los problemas no resueltos, dependencias y comportamientos no verificados del sistema. Antes de usar en producción, revisa y resuelve cada punto.

## 1. Comportamientos no verificados

| # | Riesgo | Impacto | Estado |
|---|--------|---------|--------|
| R01 | **npm install nunca ejecutado** — no se ha verificado que las dependencias (`@react-email/components`, `juice`, `playwright`, `tsx`, `typescript@6`) resuelvan correctamente. TypeScript 6 es muy reciente y puede tener incompatibilidades con tsx `^4.23.0`. | Alto — el sistema no arranca | Pendiente de verificar |
| R02 | **Scripts no ejecutados** — ninguno de los 8 scripts se ha ejecutado ni una vez. Pueden tener errores de sintaxis, importación o lógica no detectados. | Alto — rotura en producción | Pendiente de verificar |
| R03 | **create-campaign.ts no probado** — no se ha creado ninguna campaña real con el script. Las rutas, reemplazos de placeholders y copia de plantilla no están validadas. | Alto — primera campaña puede fallar | Pendiente de verificar |
| R04 | **production-gate.ts no probado** — la ejecución secuencial de 3 gates no se ha validado. El uso de `execSync` con rutas puede fallar en entornos Windows o con espacios en rutas. | Medio — CI/CD puede fallar | Pendiente de verificar |
| R05 | **export-html.tsx no probado** — renderizado React Email + juice para inline CSS no validado. | Alto — HTML final puede ser incorrecto | Pendiente de verificar |
| R06 | **check-links.ts online mode no probado** — las peticiones HTTP HEAD pueden fallar según red/CORS. | Medio | Pendiente de verificar |
| R07 | **preview-html.ts con Playwright no probado** — captura PNG no validada. | Bajo (función auxiliar) | Pendiente de verificar |

## 2. Dependencias frágiles

| # | Riesgo | Impacto |
|---|--------|---------|
| D01 | **TypeScript 6.x** — `^6.0.3` es una versión muy reciente. `tsx` puede no ser compatible. Si falla, bajar a TypeScript `^5.5` o `^5.6`. | Alto — el sistema no compila |
| D02 | **@react-email/components ^1.0.12** — API puede cambiar en versiones futuras. | Medio — rotura silenciosa |
| D03 | **Playwright ^1.61.1** — requiere `npx playwright install chromium` adicional. Ocupa ~300MB. | Bajo (documentado) |
| D04 | **juice ^12.1.1** — dependencia para inline CSS. Versión mayor 12, revisar changelog si hay breaking changes. | Bajo |

## 3. Archivos no creados o incompletos

| # | Archivo | Estado |
|---|---------|--------|
| P01 | `AGENTS.md` | Creado en esta sesión |
| P02 | `RIESGOS_Y_PENDIENTES.md` | Este documento |
| P03 | `ejemplo-proyecto/` | Pendiente de crear |
| P04 | `.env.example` | Creado (verificar contenido) |
| P05 | `.gitignore` | Creado (verificar contenido) |
| P06 | `node_modules/` | No existe (requiere npm install) |

## 4. Rutas absolutas a revisar

Revisar en todos los scripts:

- `scripts/create-campaign.ts` — `const ROOT = path.resolve(import.meta.dirname, '..')` — correcto
- `scripts/production-gate.ts` — usa `path.resolve(ROOT, 'node_modules', '.bin', 'tsx')` — correcto si existe node_modules
- Todos los demás scripts — usan `ROOT` relativo a `import.meta.dirname` — correcto

No se detectaron rutas absolutas hardcodeadas en los scripts. Las rutas a clientes reales (OCU, BMW, Audika, etc.) fueron eliminadas en la limpieza.

## 5. Secretos y referencias a clientes reales

| # | Riesgo | Estado |
|---|--------|---------|
| S01 | **KNOWN_CLIENTS eliminado** en `create-campaign.ts` — OK | Resuelto |
| S02 | **Ejemplos en comentarios** — cambiados a genéricos `mi-cliente` / `{year}/{client}/{campaign}` | Resuelto |
| S03 | **Campañas reales** — no copiadas al sistema-final | Excluidas deliberadamente |
| S04 | **Archivos .env con secretos** — no copiados | Excluidos |
| S05 | **Tokens/sesiones/cachés de Hermes** — no copiados | Excluidos |

## 6. Recomendaciones pre-producción

1. **Ejecutar `npm install`** y verificar que resuelve sin errores
2. **Crear una campaña demo**: `npm run create-campaign -- --year 2026 --client demo --campaign 2026-jul-test`
3. **Ejecutar cada script** individualmente contra la campaña demo
4. **Probar `production-gate`** completo
5. **Verificar `export-html --inline`** genera HTML válido en cliente de email
6. **Si TypeScript 6 falla**, cambiar a `^5.6.3` en package.json