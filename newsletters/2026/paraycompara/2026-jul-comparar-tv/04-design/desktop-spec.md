# Desktop spec — 2026-jul-comparar-tv

Por módulo (los valores finos los fija el componente del motor; esta spec fija contenido
visual y verifica ritmo — regla §2 del patrón):

| # | Módulo | Fondo | Alineación | Densidad | Huecos de texto (límite orientativo) |
|---|---|---|---|---|---|
| 1 | hero-asimetrico | primary | Asimétrica (H1 izq / stat der) | Media | h1 ≤ 45 chars, subtitle ≤ 150, stat.number "+30", stat.label "compañías", cta.label ≤ 25 |
| 2 | trust-bar | blanco + pill lila | Centrada | Baja | 3 × text ≤ 28 chars |
| 3 | card-tarifa | blanco | Grid 2×2 | Alta | eyebrow ≤ 25, title ≤ 35, subtitle ≤ 80; por tarjeta: title ≤ 15, body ≤ 60, linkLabel "Ver tarifas" |
| 4 | pasos | blanco | Centrada | Baja | title ≤ 35; por paso: title ≤ 12, body ≤ 45 |
| 5 | lista-premium (3 ítems) | lila | Izquierda | Alta | eyebrow ≤ 25, title ≤ 40; por ítem: title ≤ 25, body ≤ 75 |
| 6 | banda-cierre | deep | Centrada | Media | title ≤ 45, body ≤ 90, cta = mismo del hero |
| 7 | footer | global | Centrada | Baja | (campos legales fijos) |

Ritmo verificado: 1→2 cambia todo; 2→3 fondo+densidad; 3→4 densidad invertida (excepción
documentada del patrón); 4→5 fondo+alineación; 5→6 fondo+densidad; 6→7 fondo+densidad. ✅

Contrastes: esta campaña no introduce NINGUNA combinación texto/fondo nueva — todas las
combinaciones son las de la tabla §5 de patterns/saving.md (recalculadas allí contra tokens
v2.2.2, todas PASS salvo el pendiente conocido cardLinkSecondary, heredado y documentado).
