# Layout — 2026-jul-comparar-tv

Agente: 04 Email Designer · 2026-07-21

Parámetros globales (todo trazable a token del brand pack v2.2.2 — mismas rutas que resolverá
el motor):

| Parámetro | Token | Valor |
|---|---|---|
| Contenedor | (fijo del motor, _shell.html) | 600px |
| Fondo exterior | {{token:surfaces.global}} | #F4F3F9 |
| Fondo hero | {{token:colors.primary}} | #5E2E91 |
| Fondo cierre | {{token:colors.deep}} | #3E244D |
| Superficie lila (lista premium, pill trust) | {{token:surfaces.sectionLila}} | #F8F5FC |
| CTA | {{token:colors.ctaBackground}} + typography.cta (19px/700) | #FF5A3C |
| Tipografía | typography.* del pack (h1HeroOnBrand 28px/800/-0.5px, h2Section 22px/800, body 14px/400 #66616A) | — |
| Sombras | shadows.card / shadows.cta ÚNICAMENTE | — |
| Radios | radius.card (18px) | — |

Implementabilidad verificada: los 7 módulos de structure.md corresponden 1:1 a componentes
reales de engine/components/ y ningún valor de esta spec exige nada fuera de lo que esos
componentes renderizan. Cero hallazgos para 07.
