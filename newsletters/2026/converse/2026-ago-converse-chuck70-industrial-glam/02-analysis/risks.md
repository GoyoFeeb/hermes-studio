# Risks: Converse — 2026-ago-converse-chuck70-industrial-glam

## Riesgos técnicos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| CDN de Converse (Akamai) devuelve 403 a curl en páginas E imágenes | Alta (build) | Descargar imágenes vía navegador en fase 07 (browser_navigate → asset); las URLs del source-links son válidas en navegador. NO marcar como rotas por 403 de curl |
| Fuentes Proxima Nova de pago | Media | Fallback Arial/Helvetica/sans-serif = stack real de la web. Sin webFont |
| VML de Outlook clásico con arcsize 50% (píldora) vs botón cuadrado real | Baja | Deuda conocida del motor (VML fijo); modern clients y Outlook web/app renderizan el CSS cuadrado correcto (radius 0). Documentado en pack |
| Logo SVG inline del header (currentColor→#000) | Baja | Ya guardado con fill explícito; convertir a PNG en build |
| El navegador dio 502 intermitentes al inicio | Media (fase 07) | Reintentar; alternativas: web_extract para extraer URLs, descarga vía browser_

## Riesgos de contenido / claims

| Riesgo | Severidad | Mitigación |
|---|---|---|
| [Q-001] Material del upper: "piel bruñida" (Detalles) vs "lona de alta densidad" (At a Glance) | Alta (credibilidad) | La copy usa la frase de la propia ficha ("piel bruñida") citando la fuente; confirmar con cliente antes de producción |
| [Q-002] Línea "Solo son zapatillas..." = copy oficial de marca | Media | Requiere OK de Converse; alternativa propia: "La historia la pones tú." |
| "Edición limitada" NO verificado para Industrial Glam | Media | Prohibido usarlo; solo la collab DBZ lo declara (fuera de pieza) |
| Precio/tallas cambian | Media | Revalidar a 48 h del envío; tallas 35–45 verificadas el 2026-08-21 |
| Fecha de drop no publicada | Baja | No se menciona ninguna fecha |

## Riesgos de proceso

| Riesgo | Mitigación |
|---|---|
| Patrón fotografia-primero exige hero-imagen sin fallback | Si el arte no puede obtenerse (CDN 403 + generación falla), el patrón entero se descarta — no se degrada a hero-centrado. Evaluar en fase 07 con el resultado real |
| Primer pack de la marca (first-time onboarding) | Valores [INFERIDOS — PENDIENTES DE CONFIRMACIÓN CLIENTE]; pack validado OK por check-brand-pack-completeness |
| CTA invertido (blanco sobre negro) puede chocar con expectativas de marca | Documentado en pack + changelog como decisión deliberada con fuente (tratamiento real blanco-sobre-negro de la marca) |
