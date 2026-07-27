# Next Steps — 2026-jul-adeslas-seguro-medico

## Inmediatos (orden prioritario)

### 1. ✅ Ejecutar build del motor
```bash
cd /Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final
node engine/build-newsletter.js \
  --data newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/06-data/campaign-data.json \
  --out newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/09-exports/
```

### 2. ✅ Verificar outputs
- [ ] npm run check-engine
- [ ] npm run check-parity
- [ ] npm run check-control-files
- [ ] npm run production-gate-motor

### 3. ✅ Revisar build-manifest.json
- [ ] Correct brand version
- [ ] All 7 modules listed
- [ ] No warnings about unset values

### 4. ✅ Visual review
- [ ] Open final.html in browser
- [ ] Verify color scheme matches brand
- [ ] Check CTA buttons render correctly
- [ ] Verify all sections present in correct order
- [ ] Check mobile responsive layout

## Pendientes del cliente (para productionReady)

- [ ] Obtener logo PNG de Adeslas ({{ADESLAS_LOGO_URL}})
- [ ] Confirmar URL de CTA con UTM ({{CTA_URL}})
- [ ] Confirmar dirección legal de SegurCaixa Adeslas ({{LEGAL_ADDRESS}})
- [ ] Confirmar hero background image ({{HERO_IMAGE_URL}})
- [ ] Confirmar preferencias de unsubscribe/preferences URLs
- [ ] Validar claims comerciales con el equipo legal
- [ ] Revisar copy final con el cliente

## Mejoras futuras

- Investigar photography/iconography con Chrome real sobre segurcaixaadeslas.es (Nivel 3)
- Investigar voice.rhythm en el sitio web de la marca
- Evaluar si la marca se beneficiaría de layout asimétrico en futuras campañas
- Generar hero image con IA si el cliente lo solicita
