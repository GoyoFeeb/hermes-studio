# Next Steps

## Fase actual

HTML Email Development — Pendiente de build

## Próximas acciones

- [ ] **AGENTE 07**: Ejecutar build del motor
- [ ] **AGENTE 08**: QA completo (visual, responsive, links, Outlook, contraste, production-gate)
- [ ] **AGENTE 09**: Export Manager — producción final, validación de assets, delivery notes

## Bloqueos para producción

### 🔴 Assets CDN
- [ ] Generar banner del BMW M4 Competition Coupé y subir a CDN (sustituir `PENDING-CDN-UPLOAD`)
- [ ] Capturar logo BMW de bmw.es y subir a CDN (sustituir `PENDING-BMW-LOGO`)

### 🔴 Placeholders legales
- [ ] Sustituir `[UNSUBSCRIBE_LINK]` por URL real de baja del ESP
- [ ] Sustituir `[PREFERENCES_LINK]` por URL real de preferencias del ESP
- [ ] Sustituir `[DIRECCIÓN FÍSICA — pendiente del cliente]` por dirección legal real

### 🟡 Cierre de producción
- [ ] Cambiar `isTestCampaign` a `false`
- [ ] Cambiar `productionReady` a `true`
- [ ] Regenerar con el motor
- [ ] Ejecutar `npm run production-gate` hasta exit 0
- [ ] Obtener aprobación humana final

## Discrepancias documentadas (13, ver brand-analysis.md para detalle)
- Azul BMW: guía pide #0066B1 → brand pack tiene #1C69D4 (observado de bmw.es, #0066B1 fue rechazado como inventado)
- Tipografía: guía pide BMW Type Next/Helvetica Neue → pack usa Titillium Web (sustituto para email)
- Hero H1 tamaño: guía pide 60-72px → pack tiene 32px (email width 600px)
- Botón border-radius: guía pide 0px → pack tiene 3px
- Pesos tipografía: guía pide solo 300/400/500 → pack incluye 700
- etc. (ver brand-analysis.md tabla completa)
