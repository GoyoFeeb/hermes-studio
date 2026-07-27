# Delivery notes — 2026-jul-comparar-tv

Agente: 09 Export Manager · 2026-07-21

## Archivos exportados (rutas exactas desde la raíz del proyecto)

| Archivo | Ruta |
|---|---|
| HTML fuente | `newsletters/2026/paraycompara/2026-jul-comparar-tv/09-exports/final.html` |
| HTML para envío (CSS inline) | `newsletters/2026/paraycompara/2026-jul-comparar-tv/09-exports/final-inline.html` (36.7 KB) |
| Manifest del build (hashes, versión de brand pack, patrón, conteos) | `newsletters/2026/paraycompara/2026-jul-comparar-tv/09-exports/build-manifest.json` |

Los hashes sha256 de data/fuente/inline, la versión del brand pack (2.2.2) y el patrón usado
(saving) están en el manifest — no se repiten aquí (el manifest ES la prueba de qué se construyó).

## Verificaciones

- Production gate (motor): **6/6 gates ✅** (schema, paridad pre-build, build, claims 29 reglas,
  assets, control files).
- Assets HTTP 200: **no verificado en este entorno** — sin salida de red al CDN
  (`getaddrinfo EAI_AGAIN`); el gate lo distingue de un asset roto y lo reporta como aviso.
  Los 8 iconos + logo fueron verificados HTTP 200 durante la campaña piloto ("Assets CDN
  completado"); re-verificar desde un entorno con red antes del envío real.
- QA: APROBADO (0 críticos/altos; 2 registros medios/bajos en `08-qa/final-checklist.md`).

## Bloqueos de producción (pendientes del cliente — heredados, ver next-steps.md)

1. fromEmail/fromName reales · 2. Enlaces reales de baja/preferencias · 3. Dirección física
legal · 4. `isTestCampaign` → false y `productionReady` → true tras aprobación.

## Limitaciones conocidas

- Sin verificación en Outlook/Litmus real (sin acceso en el entorno — advertencia, no aprobación).
- Título de la banda de cierre ocupa 2 líneas en 600px (riesgo aceptado, documentado por 05 y 08).
