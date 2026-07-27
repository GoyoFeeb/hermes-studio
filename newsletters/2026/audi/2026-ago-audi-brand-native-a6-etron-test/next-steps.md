# Next Steps

## Pendientes para producción real

| ID | Tarea | Responsable | Estado |
|----|-------|-------------|--------|
| 1 | Subir hero-banner.png al CDN (feebbodigital.com/creativities-library/audi/) | Manual | Pendiente |
| 2 | Capturar/subir logo Audi PNG | Manual | Pendiente |
| 3 | Subir fotos editoriales (a6-etron-diseno.jpg, a6-etron-interior.jpg) al CDN | Manual | Pendiente |
| 4 | Validar cifras WLTP con el cliente | Cliente Audi | Pendiente |
| 5 | Confirmar URLs unsubscribe y preferencias reales | Cliente Audi | Pendiente |
| 6 | Actualizar campaign-data.json con URLs CDN reales | 06 | Cuando assets estén listos |
| 7 | Reconstruir con `npm run build-newsletter` | 07 | Tras paso 6 |
| 8 | Cambiar isTestCampaign: false, productionReady: true | 09 | Tras QA en producción |
| 9 | Ejecutar production-gate con exit 0 | 09 | Tras paso 8 |

## Bloqueos conocidos
- Audi.es devuelve HTTP 503 desde este entorno — las URLs de CTA no son verificables aquí
- Assets PENDING-CDN-UPLOAD bloquean Gate 5 (esperado para test)
- Claims "potencia" y "consumo" requieren validación cliente (Gate 4)
