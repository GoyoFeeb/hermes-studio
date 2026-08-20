# Outlook QA — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 08 (Email QA Specialist). Fecha: 2026-08-20. Análisis estático del HTML (sin cliente
> Outlook real en este entorno — verificación por inspección del marcado VML).

## Verificación del marcado VML

| Elemento | Estado | Detalle |
|---|---|---|
| CTAs (4) | ⚠️ Deuda conocida H2 | Todos llevan `v:roundrect arcsize="50%"` → **pastilla** en Outlook desktop aunque el CSS dice `border-radius:0px`. Deuda del motor: `cta-bulletproof` no tokeniza el arcsize del VML y `cta-secondary-bulletproof` lo tiene hardcodeado a 50% |
| Fondos de escena oscuros | ✅ | Hero y cierre llevan `bgcolor="#000000"` (2 tablas) — Outlook los pinta. El resto de fondos van por CSS inline en `<td>`: en Outlook clásico el soporte de background-color en td es fiable, pero la NORMA 600px (bgcolor en la tabla de escena) no se cumple por deuda H1 |
| Imágenes | ✅ | Con `width`/`height` explícitos (150, 600, 276) — Outlook respeta las dimensiones |
| Fuentes | ✅ | Arial/Helvetica (email-safe, sin @import) — MBCorpo S no se embebe (decisión del pack) |
| color-scheme | ✅ | Forzado a light (darkMode not-implemented) — sin inversión agresiva |

## Riesgo aceptado

- **Pastillas en Outlook desktop (H2):** impacto visual solo en Outlook clásico; Gmail/Apple
  Mail/mobile renderizan el CSS correcto (esquina recta). Aceptado como deuda del motor para
  esta campaña de prueba. Mitigación futura: tokenizar el arcsize del VML primario y corregir
  el hardcode del secundario (pendiente del motor).
- **Logo:** el base64 del PNG renderiza en Outlook desktop (a diferencia de Gmail web, que
  bloquea data URIs — documentado en el skill). Pendiente del embed (agente 09).

## Veredicto

✅ Aceptable para prueba con las deudas H1/H2 documentadas. Para producción (si el cliente exige
Outlook perfecto): resolver el arcsize del VML en el motor antes del cierre.
