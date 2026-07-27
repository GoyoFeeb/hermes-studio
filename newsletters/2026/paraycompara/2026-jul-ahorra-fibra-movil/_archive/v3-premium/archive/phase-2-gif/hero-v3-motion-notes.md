# hero-v3-motion-notes.md — Especificación de animación

> Campaña: 2026-jul-ahorra-fibra-movil
> Versión: V3 Premium Animated
> Fecha: 2026-07-13

---

## Archivos generados

| Archivo | Tamaño | Descripción |
|---|---|---|
| `hero-v3-animated.gif` | 75 KB | GIF animado 600×420px (3s, 8fps) |
| `hero-v3-poster.png` | 63 KB | Primer frame estático (fallback Outlook) |
| `hero-v3-first-frame.png` | 63 KB | Idéntico al poster |

## Secuencia de animación

```
Frame 0 (0.0s):  Solo imagen base — smartphone + fondo lila
Frame 1 (0.12s): Aparece tarjeta 1 (Móvil)
Frame 2 (0.25s): Aparece tarjeta 2 (Fibra)
Frame 3 (0.37s): Aparece tarjeta 3 (Fibra+Móvil)
Frame 4 (0.50s): Aparecen tarjetas 4 (TV)
Frame 5 (0.62s): Brillo en shield icon + precio destacado
Frame 6 (0.75s): Badge "MEJOR OFERTA" aparece (naranja #FF5A3C)
Frame 7 (1.00s): Highlight naranja en oferta destacada
Frame 8 (1.50s): Composición completa — todo visible
Frame 9 (2.00s): Pulso highlight (on/off)
Frame 10(2.50s): Badge se desvanece
Frame 11(3.00s): Reset — vuelve a frame 0 (loop suave)
```

## Estilo visual

- **Movimiento**: sutil, sin aceleraciones bruscas
- **Cards**: aparecen con fade-in progresivo, no `slide-in` (evita desajustes)
- **Shield glow**: pulso suave tipo "trust badge"
- **Highlight**: barra naranja que late suavemente sobre la mejor oferta
- **Badge**: "MEJOR OFERTA" aparece y desaparece con fade
- **Loop**: 3 segundos, sin salto evidente al reiniciar (último frame idéntico al primero)

## Primer frame (poster)

Es el frame 0: solo la imagen base `paraycompara-2000.png` con el smartphone + fondo lila. Sin overlay visibles. Funciona como imagen estática completa para clientes que no soportan GIF (Outlook, Gmail app a veces).

## Compatibilidad email

| Cliente | GIF | Poster | Notas |
|---|---|---|---|
| Apple Mail macOS | ✅ Sí | ✅ | Mejor soporte GIF |
| Apple Mail iOS | ✅ Sí | ✅ | |
| Gmail web | ⚠️ Parcial | ✅ | Gmail no reproduce GIF automáticamente en algunas versiones; el poster se muestra |
| Gmail app | ⚠️ Parcial | ✅ | |
| Outlook desktop | ❌ No | ✅ | Outlook muestra solo el primer frame (poster) |
| Outlook web | ⚠️ Parcial | ✅ | |
| Yahoo Mail | ✅ Sí | ✅ | |
| Samsung Mail | ✅ Sí | ✅ | |

## Optimizaciones aplicadas

- **Paleta**: 128 colores (balance calidad/tamaño)
- **Dithering**: Bayer (mejor en degradados)
- **Framerate**: 8fps (suficiente para el efecto sin inflar tamaño)
- **Dimensiones**: 600×420px (mismas que el contenedor email)
- **Peso**: 75 KB (muy por debajo del límite recomendado de 1 MB)

## Recomendaciones

1. Para Gmail: el poster se muestra por defecto; el GIF se activa al hacer clic en "Mostrar imágenes"
2. Para Outlook: solo se ve el poster — asegurarse de que el poster comunique el mensaje por sí solo
3. Para móvil: el GIF se escala correctamente con `max-width:100%; height:auto`
4. No poner texto crítico (CTAs, enlaces) dentro del GIF — todo va en HTML real fuera de la imagen