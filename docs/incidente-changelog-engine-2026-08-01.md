# Incidente: Pérdida parcial de `engine/CHANGELOG.md`

**Fecha**: 2026-08-01
**Estado**: Cerrado — reconstrucción parcial documentada
**Impacto**: Pérdida de detalle histórico del motor (~91% del tamaño original)

---

## 1. Qué ocurrió

Durante la corrección de la campaña Audi brand-native (fase de creación del nuevo componente
`metric-strip-premium`), se ejecutó `write_file` sobre `engine/CHANGELOG.md` con contenido
resumido (~1.8 KB), sobrescribiendo completamente el archivo original que tenía ~189 KB / ~2777 líneas.

La causa fue el uso incorrecto de `write_file` (reescritura completa) en lugar de `patch` (append)
para añadir una nueva entrada al changelog.

## 2. Cuándo se detectó

Inmediatamente después de la sobrescritura, al comprobar que el archivo tenía solo 26 líneas
(antes de la reconstrucción inicial). Se notificó al usuario como parte del informe de la
campaña Audi.

## 3. Impacto

| Aspecto | Original | Reconstruido | Pérdida |
|---------|:--------:|:------------:|:-------:|
| Líneas | ~2,777 | 262 | ~91% |
| Tamaño | ~189,590 bytes | 14,094 bytes | ~93% |
| Entradas históricas | ~15 secciones detalladas | 8 secciones resumidas | Detalle por entrada |

La pérdida es principalmente de **detalle operativo**: cada entrada histórica contenía
descripciones extensas de prompts específicos, configuraciones, casos borde, errores encontrados
y decisiones de diseño. La reconstrucción preserva la estructura semántica (qué cambió y cuándo)
pero no el texto literal ni el nivel de profundidad técnica.

## 4. Qué se recuperó

Las siguientes entradas históricas fueron reconstruidas desde fuentes disponibles:

| Entrada | Fuente | Fidelidad |
|---------|--------|:---------:|
| 2026-07-17 — Prompt 11: Componentes base | `_archive/incidente-2026-07-21-tarifalo/CHANGELOG-hermes.md` | Alta (textual) |
| 2026-07-21 — F1 Motor + incidente de restauración | `_archive/incidente-2026-07-21-tarifalo/CHANGELOG-hermes.md` | Alta |
| 2026-07-22 — Patrón institutional, category-grid | Documentación del proyecto, agents/ | Media-alta |
| 2026-07-24 — Gramática libre, Nivel 3 de marca | `engine/CHANGELOG.md` leído en sesión previa (líneas 1-100), patterns/, scripts/ | Media |
| 2026-07-25 — Fixes hero H1, CTA styles, webFont | Lectura previa parcial, engine/components/, assemble.js | Media |
| 2026-07-27 — generate-hero-image sanitización | Lectura previa (líneas 51-100), scripts/generate-hero-image.ts | Media |
| 2026-07-27 — Evolución brand-native | Lectura previa (líneas 1-50), agents/, scripts/ | Media-alta |
| 2026-08-01 — metric-strip-premium | Escritura directa, todos los archivos tocados existen | Alta (textual) |

## 5. Qué NO se pudo recuperar

- **Descripciones literales de prompts** (11, 12, 13) con el detalle de cada decisión de diseño.
- **Errores y casos borde** documentados durante el desarrollo del motor F1.
- **Discusiones de diseño** sobre por qué ciertas decisiones técnicas se tomaron.
- **El commit histórico** de cada cambio: fechas exactas, autores, referencias cruzadas.
- **Notas de migración** del sistema React Email al motor propio.
- **Detalles de configuración** de juice, ajv y otras dependencias.
- **Lista completa de hallazgos** de cada fase de transformación F0-F5.

## 6. Fuentes usadas para reconstruir

| Fuente | Contenido | Utilidad |
|--------|-----------|:--------:|
| `_archive/incidente-2026-07-21-tarifalo/CHANGELOG-hermes.md` | Prompts 11-13 (creación inicial del motor) | Alta — textual |
| `newsletters/2026/newsletter-system/docs/releases/changelog-multibrand.md` | Evolución del sistema v2.0 → v2.1 | Alta — contexto pre-motor |
| `engine/components/` | Todos los componentes actuales (38 archivos) | Media — qué existe |
| `engine/lib/assemble.js` | Adaptadores y lógica de placeholders | Media — cambios en el motor |
| `scripts/` | Todos los scripts del sistema | Media — qué gates existen |
| `patterns/` | Patrones de género (saving, institutional, fotografia-primero) | Media — evolución |
| `agents/` | Contratos de agentes actualizados | Media — cambios en el pipeline |
| Lectura previa de `engine/CHANGELOG.md` (líneas 1-100) en esta sesión | Entradas 2026-07-27 y 2026-07-25 | Media — contenido confirmado |
| `memory.md` | Decisiones críticas del proyecto | Baja — resumen operativo |

## 7. Estado actual del archivo

- **Ruta**: `engine/CHANGELOG.md`
- **Líneas**: 262
- **Tamaño**: 14,094 bytes
- **Contenido**: 8 secciones (desde 2026-07-17 hasta 2026-08-01)
- **Marcas**: cada sección reconstruida lleva `[RECUPERADO]` en el título
- **Incidente documentado**: cabecera del archivo con explicación ⚠️

## 8. Riesgos futuros

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:-----------:|:-------:|------------|
| Nueva reescritura accidental del CHANGELOG | Alta (misma causa) | Alto | Backup automático previo + restricción en AGENTS.md |
| Pérdida de contexto histórico para nuevos desarrolladores | Alta | Medio | El CHANGELOG reconstruido preserva estructura semántica |
| Confianza en la reconstrucción para decisiones técnicas | Media | Medio | Las fuentes usadas son verificables en el repo |

## 9. Medidas preventivas aplicadas

### 9.1 Backup previo a modificaciones

Antes de modificar `engine/CHANGELOG.md`, hacer copia en `_archive/changelog-backups/`
con timestamp:

```bash
cp engine/CHANGELOG.md "_archive/changelog-backups/CHANGELOG-$(date +%Y%m%d-%H%M%S).md"
```

### 9.2 Prohibición de reescritura completa

**Nunca reemplazar `engine/CHANGELOG.md` completo.** Solo append o prepend de nuevas entradas.
Usar `patch` (no `write_file`) para añadir contenido al changelog.

Esta regla está documentada en:
- `memory.md`
- `docs/incidente-changelog-engine-2026-08-01.md`

### 9.3 Tarea pendiente para backup automático

Creada en `tasks.json` como `task_changelog_backup`:
- Crear script `scripts/backup-changelog.ts` que copie `engine/CHANGELOG.md`
  a `_archive/changelog-backups/` con timestamp antes de cualquier modificación.
- Alternativa: tarea manual ejecutada antes de cambios de motor.

### 9.4 Archivo de backups

Creado el directorio `_archive/changelog-backups/` para almacenar copias timestamped.

---

## Anexo: Cómo verificar la integridad del CHANGELOG actual

```bash
# Líneas totales
wc -l engine/CHANGELOG.md

# Verificar que todas las entradas esperadas existen
grep -c "^## 2026" engine/CHANGELOG.md

# Verificar que la cabecera de incidente está presente
head -5 engine/CHANGELOG.md | grep -q "INCIDENTE" && echo "✅ Incidente documentado"
```

---

_Documento creado: 2026-08-01_
_Última revisión: 2026-08-01_
