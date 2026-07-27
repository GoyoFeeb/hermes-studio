# Visual QA (desktop 600) — 2026-jul-comparar-tv

Agente: 08 QA Specialist · 2026-07-21 · Evidencia: render-600.png, render-600-dark.png

| Sección | Resultado | Nota |
|---|---|---|
| Hero asimétrico | ✅ | H1 izq 2 líneas + stat "+30 COMPAÑÍAS" der, CTA naranja 19px, composición idéntica al sistema validado |
| Trust bar | ✅ | Pill lila, 3 claims con check |
| Tarjetas 2×2 | ✅ | Orden temático TV/Convergente/Fibra/Móvil, franja de acento, sombras solo en tarjetas |
| Pasos | ✅ | 3 círculos numerados con halo, sin sombra (disciplina G7) |
| Lista premium (3 ítems) | ✅ | Fondo lila, cabecera a la izquierda, 3 tarjetas con badge — el componente admite 3 sin degradarse (primera vez que se usa con 3 en vez de 4: verificado OK) |
| Banda de cierre | ✅ | Título en 2 líneas a 600px ("Tu tarifa de televisión, en menos de 5 minutos", 46 chars — el riesgo documentado por 05; legible y equilibrado, severidad baja, registrado sin bloquear) |
| Footer | ✅ | Marca, tagline, disclosure, baja/preferencias, legal |
| Modo oscuro | ✅ | render-600-dark.png byte-idéntico a render-600.png — metas light funcionando (G8.1) |
| Iconos CDN | ⚠️ esperado | Placeholder por allowlist de red del sandbox — igual que en la pieza validada, no cuenta como diferencia (regla del prompt 14) |
