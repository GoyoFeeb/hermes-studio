# Build Verification — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 07 (HTML Email Developer). Fecha: 2026-08-20.
> Build: `node engine/build-newsletter.js --data …/06-data/campaign-data.json --out …/09-exports/`

## Resultado

| Check | Resultado |
|---|---|
| Build del motor | ✅ BUILD OK (final.html + final-inline.html 19.1 KB + build-manifest.json) |
| Parity fuente/inline | ✅ Sin desviaciones |
| Schema | ✅ (validado en fase 06) |
| Claims | ✅ (validado en fase 06, 29 reglas) |

## Verificación de la salida (inspección del HTML generado)

| Aspecto | Estado | Detalle |
|---|---|---|
| 4 CTAs distintos | ✅ | Descubrir la nueva era / Sentir cómo empuja / La batería, al detalle / Configurar el tuyo |
| Imágenes con `?fm=jpg` | ✅ | 3/3 (hero + 2 editoriales) |
| Copy del cuerpo | ✅ | Verbatim de 05-copy (asunto, preheader, H1, H2, bodies) |
| Presupuesto de marca | ✅ | «C 63» 3 usos (preheader, hero, cierre); «Mercedes-AMG» 3 (header alt, hero brandName, footer) |
| border-radius CTA en CSS | ✅ | `border-radius:0px` (esquina recta de marca) en los 4 CTAs |
| barrita de acento eyebrow | ✅ | 36×3px `#B21E23` con `border-radius:2px` — elemento decorativo del componente, no CTA (intencional) |

## Hallazgos — deudas conocidas del MOTOR (no de la campaña)

### H1. ⚠️ NORMA 600px NO cumplida por el motor (R-13)
- La salida usa **wrapper exterior `width="100%"` con `background-color`** (el fondo de escena se
  expande a todo el ancho) y tablas interiores `width="100%"` con `max-width:600px;margin:0 auto`.
- Esto es EXACTAMENTE el patrón que la NORMA 600px del usuario prohíbe (2026-08-10): cada escena
  incluido su fondo debe ser una tabla `width="600"` centrada con bgcolor en la propia tabla.
- Estado documentado del motor: *«engine/components/*.html still use width="100%" outer tables —
  engine migration PENDING user sign-off; do not build engine campaigns claiming compliance until
  migrated»* (skill newsletter-pipeline, NORMA 600px).
- **Decisión honesta:** esta campaña del motor NO reclama cumplimiento NORMA 600px. Opciones para
  el usuario: (a) aceptar la deuda del motor y validar la pieza como prueba, (b) migrar el motor
  (proyecto aparte, PENDING sign-off), (c) variante standalone a mano (fuera del pipeline engine).
  Verificado además que solo 2 tablas llevan `bgcolor` (`#000000`: hero y cierre, para Outlook);
  el resto de fondos van por CSS inline en `<td>` (funciona en clientes modernos, no garantizado
  en Outlook clásico para secciones).

### H2. VML arcsize 50% en los 4 CTAs (R-09/R-10)
- Los 4 CTAs llevan `arcsize="50%"` en su VML → **en Outlook desktop se verían pastillas** aunque
  el CSS dice `border-radius:0px`.
- Deuda conocida: `cta-bulletproof.html` no tokeniza el arcsize del VML y
  `cta-secondary-bulletproof.html` lo tiene hardcodeado a 50%.
- Impacto en clientes modernos: ninguno (Gmail/Apple/Mobile renderizan el CSS `border-radius:0px`
  correcto). Solo Outlook desktop muestra la pastilla.
- Documentado para QA Outlook (agente 08).

### H3. Logo en PENDING-CDN-UPLOAD
- El header usa `https://PENDING-CDN-UPLOAD/mercedes-amg/logo.png` (requisito del schema).
- El raster local `brands/mercedes-amg/design-input/logo-mercedes-amg-white-588.png` se embebe
  como base64 en el paso post-build (agente 09, DESPUÉS del production-gate — build order trap).
- En Gmail/Outlook el SVG oficial no renderiza; el base64 del PNG sí (excepto Outlook desktop:
  documentado en el skill — verificar visualmente en QA).

### H4. Eyebrow con color token rojo #B21E23 (R-11)
- El motor pinta los eyebrows con `typography.eyebrow.color` del pack = `#B21E23` (rojo AMG).
- Contraste a 11px: 3.11:1 sobre blanco/negro → **falla WCAG AA** (4.5:1). La decisión del agente
  05 (#8F1418 = 6.14:1) NO se aplica automáticamente: el motor lee tokens, no campaign-data.
- El agente 08 ejecutará `check-contrast`; si falla, el fix es actualizar el token del pack
  (`typography.eyebrow.color`) con entrada `_changelog` documentada (mismo criterio que
  Spotify/Worn Wear: decisión de accesibilidad del sistema, no valor observado).

## Notas para QA (agente 08)

- Ejecutar renders (1280/375/320) y verificar: sin overflow horizontal, imagen del hero visible,
  CTAs íntegros (sin wrap), contraste AA (check-contrast), enlaces HTTP 200.
- Outlook: pastillas VML esperadas (H2) — decidir si se aceptan en la campaña de prueba o se
  documenta como bloqueo.
- NORMA 600px: NO verificable en esta build del motor (H1) — documentar el estado, no fingir.
- Tras el production-gate (agente 09): `npm run embed-images` para el logo base64.
