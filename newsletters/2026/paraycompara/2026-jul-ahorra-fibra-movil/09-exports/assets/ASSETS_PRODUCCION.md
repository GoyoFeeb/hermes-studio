# ASSETS_PRODUCCION.md — Assets para subir al CDN

> Campaña: 2026-jul-ahorra-fibra-movil
> Fecha: 2026-07-17
> Origen: iconos oficiales de `paraycompara.com` (convertidos de SVG a PNG)

## Base CDN

```
https://feebbodigital.com/creativities-library/paraycompara/2026/jul/
```

## Archivos a subir

| Archivo local | Destino CDN | Uso | Tamaño |
|---|---|---|---|
| `09-exports/assets/icon-tarifa-movil.png` | `icon-tarifa-movil.png` | Tarjeta Móvil | 1.3 KB |
| `09-exports/assets/icon-tarifa-fibra.png` | `icon-tarifa-fibra.png` | Tarjeta Fibra | 1.9 KB |
| `09-exports/assets/icon-tarifa-convergente.png` | `icon-tarifa-convergente.png` | Tarjeta Fibra+Móvil | 2.2 KB |
| `09-exports/assets/icon-tarifa-tv.png` | `icon-tarifa-tv.png` | Tarjeta Televisión | 1.7 KB |
| `09-exports/assets/icon-aspecto-datos.png` | `icon-aspecto-datos.png` | Lista — Datos móviles | 1.0 KB |
| `09-exports/assets/icon-aspecto-cobertura.png` | `icon-aspecto-cobertura.png` | Lista — Cobertura | 2.8 KB |
| `09-exports/assets/icon-aspecto-paquetes.png` | `icon-aspecto-paquetes.png` | Lista — Paquetes | 1.9 KB |
| `09-exports/assets/icon-aspecto-condiciones.png` | `icon-aspecto-condiciones.png` | Lista — Condiciones | 1.1 KB |

## Origen de los SVG originales

Todos los SVGs se descargaron de `https://paraycompara.com/assets/img/` y se archivan en:

```
01-inputs/images/oficiales/
```

## Verificación post-subida

Después de subir, ejecutar:

```bash
for f in icon-tarifa-movil icon-tarifa-fibra icon-tarifa-convergente icon-tarifa-tv \
         icon-aspecto-datos icon-aspecto-cobertura icon-aspecto-paquetes icon-aspecto-condiciones; do
  curl -sI "https://feebbodigital.com/creativities-library/paraycompara/2026/jul/$f.png" | grep HTTP
done
```

Todos deben devolver HTTP 200 antes de cerrar la campaña.