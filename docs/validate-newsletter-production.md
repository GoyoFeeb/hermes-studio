# Validate Newsletter — Modo normal y modo production

## Visión general

`validate-newsletter` comprueba que una campaña tenga la estructura mínima requerida: carpetas de fase, archivos obligatorios y `newsletter-data.json` válido.

Tiene dos modos de ejecución:

| Modo | Flag | Comportamiento | Exit code esperado |
|---|---|---|---|
| Normal | (sin flag) | Valida estructura y JSON | 0 si la estructura es válida |
| Production | `--production` | Valida estructura + flags de producción + enlaces CRM | 0 solo si es apta para envío real |

## Modo normal (por defecto)

Uso:

```bash
npm run validate-newsletter -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta
```

Validaciones:

- 10 carpetas de fase existen (00-brief/ a 09-exports/)
- 10 archivos mínimos existen (README, campaign-status, brief, JSON, etc.)
- `newsletter-data.json` es parseable
- JSON contiene `metadata`, `settings`, `modules` (array)
- Cada módulo tiene `id`, `type`, `order`
- CTAs tienen `text` y `href`
- Imágenes tienen `src` y `alt`

Salida:

```
✅ Todos los checks pasaron.
📋 Campaña válida para prueba interna. Usar --production para validar envío real.
```

Exit code: `0` si la estructura es válida.

---

## Modo production

Uso:

```bash
npm run validate-newsletter -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta --production
```

Validaciones adicionales (además de todas las del modo normal):

| Categoría | Validación | Severidad |
|---|---|---|
| Flags | `isTestCampaign` debe ser `false` | Error |
| Flags | `productionReady` debe ser `true` | Error |
| Remitente | `fromEmail` no vacío | Error |
| Remitente | `fromEmail` sin placeholder | Error |
| Remitente | `fromEmail` con formato de email | Error |
| Metadata | `subjectLine` no vacío | Error |
| Metadata | `preheader` no vacío | Error |
| Metadata | `campaignName` no vacío | Error |
| Metadata | `clientName` no vacío | Error |
| Aprobación | `clientApproved` debe ser `true` (si existe) | Error |
| Aprobación | `legalApproved` debe ser `true` (si existe) | Error |
| Warnings | `metadata.warning` no debe contener términos de "no listo" | Warning |
| CRM baja | href no vacío, no placeholder, absoluto | Error |
| CRM preferencias | href no vacío, no placeholder, absoluto | Error |

Salida (ejemplo con BMW):

```
❌ Errores (6):
  ❌ [PRODUCTION] metadata.isTestCampaign debe ser false (actual: true)
  ❌ [PRODUCTION] metadata.productionReady debe ser true (actual: false)
  ❌ [PRODUCTION] metadata.fromEmail está vacío
  ❌ [PRODUCTION] modules[6].links[1] ("Preferencias"): href contiene placeholder — #placeholder-preferencias
  ❌ [PRODUCTION] modules[6].links[2] ("Darse de baja"): href contiene placeholder — #placeholder-baja
  ⚠️  metadata.warning contiene términos de no apta para producción

📋 Modo production: errores bloqueantes. La campaña no está lista para envío real.
```

Exit code: `1` si hay errores bloqueantes.

---

## Cuándo usar cada modo

| Situación | Modo recomendado |
|---|---|
| Prueba interna del pipeline | Normal |
| Campaña con isTestCampaign: true | Normal |
| Campaña candidata a producción | Production |
| Antes de establecer productionReady: true | Production (debe pasar sin errores) |
| Auditoría previa a envío real | Production + check-links --strict |

## Relación con check-links --strict

Ambos scripts son complementarios y deben usarse juntos como gate de producción:

```bash
# 1. Validar estructura y flags de producción
npm run validate-newsletter -- --campaign <campaign> --production

# 2. Validar enlaces y placeholders CRM
npm run check-links -- --campaign <campaign> --strict

# Solo si ambos pasan (exit 0), la campaña es candidata a envío real
```

## Ejemplos de comandos

```bash
# Modo normal (prueba interna)
npm run validate-newsletter -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta

# Modo production (candidata a envío real)
npm run validate-newsletter -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta --production
```

## Errores comunes en modo production

| Error | Causa | Solución |
|---|---|---|
| `isTestCampaign debe ser false` | La campaña sigue marcada como prueba | Cambiar a `false` |
| `productionReady debe ser true` | La campaña no está lista | Cambiar a `true` tras resolver bloqueos |
| `fromEmail vacío` | Sin remitente | Obtener de CRM/cliente |
| `href contiene placeholder` | Footer con enlaces CRM pendientes | Obtener enlaces reales |
| `warning contiene términos de no apta` | El warning de metadata indica bloqueos | Revisar y limpiar warnings |
