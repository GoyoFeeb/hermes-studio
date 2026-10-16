# Prueba del juez de arte — 2026-10-16 (propuesta 2 de la auditoría de calidad)

Sin generar piezas: se usan las que ya hay en `newsletters/2026/*/hermes/`. Script `juez.ts` (modos `ruido`, `comparar`,
`resumen`); datos en `resultados/*.json`; tablas en `resumen.md`; registros `registro-*.log`. GPT-6 Luna (modelo por
defecto de Hermes), `reasoning_effort: medium`, mismas llamadas que el worker (`hermes chat -q … --ignore-rules`).
84 llamadas, mediana 33 s, 0 respuestas ilegibles.

## 1. Ruido de la nota

8 piezas, cada una puntuada 2 veces con el método antiguo (hoja reducida, sin medidas, prompt cortado a 3.500 caracteres)
y 2 con el nuevo (hoja de escritorio a tamaño real, medidas de Studio, resumen del brief).

| | Δ medio del total entre las dos notas | Criterios que cambian (de 10) | Total medio |
|---|---|---|---|
| Antiguo | 1,50 | 3,25 | 39,3 |
| Nuevo | 1,00 | 2,75 | 43,5 |

- El ruido baja algo, pero ya era menor de lo que dije en la auditoría: los «±4» comparaban notas de antes y después de
  la pasada de mejora, con la pieza cambiada entre medias. Volver a puntuar la MISMA pieza mueve ±1,5.
- El método nuevo pone 4,25 puntos más de media: deja de bajar notas por «letra pequeña» o «apretado» que salían de la
  hoja reducida. Las notas nuevas no son comparables 1:1 con las anteriores.

## 2. Comparación antes / después

20 parejas reales (antes de la mejora / después; todas las que el criterio antiguo dejó quedarse) y 6 idénticas como
control, cada una en los dos órdenes (la mejorada como A y como B).

- Control: 12 de 12 respuestas sin ninguna preferencia (100 % de votos «igual»). No se inventa diferencias.
- Parejas reales: mismo veredicto en los dos órdenes en 12 de 20 (60 %); objetivo fijado antes de la prueba: 80 %.
  **No se cumple.** Sesgo de posición: la versión de la derecha (B) gana más: con la mejorada en B se queda 13 de 20; en
  A, 9 de 20. En 6 de los 8 desacuerdos gana la que va en B.
- En los dos órdenes: 7 mejoras se quedan, 5 se descartan (Nike `ndizjn`, Feebbo `y07dqw`, StockX `641bhj`, Manolo
  Bakes `aj57i5`, El Corte Inglés `vxvm7f`) y 8 dependen del orden. Las 5 descartadas en los dos órdenes son mejoras que
  el criterio antiguo dejó quedarse.

## Conclusión

Con una sola comparación, el veredicto depende del orden en 4 de cada 10 parejas: no sirve tal cual. Opciones:
(a) volver al criterio de las dos notas, con el motivo real en el registro (lo acordado si no se llegaba al 80 %);
(b) dos comparaciones con el orden cambiado y quedarse la mejora solo si las dos la prefieren (+~35 s por pieza;
en esta muestra: 7 se quedan, 13 se descartan). Pendiente de decisión del usuario.
