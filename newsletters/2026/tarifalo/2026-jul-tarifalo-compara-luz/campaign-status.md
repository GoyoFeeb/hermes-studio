# Campaign Status: 2026-jul-tarifalo-compara-luz

| Campo | Valor |
|-------|-------|
| **Estado** | `built` |
| Estado actual | export |
| **Última actualización** | 2026-07-22 |
| **Patrón** | saving |
| **Brand** | Tarífalo (v2.2.3) |
| **isTestCampaign** | true |
| **productionReady** | false |

## Gates superados

- ✅ Schema validation
- ✅ Engine build (27.8 KB inline, 0 warnings)
- ✅ Tag balance
- ✅ Column balance (n/a — no columns-3-beneficios)
- ✅ Claims validation
- ⚠️ Assets: sin verificar en este entorno (sin salida de red al CDN real, ver Gate 5) — `bannerSrc` es
  además un placeholder intencional pendiente de subida real, ver más abajo
- ✅ Parity source/inline
- ✅ Control files sincronizados

## Pendiente para producción

- [ ] **Generar el header con `npm run generate-hero-image -- --brand tarifalo --theme "..."` y subirlo
      al CDN** — hero cambiado de `hero-centrado` a `hero-imagen` el 2026-07-22; `data.bannerSrc`
      es ahora mismo un placeholder (`https://PENDING-CDN-UPLOAD/...`) que NO debe llegar a producción
- [ ] Controlar dirección física del cliente para footer.legalLine
- [ ] Confirmar URLs de baja/preferencias reales (hoy usa [UNSUBSCRIBE_LINK] / [PREFERENCES_LINK])
- [ ] Cambiar isTestCampaign a false y productionReady a true
- [ ] Revisar savings highlight "Ahorra hasta 450 €" — verificar fuente del dato
