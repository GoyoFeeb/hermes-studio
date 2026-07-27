# Next Steps — 2026-jul-tarifalo-compara-luz

## Inmediatos (QA)

1. ✅ Revisar HTML generado en 09-exports/
2. ✅ Verificar tags balanceados (33/33 — OK)
3. ✅ Verificar assets HTTP 200 (8/8 URLs verificadas)
4. ✅ Revisar claims (29 reglas — OK)
5. [ ] Crear 05-qa/qa-report.md con hallazgos visuales

## Pendientes para producción

1. [ ] **Generar el arte del header y subirlo al CDN** (ver sección "Hero con arte generado" abajo) —
       bloqueante: `data.bannerSrc` es hoy un placeholder, no una URL real
2. [ ] Obtener dirección física de Tarífalo → actualizar footer.legalLine
3. [ ] Confirmar que los iconos de card-tarifa-3 sean los correctos (icono-luz, icono-gas, icono-luzgas)
4. [ ] Añadir savings highlight "Ahorra hasta 450 €" a la newsletter — el hero ya no es hero-centrado,
       pero hero-imagen tampoco tiene campo stat; considerar añadirlo al copy en su lugar
5. [ ] Cambiar isTestCampaign: false y productionReady: true
6. [ ] Configurar URLs de unsubscribe/preferences reales del ESP
7. [ ] Revisar responsive layout en mobile
8. [ ] Previsualizar en clientes de email (Gmail, Outlook, Apple Mail)

## Hero con arte generado (cambiado de hero-centrado a hero-imagen, 2026-07-22)

1. `npm run generate-hero-image -- --brand tarifalo --theme "Compara tarifas de luz — ahorro, azul de marca"`
   — se abrirá solo en Vista Previa al terminar (`HERO_IMG_AUTO_OPEN`, ver `.env.example`).
2. Revisar el arte (paleta Tarífalo, CERO texto dentro) y subirlo al CDN
   (`feebbodigital.com/creativities-library/tarifalo/...`).
3. Sustituir el placeholder en `06-data/campaign-data.json` → `modules[0].data.bannerSrc` por la URL
   https real del CDN.
4. Rebuild: `node engine/build-newsletter.js --data 06-data/campaign-data.json --out 09-exports/`
5. Re-correr `npm run production-gate-motor -- --campaign newsletters/2026/tarifalo/2026-jul-tarifalo-compara-luz`
   para confirmar que el Gate 5 (assets HTTP 200) ya no está en warning.

## Assets pendientes

| Asset | Estado | Notas |
|-------|--------|-------|
| Logo PNG | Pendiente | Solo existe SVG |
| Icono luz (card-1) | Sin verificar en este entorno | icono-luz-hd.png — sin salida de red al CDN real |
| Icono gas (card-2) | Sin verificar en este entorno | icono-gas-hd.png |
| Icono luz+gas (card-3) | Sin verificar en este entorno | icono-luzgas-hd.png |
| Hero background image | **Pendiente — bloqueante** | Placeholder en bannerSrc, ver pasos arriba |
