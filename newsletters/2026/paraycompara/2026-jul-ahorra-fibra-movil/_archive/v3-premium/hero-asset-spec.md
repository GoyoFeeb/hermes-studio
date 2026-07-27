# hero-asset-spec.md — Especificación del asset visual del hero

> Campaña: 2026-jul-ahorra-fibra-movil — V4
> Fecha: 2026-07-13

---

## Nombre del asset

`hero-paraycompara-v4.png`

## Dimensiones

| Propiedad | Valor |
|---|---|
| Ancho | **600 px** |
| Alto | **340 px** |
| Relación | ~5:3 (1.76:1) |
| Formato | PNG o JPG |
| Peso máximo | **180 KB** |

## URL actual (placeholder)

```
https://feebbodigital.com/creativities-library/paraycompara/2026/jul/hero-paraycompara-v4.png
```

## Cómo sustituir el asset

1. Sube tu imagen definitiva con el nombre exacto `hero-paraycompara-v4.png` al CDN
2. Sobrescribe el archivo existente (misma URL)
3. No necesitas cambiar ningún HTML — el src ya apunta a esa URL

Si quieres usar otro nombre o ruta, actualiza el `src` en la línea del `<img>` dentro del bloque `HERO: PLACEHOLDER VISUAL` en `final-fixed-v4.html`.

## Alt definitivo recomendado

```
Compara tarifas de fibra, móvil y televisión con Para y Compara
```

## Contenido visual recomendado

El hero debe comunicar visualmente la propuesta de valor de Para y Compara. Se recomienda:

- **Elemento principal**: interfaz de comparación de tarifas (mockup de smartphone o panel digital)
- **Elementos secundarios**: tarjetas o badges de "Móvil", "Fibra", "TV" flotando alrededor
- **Colores dominantes**: morado #5E2E91, lila #F8F5FC, naranja #FF5A3C como acento
- **Estilo**: plano vectorial, limpio, moderno, sin texturas ni fotografía real
- **Sensación**: comparador accesible, ahorro, tecnología cercana

## Zonas que NO deben llevar texto

| Zona | Motivo |
|---|---|
| Tercio superior | El HTML coloca el eyebrow encima de la imagen |
| Centro | El HTML coloca el titular y el CTA debajo de la imagen |
| Esquina inferior derecha | Podría solaparse con el texto en vista móvil |

**Regla**: No incluyas texto redundante dentro de la imagen. El copy principal (eyebrow, titular, subtítulo, CTA, microcopy) ya está en HTML real fuera de la imagen. La imagen es solo apoyo visual.

## Safe area

| Zona | Segura para contenido |
|---|---|
| Toda la imagen | Sí, es una imagen plana — no hay interacción |
| Bordes laterales (10px) | Sí, pero evitar elementos importantes en extremos (Outlook puede recortar) |

## Fallback si la imagen no carga

- El HTML incluye `background-color:#F8F5FC` en el `<td>` contenedor
- La imagen tiene `alt` descriptivo
- El copy y CTA están fuera de la imagen en HTML real
- No hay huecos blancos enormes — la altura de la imagen es proporcionada (340px)

## Comportamiento responsive

- Ancho: 100% del contenedor (max 600px)
- Alto: automático proporcional (`height:auto` vía clase `mobile-img`)
- En móvil (sub-600px): la imagen se escala al ancho completo, la altura se ajusta automáticamente
- Sin crop, sin zoom, sin pérdida de encuadre

## Notas para el diseñador

- Diseña para 600×340px como base
- El asset debe funcionar igual de bien a 320px (escala proporcional)
- No uses texto crítico dentro de la imagen
- El CTA naranja #FF5A3C debe estar en la imagen si aparece, pero el CTA principal está en HTML
- Morado #5E2E91 y lila #F8F5FC son los colores de fondo seguros