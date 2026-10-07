# Validación de la nota de arte con anclas (Q3, 2026-10-07)

Cada una de 8 piezas (06-07/10) puntuada con tres escalas sobre la MISMA hoja de capturas (`_trabajo/render-hoja.jpg`
de cada pieza); Lacoste y Nike, dos veces con las escalas nuevas (consistencia). Datos: `resultados.json`.
`validar.ts` importaba la versión anterior del worker desde una copia temporal (`studio/worker/.prueba-escala-antigua.ts`,
sacada con `git show` antes de la Q3), ya borrada: para repetirla, vuelve a crearla con
`git show d27cb0e:studio/worker/hermes-worker.ts > studio/worker/.prueba-escala-antigua.ts`.

| Escala | Notas que son 4 | Cincos (de 80) | Totales: rango · desviación | Media |
|---|---|---|---|---|
| antigua («5 = lo firmaría el director de arte…») | 80 % | 2 | 36-41 · 1,6 | 38,2 |
| nueva (anclas por criterio, se parte de 3, pruebas) | 54 % | 21 | 34-44 · 3,0 | 40,2 |
| **nueva2** (+ un 5 con mejora de su criterio o sin prueba cuenta como 4) | 59 % | 14 | 35-44 · 3,0 | 39,0 |

- La escala con anclas separa el doble las piezas. Las pruebas son correctas (Lacoste, petición 4: «de 100 € a 50 €; el
  público no se concreta»). nueva2 frena los cincos sin perder separación: es la que se publica.
- Ruido: puntuar dos veces la misma pieza cambia 3-5 criterios en ±1 (Lacoste 35 → 39 con nueva2). La nota sirve como
  tendencia sobre varias piezas, no como verdad de un criterio en una pieza.
- Hallazgo: varios 2 en «móvil» eran un fallo de la hoja, no de la pieza: la columna de 375 px, ampliada al ancho común,
  pasaba de 3000 px y se cortaba (Nike: sin el botón de compra ni el pie). Arreglado en `renderSheet` el mismo día.
