# Delivery Notes — Audi A6 Sportback e-tron Brand-Native Test

## Resumen de entrega

Campaña de prueba generada para validar las nuevas capacidades brand-native del sistema Hermes.

## Archivos generados

| Archivo | Ruta |
|---------|------|
| HTML fuente | `09-exports/final.html` |
| HTML inline | `09-exports/final-inline.html` (23.0 KB) |
| Build manifest | `09-exports/build-manifest.json` |
| Hero banner | `brands/audi/design-input/hero-banner.png` (pendiente CDN) |

## Estructura final

```
header-logo → hero-imagen → editorial-foto-texto → editorial-foto-texto-inverso → columns-3-beneficios-sin-icono → banda-cierre → footer
```

## Estado de producción

- **isTestCampaign**: true
- **productionReady**: false
- **Imágenes**: todas en placeholder `PENDING-CDN-UPLOAD` — requiere subida manual al CDN
- **Claims**: verificados contra fuente oficial, pero marcados como "pendiente de validación cliente"

## Pendientes para producción

1. Subir hero banner al CDN: `hero-banner.png` → `feebbodigital.com/creativities-library/audi/hero-banner.png`
2. Capturar/subir logo Audi PNG
3. Subir fotos editoriales (exterior + interior)
4. Validar cifras WLTP con el cliente
5. Confirmar URLs de unsubscribe/preferencias reales
6. Establecer `productionReady: true` cuando todos los assets estén en CDN
