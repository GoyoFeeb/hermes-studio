# Prueba A/B de razonamiento — 2026-10-06 (punto 6 de la auditoría)

GPT-6 Luna en la primera versión con `--reasoning medium` y `--reasoning high`, mismos encargos que el worker (ficha,
galería, identidad medida, logo), en paralelo. Después, el control de Studio (con arreglos automáticos) y la revisión de
dirección de arte del punto 5 (escala, comparación con la web, copy), siempre en `medium` para las cuatro.
Script: `abtest.ts`; registro: `registro.log`; datos: `resultados.json`. Acciones, tokens y coste: `~/.hermes/state.db`
(la prueba no captaba el id de sesión; se buscaron por la ruta de cada pieza).

| Pieza | Razonamiento | Total | HTML a los | Acciones | Tokens de razonamiento | Coste | Control | Revisión de arte |
|---|---|---|---|---|---|---|---|---|
| Paredes (pre-Black Friday) | medium | 7,1 min | 1,0 min | 50 | 6.512 | 0,056 $ | sin errores | 64 % |
| Paredes (pre-Black Friday) | high | 4,8 min | 1,2 min | 19 | 11.491 | 0,024 $ | sin errores | 72 % |
| Siroko (W3 Shiga) | medium | 2,6 min | 1,1 min | 14 | 5.505 | 0,015 $ | sin errores | 78 % |
| Siroko (W3 Shiga) | high | 5,4 min | 1,7 min | 26 | 12.312 | 0,026 $ | sin errores | 80 % |
| **Media** | **medium** | **4,9 min** | | **32** | | **0,036 $** | | **71 %** |
| **Media** | **high** | **5,1 min** | | **23** | | **0,025 $** | | **76 %** |

- Regla fijada antes de la prueba: adoptar `high` en la primera versión si sube la nota ≥ 5 puntos de media y el tiempo
  no crece más de un 40 %. Resultado: +5 puntos (justo en el umbral) y +5 % de tiempo; además, menos acciones y menos
  coste (Paredes medium dio vueltas: 50 acciones). Cumple, pero con solo dos piezas y una nota por pieza: es una señal,
  no una prueba concluyente.
- En las dos piezas de Paredes, «texto e imagen» = 2: la galería de la portada trae fotos de OTRAS zapatillas (paneles
  marrones, suela roja) y la pieza las usa como si fueran la Eden negro. Es un fallo del punto 2 (galería), no del
  razonamiento.
