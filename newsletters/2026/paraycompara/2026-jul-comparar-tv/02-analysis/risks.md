# Risks — 2026-jul-comparar-tv

| Riesgo | Mitigación |
|---|---|
| Tentación de claims deportivos ("todo el fútbol", "todos los partidos") — no verificables y varían por operadora | Restricción explícita en requirements.md; 05 autoevalúa contra claim-rules |
| El tema TV podría sugerir imágenes de contenido/canales (logos de terceros, capturas de plataformas) — derechos no aclarados | No usar: solo el set de iconos propio ya en CDN |
| Destino = home genérica, no landing de TV | [Q-004] abierta; UTM content por módulo permite medir si el clic de TV convierte peor |
| Mismos bloqueos de producción heredados (fromEmail, baja/preferencias, dirección) | isTestCampaign:true hasta datos reales |
