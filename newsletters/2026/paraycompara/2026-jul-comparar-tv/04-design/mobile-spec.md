# Mobile spec — 2026-jul-comparar-tv

Comportamiento responsive: el de los componentes del motor (clases mobile-* validadas en 15
rondas — grid 2×2 apila, paddings se reducen vía mobile-pad, H1 baja a 26px según token
h1HeroOnBrand.mobile). Sin comportamiento nuevo especificado — cualquier desviación en el
render de 320/375 es un defecto a reportar por 08, no algo que esta spec deba reinventar.

Única atención específica del tema: el title de la tarjeta "Fibra + Móvil" es el más largo del
grid — ya validado en la pieza premium a 320px sin romper línea de forma fea. Sin cambios.
