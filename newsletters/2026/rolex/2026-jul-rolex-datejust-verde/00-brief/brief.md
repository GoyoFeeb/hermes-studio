# Brief — Rolex Datejust "Una fecha para recordar"

## Información general

| Campo | Valor |
|-------|-------|
| Cliente | Rolex |
| Campaña | 2026-jul-rolex-datejust-verde |
| Modelo | Oyster Perpetual Datejust (esfera verde oliva, acero y oro Everose — variante observada en rolex.com) |
| Fecha | 2026-07-25 |
| Origen | Campaña de prueba de estrés del motor, iniciada directamente en Cowork (sin brief de cliente real) — ver `pipeline-skill/references/public-source-campaign-pattern.md`, mismo patrón que la campaña BMW X1. |
| isTestCampaign | true |

## Por qué esta marca (contexto de la campaña)

Rolex se eligió deliberadamente por ser una marca "muy demandante": identidad tipográfica y fotográfica extremadamente cuidada, cero tolerancia a un tratamiento genérico, composición editorial asimétrica real, ausencia total de iconografía decorativa, y CTA de forma muy específica (pastilla, nunca texto ni bloque). El objetivo explícito de esta campaña es ejercitar en un solo caso real todos los mecanismos añadidos al motor en la ronda anterior: `@font-face` real por marca, jerarquía y vocabulario de formas de CTA, fotografía real (`usesRealPhotography`) frente a ilustración, ritmo estructural asimétrico y variantes de módulo sin icono.

## Objetivo

Generación de interés/deseo de marca para el Datejust. No es venta directa (Rolex no vende online en la mayoría de mercados) — el CTA invita a descubrir el modelo y localizar un distribuidor oficial, no a comprar directamente.

## CTA Principal

- Texto propuesto: "Descubrir el Datejust" (evita verbos de compra directa, coherente con que Rolex no tiene checkout online)
- Enlace: `https://www.rolex.com/es/watches/datejust` — página oficial del modelo, página fuente de toda la investigación de marca de esta campaña
- Naturaleza: descubrimiento/deseo de marca, no transaccional

## Tono y estilo

Editorial, atemporal, aspiracional, formal (usted). Sin lenguaje promocional, sin urgencia, sin descuentos ni ofertas — coherente con el posicionamiento de lujo real observado en rolex.com (cero mención de precio en la página de producto).

## Restricciones

- NO inventar precios, referencias de catálogo, disponibilidad ni cifras técnicas (calibre, reserva de marcha, resistencia al agua) no confirmadas directamente en la página fuente.
- NO usar claims comerciales sin verificar (ver `scripts/lib/claim-rules.ts`).
- Campaña de prueba — no requiere dirección física real, fromEmail funcional ni enlaces de baja/preferencias reales.
- El CTA no debe usar verbos de compra directa ("compra", "reserva", "pide") — Rolex dirige a "localizador de distribuidores", no a un carrito.
- Todas las imágenes deben ser propias de Rolex (generadas con tratamiento fotográfico real observado, o de la web oficial), nunca placehold.co ni genéricas.

## Audiencia

Perfil aspiracional alto: interés en relojería de lujo, coleccionismo, regalo de alto valor. Mercado español (rolex.com/es).

## Competencia / Contexto

Relojería de lujo suiza. Competidores directos: Omega, Patek Philippe, Cartier. Diferenciador Rolex: posicionamiento de "icono atemporal" más que de novedad estacional — el copy real de la marca habla de historia (1945) y símbolo, no de features nuevas.
