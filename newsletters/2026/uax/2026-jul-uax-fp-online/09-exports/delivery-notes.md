# Delivery Notes: UAX — FP Online (migración al motor)

| Campo | Valor |
|---|---|
| Cliente | UAX (Universidad Alfonso X el Sabio) |
| Campaña | 2026-jul-uax-fp-online |
| Fecha | 2026-07-22 |
| Versión | 2.0.0 (reemplaza 1.0.0, fuera del motor — ver `engine/CHANGELOG.md`) |
| Estado | ✅ Reconstruida por el motor, gate 8/8 (1 warning declarado, no bloqueante) |

## Por qué se reconstruyó

El usuario reportó columnas y tarjetas desalineadas. La investigación encontró que esta
campaña nunca había pasado por `engine/build-newsletter.js`: su `campaign-data.json` usaba una
forma antigua y su `final.html` estaba escrito a mano. Se reconstruyó completa: brand pack
nuevo, patrón de género nuevo (`institutional`), 5 componentes nuevos del motor y un guardarraíl
de código nuevo para que el bug concreto (badge dentro de una sola columna + copy desequilibrado
entre columnas) sea estructuralmente imposible de repetir. Detalle completo en
`engine/CHANGELOG.md` (entrada 2026-07-22) y `task-log.md` de esta campaña.

## Resultado del production gate (`production-gate-motor.ts`)

| Gate | Resultado |
|---|---|
| 0. engine-integrity | ✅ |
| 1. schema | ✅ |
| 2. parity (pre-build) | ✅ |
| 3. build | ✅ |
| 4. claims (29 reglas) | ✅ 0 detectados |
| 5. assets HTTP 200 | ⚠️ Sin verificar — el sandbox de esta sesión no tiene salida de red a `www.uax.com` (`getaddrinfo EAI_AGAIN`). Declarado explícitamente, no asumido como roto ni como OK. **Verificar desde un entorno con red antes de enviar.** |
| 6. control-files | ✅ |
| 7. column-balance (nuevo) | ✅ 16/15/16 palabras, ratio 1.07x (límite 1.6x) |

## Módulos (8)

Header (logo), Hero, Introducción+CTA, Beneficios (3 columnas), Grid de categorías (5, en
filas de 3+2), Respaldo/credibilidad (3 tarjetas + insignia), CTA final, Footer.

## Enlaces incluidos

| CTA | Texto | URL (sin UTM, se añade `utm_content` por módulo) |
|---|---|---|
| Hero | Descubre tu titulación | https://www.uax.com/fps/online |
| Introducción | Descubre tu titulación | https://www.uax.com/fps/online |
| Grid de categorías | Ver todas las titulaciones | https://www.uax.com/fps/online |
| CTA Final | Descubre tu titulación | https://www.uax.com/fps/online |
| Unsubscribe | — | `[UNSUBSCRIBE_LINK]` (merge-tag ESP) |
| Preferencias | — | `[PREFERENCES_LINK]` (merge-tag ESP) |

## Limitaciones conocidas (ver `next-steps.md` para el detalle con responsables)

- Enlaces de baja/preferencias con merge-tags, pendientes de la plataforma de envío real.
- `legalLine` con placeholder `[DIRECCIÓN FÍSICA — pendiente del cliente]`.
- Condiciones exactas de "50% de la matrícula*" pendientes de verificar con el cliente.
- Gate 5 (assets) no verificado por falta de red en este entorno — ver tabla arriba.
- `metadata.isTestCampaign: true`, `productionReady: false` mientras lo anterior siga abierto.

## Notas técnicas

- ✅ Etiquetas HTML balanceadas (33 `<table>`/`</table>`, 54 `<tr>`/`</tr>`, 61 `<td>`/`</td>`, verificado)
- ✅ 0 placeholders `{{...}}` sin resolver en el HTML final
- ✅ VML bulletproof buttons en todas las CTAs para Outlook
- ✅ Responsive vía `@media (max-width: 599px)` con clases stack (heredado de `_shell.html`)
- ✅ Contrastes WCAG calculados para el pack de UAX — tabla completa en `patterns/institutional.md` §5
- ✅ Las 3 columnas de beneficios verificadas en ratio de palabras (1.07x) por `check-column-balance.ts`
- ✅ El grid de 5 categorías queda en filas de 3+2, ambas con columnas del mismo ancho (33%) — verificado en el HTML generado
