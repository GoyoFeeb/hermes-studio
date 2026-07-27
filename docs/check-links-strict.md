# Check Links — Modo normal y modo strict

## Visión general

`check-links` valida los enlaces definidos en `newsletter-data.json` de una campaña: CTAs, enlaces de footer e imágenes.

Tiene dos modos de ejecución:

| Modo | Flag | Comportamiento | Exit code esperado |
|---|---|---|---|
| Normal | (sin flag) | Valida sintaxis, permite placeholders, muestra warnings | 0 si no hay errores sintácticos |
| Strict | `--strict` | Valida sintaxis + rechaza placeholders CRM + rechaza fromEmail vacío | 0 solo si todo es válido para producción |

## Modo normal (por defecto)

Uso:

```bash
npm run check-links -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta
```

Validaciones:

- href vacío → error
- href `#` o `null` → error
- href con `[PENDIENTE]` → error
- URL no absoluta → error
- Imagen sin alt → error
- Placeholder de CRM (`#placeholder-*`, `[TODO]`, `[FIXME]`) → **warning** (no bloquea)
- fromEmail vacío → **no se comprueba** (permite pruebas internas)

Salida:

```
✅ Sin errores críticos. Solo warnings menores.
⚠️  Validación sintáctica/offline correcta. Los placeholders siguen pendientes y bloquearán el modo --strict.
```

Exit code: `0` si no hay errores sintácticos.

---

## Modo strict

Uso:

```bash
npm run check-links -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta --strict
```

Validaciones adicionales (además de todas las del modo normal):

| Validación | Detalle |
|---|---|
| href con `#placeholder-*` | Error: placeholder de CRM |
| href con `[PENDIENTE]`, `[TODO]`, `[FIXME]` | Error: placeholder pendiente |
| `fromEmail` vacío | Error: debe definirse antes de producción |
| `fromEmail` con placeholder | Error: debe ser una dirección real |

Salida:

```
❌ Errores (3):
  ❌ [STRICT] metadata.fromEmail está vacío
  ❌ [STRICT] Enlace → Preferencias: modules[6].links[1].href contiene placeholder — #placeholder-preferencias
  ❌ [STRICT] Enlace → Darse de baja: modules[6].links[2].href contiene placeholder — #placeholder-baja

📋 Modo strict: errores bloqueantes detectados. La campaña no está lista para producción.
```

Exit code: `1` si hay errores bloqueantes.

---

## Cuándo usar cada modo

| Situación | Modo recomendado |
|---|---|
| Prueba interna del pipeline | Normal |
| Campaña con isTestCampaign: true | Normal |
| Campaña candidata a producción | Strict |
| Antes de establecer productionReady: true | Strict (debe pasar sin errores) |
| Auditoría de calidad previa a envío | Strict |

## Ejemplos de comandos

```bash
# Modo normal (prueba interna)
npm run check-links -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta

# Modo strict (candidata a producción)
npm run check-links -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta --strict

# Con verificación online
npm run check-links -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta --online

# Strict + online
npm run check-links -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta --strict --online
```

## Errores comunes en modo strict

| Error | Causa | Solución |
|---|---|---|
| `[STRICT] metadata.fromEmail está vacío` | fromEmail no definido en JSON | Obtener fromEmail real de CRM/cliente |
| `[STRICT] ... href contiene placeholder — #placeholder-*` | Footer con enlaces CRM pendientes | Obtener enlaces reales de baja/preferencias de CRM |
| `[STRICT] ... href contiene placeholder — [PENDIENTE]` | Campo obligatorio sin valor | Rellenar con URL real o vacío `""` si es opcional |

## Limitaciones

- El modo strict solo valida el contenido del JSON. No verifica que los enlaces reales sean funcionales (para eso está `--online`).
- El modo strict no puede obtener aprobación comercial/legal del cliente. Ese proceso queda fuera del sistema.
- Si `fromEmail` no existe en el JSON (campo ausente vs vacío), el strict mode lo detecta igualmente como indefinido.
