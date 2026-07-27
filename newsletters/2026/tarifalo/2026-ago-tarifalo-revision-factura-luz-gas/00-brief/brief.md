# Brief: Tarifalo — 2026-ago-tarifalo-revision-factura-luz-gas

## Información general

| Campo | Valor |
|---|---|
| Cliente | Tarífalo |
| Campaña | 2026-ago-tarifalo-revision-factura-luz-gas |
| Fecha de briefing | 2026-08-01 |
| Estado | briefing |
| Fuente del brief | Usuario (Orchestrator prompt) |

## Objetivo

Animar al usuario a revisar su factura de luz y gas antes de que termine el verano, comparando tarifas para asegurarse de que sigue pagando un precio ajustado a su consumo real. Enfoque práctico, directo y orientado a comparación responsable.

## CTA principal

Comparar ahora

## Enlace principal

https://tarifalo.com/?utm_source=newsletter&utm_medium=email&utm_campaign=2026-ago-tarifalo-revision-factura-luz-gas&utm_content=hero-cta
Estado: VERIFICADO (URL real de Tarifalo, mismo dominio que campañas existentes)

## Audiencia objetivo

Usuarios registrados de Tarífalo con contratos de luz y/o gas. Perfil doméstico interesado en ahorro y revisión de condiciones. Campaña estacional (fin de verano).

## Tono y estilo

Cercano, directo, económico, orientado a comparación y ahorro responsable. Sin alarmismo ni urgencia artificial. Sin promesas de ahorro concreto no verificadas.

## Mensajes clave

- Revisar tu factura antes de que acabe el verano te ayuda a saber si tu tarifa sigue siendo competitiva.
- Comparar luz, gas o ambas es rápido, gratis y sin compromiso.
- Puedes revisar consumo, precio por kWh, permanencia, servicios añadidos y condiciones de renovación.
- Comprueba si tu tarifa sigue compensando — sin compromiso.

## Promociones / Ofertas

Sin promociones ni ofertas confirmadas. No se usan claims de ahorro concreto. Enfoque en revisión informativa, no en captación por precio.

## Referencias visuales

- Brand pack existente: `brands/tarifalo/tokens/brand-tokens.json` v2.2.5
- Color primario: #003049 (azul marino)
- CTA: #F77F00 (naranja)
- Tipografía: Sora (display), Arial fallback
- Hero: hero-marca-tarifalo (fondo navy + gradiente, marca + titular + CTA)
- Referencia de campañas existentes: 2026-jul-comparar-luz-gas, 2026-jul-tarifalo-compara-luz

## Claims prohibidos

- ❌ No usar "ahorra X€" — sin dato confirmado de ahorro concreto
- ❌ No usar "gratuito" como reclamo principal — el comparador es gratis pero no es el foco
- ❌ No crear urgencia artificial ("última oportunidad", "solo hasta...")
- ❌ No prometer resultados específicos sin verificación

## Riesgos detectados

- Assets de iconos están en CDN de Tarifalo (dominio propio), no hay garantía de permanencia
- Placeholders legales sin resolver: `[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]`, dirección física
- `isTestCampaign: true`, no debe enviarse a producción sin validación

## Notas adicionales

- Usar patrón `saving` (mismo que campañas Tarifalo existentes)
- Hero: hero-marca-tarifalo (no requiere cifra ni imagen CDN)
- card-tarifa-3 con 3 ítems: Luz, Gas, Luz+Gas
- lista-premium opcional con 4 puntos de revisión de factura
- CTA naranja en píldora según tokens del brand pack
