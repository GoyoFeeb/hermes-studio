# Production Gate — Gate unificado de producción

## Visión general

`production-gate` ejecuta los 3 gates de producción necesarios para validar si una campaña es candidata a envío real, en un solo comando.

## Comando

```bash
npm run production-gate -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta
```

## Gates que ejecuta (en orden)

| Orden | Script | Flag | Qué valida |
|---|---|---|---|
| 1 | `validate-newsletter` | `--production` | Estructura, metadata flags (isTestCampaign, productionReady, fromEmail), enlaces CRM |
| 2 | `check-links` | `--strict` | Enlaces sintácticos, placeholders de CRM, fromEmail |
| 3 | `validate-claims` | `--production` | Claims prohibidos, técnicos no validados, marketing fuerte |

## Comportamiento

| Resultado | Exit code | Mensaje final |
|---|---|---|
| Todos los gates pasan | 0 | ✅ Campaign is candidate for production, pending final human/client approval. |
| Uno o más gates fallan | 1 | ❌ Campaign is NOT ready for production. Lista de gates fallidos. |

## Ejemplo de salida (BMW, esperado: fallo)

```
❌ validate-newsletter --production
❌ check-links --strict
✅ validate-claims --production

❌ Production gate failed.
   Campaign is NOT ready for production.

   2 gate(s) failed:
     ❌ validate-newsletter --production
     ❌ check-links --strict
```

## Ejemplo de salida (todo OK)

```
✅ validate-newsletter --production
✅ check-links --strict
✅ validate-claims --production

✅ Production gate passed.
   Campaign is candidate for production,
   pending final human/client approval.
```

## Cuándo usarlo

| Situación | Recomendación |
|---|---|
| Al final de QA, antes de export | Ejecutar production-gate |
| Antes de subir HTML a plataforma de envío | Ejecutar production-gate |
| Antes de cambiar productionReady a true | Debe pasar el production-gate |
| Para auditoría de calidad | Ejecutar production-gate |

## Diferencia entre "candidate for production" y "productionReady"

El production-gate verifica aspectos técnicos y de datos que el sistema puede comprobar automáticamente:

- Estructura de campaña correcta
- Flags de producción (isTestCampaign, productionReady)
- Enlaces CRM funcionales (no placeholders)
- Claims aprobados
- fromEmail válido

**No puede verificar:**

- Aprobación comercial/legal del cliente
- Aprobación de marca
- Validación de condiciones financieras por parte del cliente
- Calidad visual en clientes de email reales
- Contenido subjetivo que requiere revisión humana

Por eso el mensaje final dice **"candidate for production, pending final human/client approval"** — el sistema hace su trabajo, pero la decisión final es humana.

## Ejecución individual de gates

Si se quiere ejecutar un gate específico sin el wrapper:

```bash
npm run validate-newsletter -- --campaign <campaign> --production
npm run check-links -- --campaign <campaign> --strict
npm run validate-claims -- --campaign <campaign> --production
```

## Scripts relacionados

| Script | Propósito |
|---|---|
| `production-gate` | Wrapper de los 3 gates de producción |
| `validate-newsletter --production` | Estructura y flags |
| `check-links --strict` | Enlaces y placeholders |
| `validate-claims --production` | Claims prohibidos |
