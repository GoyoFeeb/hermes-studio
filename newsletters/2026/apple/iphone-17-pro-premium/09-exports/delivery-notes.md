# Delivery Notes — iPhone 17 Pro Premium

## Resumen

Newsletter premium para el iPhone 17 Pro con dirección creativa inspirada en Apple. Patrón **fotografia-primero**. Concepto: **"Cada encuadre importa."**

## Archivos generados

| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| `09-exports/final.html` | HTML fuente con CSS en cabecera | 4.7 MB (con base64) |
| `09-exports/final-inline.html` | HTML con CSS inline (listo para enviar) | 4.7 MB (con base64) |
| `09-exports/build-manifest.json` | Manifiesto del build (hashes, timestamp) | — |

## Imágenes generadas

| Imagen | Archivo | Dimensiones | Uso |
|--------|---------|-------------|-----|
| Hero banner | `brands/apple/design-input/hero-banner.png` | 1200×675px | Banner principal del hero |
| Cámaras detalle | `brands/apple/design-input/editorial-camaras.png` | 1024×1024px | Editorial foto+texto (cámaras) |
| Zoom resultado | `brands/apple/design-input/editorial-zoom.png` | 1024×1024px | Editorial texto+foto (zoom) |
| Logo Apple | `brands/apple/design-input/logo-apple.png` | 200×140px | Header y marca |

## Pendientes para producción

1. **CDN upload**: Subir las imágenes a un CDN y actualizar las URLs en `campaign-data.json` (reemplazar `https://PENDING-CDN-UPLOAD/apple/...` por las URLs reales)
2. **Verificar URLs**: Las URLs de apple.com/iphone-17-pro/ con utm params funcionan correctamente
3. **fromEmail**: Actualizar con la dirección de envío real (actualmente `newsletter@apple.com`)
4. **Legal**: Sustituir `[DIRECCIÓN FÍSICA]` y `[UNSUBSCRIBE_LINK]` con los valores reales
5. **Pruebas en cliente de email**: Probar en Gmail, Apple Mail, Outlook, y cliente móvil

## Estructura de la newsletter

```
┌──────────────────────────────┐
│         HEADER               │ — Logo Apple + "iPhone 17 Pro"
├──────────────────────────────┤
│       HERO IMAGEN            │ — Banner Cosmic Orange, fondo negro
│       "Cada encuadre importa"│ — H1 44px blanco
│       [Descubrir]            │ — CTA azul #0071E3
├──────────────────────────────┤
│   INTRO + CTA                │ — "Diseñado para crear sin límites."
├──────────────────────────────┤
│   EDITORIAL FOTO+TEXTO       │ — Cámaras: 3 lentes 48MP, 8 distancias focales
├──────────────────────────────┤
│   EDITORIAL TEXTO+FOTO       │ — Zoom 8× calidad óptica a 200mm
├──────────────────────────────┤
│   MÉTRICAS                   │ — 48MP | 8× | A19 Pro | 39h
├──────────────────────────────┤
│   BENEFICIOS (3 cols)        │ — Cámaras | Rendimiento | Diseño
├──────────────────────────────┤
│   BANDA DE CIERRE            │ — iPhone 17 Pro. Cada encuadre importa.
├──────────────────────────────┤
│         FOOTER               │ — Legal, baja, preferencias
└──────────────────────────────┘
```

## Resultados production gate

✅ 12/12 gates passed
- engine-integrity: ✅
- schema: ✅
- parity: ✅
- build: ✅
- claims: ✅
- assets: ✅ (placeholders esperados en test campaign)
- control-files: ✅
- column-balance: ✅
- brand-pack-completeness: ✅
- contrast: ✅
- production-readiness: ✅
- structural-differentiation: ✅

## Notas creativas

- El hero usa fondo negro (#000000) para que el Cosmic Orange del iPhone 17 Pro destaque al máximo — una decisión de dirección de arte, no de plantilla
- No se usan iconos, bordes de tarjeta, sombras, ni barras de acento — coherente con la identidad visual de Apple
- El copy sigue el tono Apple: frases cortas, una idea por línea, sin superlativos no demostrables
- Las imágenes generadas con IA han sido verificadas visualmente: el plateau horizontal de cámaras es correcto, las tres lentes están en línea, el color Cosmic Orange es preciso
- El brand pack de Apple se ha actualizado de v1.0.1 a v2.2.0 con todos los campos necesarios para el motor