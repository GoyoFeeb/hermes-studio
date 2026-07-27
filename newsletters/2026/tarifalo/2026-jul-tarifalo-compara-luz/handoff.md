# Handoff — 2026-jul-tarifalo-compara-luz

| Campo | Valor |
|-------|-------|
| **From** | Agente de construcción (engine) |
| **To** | Siguiente agente / QA / revisión humana |
| **Fecha** | 2026-07-22 |

## Contexto

Campaña de email centrada en la comparación de tarifas de luz mediante Tarífalo. Adaptada al patrón `saving` con hero-imagen (arte generado por IA + titular/CTA en HTML, cambiado desde hero-centrado el 2026-07-22 a petición del usuario), trust-bar, card-tarifa-3, pasos, banda-cierre y footer.

## Files entregados

- `00-brief/brief.md` — Brief completo de campaña
- `04-copy/copy.md` — Copy con 5 subject lines y 5 preheaders
- `06-data/campaign-data.json` — Datos de campaña validados contra schema
- `09-exports/final.html` — HTML fuente
- `09-exports/final-inline.html` — HTML con CSS inline (27.8 KB)
- `09-exports/build-manifest.json` — Manifiesto de build

## Acciones requeridas

1. **Generar el arte del hero con `npm run generate-hero-image` y subirlo al CDN — bloqueante,
   `bannerSrc` es hoy un placeholder** (ver next-steps.md, sección "Hero con arte generado")
2. Confirmar dirección física de Tarífalo para footer.legalLine
3. Verificar que los 3 iconos PNG en card-tarifa-3 son los correctos para luz
4. Revisar claims de trust-bar con el cliente
5. Confirmar savings amount "Ahorra hasta 450 €" con fuente verificable

## Constraints

- Marca no tiene logo PNG (solo SVG)
- isTestCampaign: true — no enviar a producción sin cambiar a false
- Footer usa [UNSUBSCRIBE_LINK] y [PREFERENCES_LINK] — placeholder de ESP
- `data.bannerSrc` del hero es un placeholder (`https://PENDING-CDN-UPLOAD/...`) — nunca debe
  llegar a producción sin sustituirse por la URL real del CDN

## Riesgos

- hero-imagen tampoco muestra cifra de ahorro (el stat está en el copy pero no en el componente
  — falta variante de hero con stat para marcas sin cifra confirmada, igual que con hero-centrado)

## Expected output

- QA report (05-qa/qa-report.md)
- Aprobación de control files
