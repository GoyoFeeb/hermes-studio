# Brief — 2026-jul-comparar-tv

Fecha: 2026-07-21 · Agente: 01 Briefing Strategist · Fuente: brief mínimo del usuario
(prompt 26, F5) + datos ya validados en materiales existentes de la marca.

## Cliente

Para y Compara — comparador independiente de tarifas de fibra, móvil y televisión.
Brand pack existente: `brands/paraycompara/tokens/brand-tokens.json` v2.2.2.

## Objetivo

Que el suscriptor compare tarifas de televisión (canales, plataformas, fútbol) en el
comparador antes de contratar o renovar su servicio de TV.

## CTA principal

- Texto: "Comparar tarifas"
- URL base: `https://paraycompara.com/` (con UTM por módulo, convención del sistema)

## Ángulo

Televisión y fútbol: quien quiere canales, plataformas y fútbol puede comparar las opciones
en un solo sitio en vez de revisar operadora a operadora.

## Datos confirmados utilizables (con fuente)

| Dato | Fuente de validación |
|---|---|
| "+30 compañías" | Cifra de marca validada (hero de la pieza premium, 15 rondas) |
| "Canales, plataformas y fútbol en una misma comparativa" | Copy validado (tarjeta TV de la pieza premium) |
| "Comparador independiente", "Ahorra tiempo y dinero", "100% gratuito" | Trust bar validada |
| Catálogo de 4 tipos de tarifa (Móvil, Fibra, Fibra+Móvil, Televisión) con su copy | Tarjetas validadas |
| Proceso en 3 pasos (Selecciona/Compara/Decide) con su copy | Pasos validados |
| 8 iconos PNG en CDN (`https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`) | HTTP 200 verificado (piloto, "Assets CDN completado") |
| "Reunir varios servicios en una tarifa puede ayudarte a ahorrar" | Lista premium validada |
| "Revisa permanencia y posibles costes adicionales" | Lista premium validada |

## Restricciones

- Sin precios ni promociones (ninguno confirmado para esta campaña).
- Sin claims de contenido deportivo específico (qué partidos incluye cada tarifa varía por
  operadora — no afirmable en genérico).
- Prueba interna: `isTestCampaign: true`, `productionReady: false` hasta datos reales del
  cliente (mismos bloqueos que campañas anteriores).
