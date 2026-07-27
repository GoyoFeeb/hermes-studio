# Body copy — 2026-jul-comparar-tv

Módulo a módulo, en el orden de structure.md. (V) = copy validado reutilizado literal.

## 1. hero-asimetrico
- h1: "Compara tarifas de televisión" (30 chars ≤ 45 ✓)
- stat: number "+30" (V), label "compañías" (V)
- subtitle: "Canales, plataformas y fútbol: compara las opciones de más de 30 compañías y elige la que mejor encaja contigo. Gratis y sin complicaciones." (141 ≤ 150 ✓)
- cta: "Comparar tarifas" (V)

## 2. trust-bar (V, literal)
- "Comparador independiente" · "Ahorra tiempo y dinero" · "100% gratuito"

## 3. card-tarifa
- eyebrow: "QUÉ PUEDES COMPARAR" (V)
- title: "Televisión, fibra o todo en uno" (31 ≤ 35 ✓ — adaptación del validado "Móvil, fibra o todo en uno" al orden temático)
- subtitle: "Cuatro tipos de tarifa y más de 30 compañías, en un solo comparador." (V)
- Tarjeta 1 — Televisión: "Canales, plataformas y fútbol en una misma comparativa." (V)
- Tarjeta 2 — Fibra + Móvil: "Reúne tus servicios en una sola tarifa." (V)
- Tarjeta 3 — Fibra: "Compara velocidad, precio y condiciones." (V)
- Tarjeta 4 — Móvil: "Datos y llamadas adaptados a tu consumo." (V)
- linkLabel (todas): "Ver tarifas" (V)

## 4. pasos (V, literal)
- eyebrow "EN 3 PASOS", title "Tres pasos, sin complicaciones"
- 01 Selecciona — "Elige el tipo de tarifa."
- 02 Compara — "Revisa precio, cobertura y condiciones."
- 03 Decide — "Escoge la opción que mejor encaja contigo."

## 5. lista-premium (3 ítems)
- eyebrow: "ANTES DE ELEGIR" · title: "Tres cosas que conviene revisar" (30 ≤ 40 ✓)
- Ítem 1 — "Paquetes combinados": "Reunir varios servicios en una tarifa puede ayudarte a ahorrar." (V)
- Ítem 2 — "Cobertura en tu zona": "Comprueba qué operadoras funcionan mejor en tu zona." (V)
- Ítem 3 — "Condiciones": "Revisa permanencia y posibles costes adicionales." (V)

## 6. banda-cierre
- title: "Tu tarifa de televisión, en menos de 5 minutos" (46 — excede el límite de 45 en 1 char; riesgo aceptado y documentado: mismo esqueleto que el validado "Tu próxima tarifa, en menos de 5 minutos", cabe en 1 línea a 600px según el fix tipográfico móvil ya validado)
- body: "Compara canales, plataformas y precios, y decide sin compromiso." (65 ≤ 90 ✓)
- cta: "Comparar tarifas" (mismo del hero, regla del patrón)

## 7. footer (V, literal de la pieza validada)
- brandName "Para y Compara" · tagline "Comparador independiente de tarifas de fibra, móvil y televisión."
- disclosure "Recibes este correo porque te registraste en Para y Compara."
- legalLine "© 2026 Para y Compara. [DIRECCIÓN FÍSICA — pendiente del cliente]"

## Autoevaluación de claims (contrato de 05, previa a la entrega)

Escaneado todo el copy contra las 29 reglas de scripts/lib/claim-rules.ts: 0 críticos, 0
altos, 0 medios. Notas: "sin complicaciones"/"sin compromiso" no son reglas de la lista (y
ambos vienen de copy validado); no hay "garantizado", comparativos "mejor que", urgencias ni
claims técnicos. Consistencia asunto→preheader→h1→CTA: los 4 hablan de comparar tarifas de TV.
