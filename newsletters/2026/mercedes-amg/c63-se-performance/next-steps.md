# Next Steps

## Fase actual

export

## Próximas acciones

- [ ] Revisión visual del usuario del preview final (con logo) — en curso
- [ ] Decisión de cierre: campaña de prueba (completed) vs esperar Q-001..Q-005 para producción
- [ ] Cliente: subir logo PNG al CDN (Gmail web bloquea data URIs) y línea legal WLTP ES (Q-005)
- [ ] Migración del motor NORMA 600px (H1) + VML arcsize (H2) — proyecto aparte, PENDING

## Dependencias

- Cliente/legal: Q-001 (precio ES), Q-002 (disponibilidad ES), Q-003 (Vmax), Q-004
  (superlativo), Q-005 (línea legal WLTP ES)
- Mientras Q-001..Q-005 estén abiertos: la campaña puede avanzar como prueba
  (isTestCampaign:true, productionReady:false); el cierre de producción espera al menos
  Q-005 (legal footer)

## Notas

- Los assets de imagen (hero, tren motriz, batería) ya están verificados HTTP 200 y usan
  `?fm=jpg` — no hace falta generar nada con IA.
- El logo oficial rasterizado vive en brands/mercedes-amg/design-input/
  (logo-mercedes-amg-white-588.png); assets.logo del pack apunta al SVG oficial.
