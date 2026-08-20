# CTA Options: Mercedes-AMG — C 63 S E PERFORMANCE

## Información general

| Campo | Valor |
|---|---|
| CTA principal del brief | «Configurar el tuyo» |
| Enlace principal | http://amg4.me/configure_c63se_sedan (configurador oficial, 200 sin redirect) |

Regla del brief: 4 CTAs, cada uno con copy distinta según su momento — primero invita a
descubrir, el último invita a configurar/reservar. Ningún string se repite; ningún verbo se
repite entre CTAs (descubrir / sentir / conocer / configurar).

## CTA Principal — Módulo 5 (banda-cierre)

**Enlace:** http://amg4.me/configure_c63se_sedan
**Espacio disponible:** ~30 caracteres (botón block 16/500/ls 0.5px, padding 12px 24px, sin
wrap — verificar ancho en render)

| Opción | Texto | Caracteres | Enfoque | Clasificación |
|---|---|---|---|---|
| A | Configurar el tuyo | 18 | Acción directa (compra/configuración) | Recomendada |
| B | Configura tu AMG | 16 | Acción directa | Alternativa |
| C | Llevarlo a tu medida | 21 | Beneficio | Testing |

### Opción A (recomendada)
**Texto:** Configurar el tuyo
**Caracteres:** 18
**Enfoque:** Acción directa — cierre del arco con verbo de configuración (último CTA = verbo de
acción, regla del brief).
**Riesgos:** Ninguno de claims. Sin nombre de marca (no gasta presupuesto).

### Opción B (alternativa)
**Texto:** Configura tu AMG
**Caracteres:** 16
**Enfoque:** Acción directa con posesivo.
**Riesgos:** «AMG» sin «Mercedes-» no cuenta en el presupuesto de nombre, pero acerca el CTA a
la jerga; A es más limpia.

### Opción C (testing)
**Texto:** Llevarlo a tu medida
**Caracteres:** 21
**Enfoque:** Beneficio (personalización).
**Riesgos:** Más largo → riesgo de wrap en el botón; verificar ancho.

## CTA Secundario 1 — Módulo 2 (hero)

**Enlace:** https://www.mercedes-benz.es/passengercars/models/saloon/c-class/amg.html
**Momento:** primero = invitar a descubrir

| Opción | Texto | Caracteres | Enfoque | Clasificación |
|---|---|---|---|---|
| A | Descubrir la nueva era | 22 | Exploración (descubrir) | Recomendada |
| B | Conocer el C 63 | 16 | Exploración | Alternativa — ❌ gasta uso de «C 63» (presupuesto 3/3) |

### Opción A (recomendada)
**Texto:** Descubrir la nueva era
**Caracteres:** 22
**Enfoque:** Exploración — primer CTA, verbo «descubrir» (regla del brief).
**Riesgos:** Ninguno. Sin marca, sin claims.

## CTA Secundario 2 — Módulo 3 (editorial foto-texto)

**Enlace:** https://www.mercedes-amg.com/en/c-class-sedan
**Momento:** contextual tras la revelación

| Opción | Texto | Caracteres | Enfoque | Clasificación |
|---|---|---|---|---|
| A | Sentir cómo empuja | 18 | Experiencial (sentir) | Recomendada |
| B | Probar la respuesta | 18 | Experiencial | Alternativa |

### Opción A (recomendada)
**Texto:** Sentir cómo empuja
**Caracteres:** 18
**Enfoque:** Experiencial — conecta con «lo notas en la espalda antes de oírlo».
**Riesgos:** Ninguno.

## CTA Secundario 3 — Módulo 4 (editorial foto-texto-inverso)

**Enlace:** https://www.mercedes-amg.com/en/c-class-sedan
**Momento:** contextual tras la pausa técnica

| Opción | Texto | Caracteres | Enfoque | Clasificación |
|---|---|---|---|---|
| A | La batería, al detalle | 22 | Informativo (conocer) | Recomendada |
| B | Saber más de la batería | 23 | Informativo | Alternativa |

### Opción A (recomendada)
**Texto:** La batería, al detalle
**Caracteres:** 22
**Enfoque:** Informativo — tercer verbo de la secuencia (descubrir → sentir → conocer → configurar).
**Riesgos:** Ninguno.

## Resumen

| CTA | Módulo | Opción recomendada | Enlace |
|---|---|---|---|
| Principal | 5 (cierre) | Configurar el tuyo | amg4.me/configure_c63se_sedan |
| Secundario 1 | 2 (hero) | Descubrir la nueva era | mercedes-benz.es/…/amg.html |
| Secundario 2 | 3 (editorial) | Sentir cómo empuja | mercedes-amg.com/en/c-class-sedan |
| Secundario 3 | 4 (editorial) | La batería, al detalle | mercedes-amg.com/en/c-class-sedan |

Los 4 strings son distintos; los 4 verbos son distintos (descubrir / sentir / conocer /
configurar). UTM `{modulo}-cta`: hero-cta, editorial1-cta, editorial2-cta, closing-cta.
