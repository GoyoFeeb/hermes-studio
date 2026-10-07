# Mazda CX-60 2026 — Investigación verificada (27-08-2026)

Brief: newsletter creativa standalone en español. Fuentes primarias oficiales Mazda.

## Gama y vigencia
- **Gama actual en España: "Mazda CX-60 2026"** — Fuente: mazda.es/gama/mazda-cx-60/elige-tu-version/ (título "ELIGE TU GAMA DEL MAZDA CX-60 2026")
- 6 acabados: PRIME-LINE, EXCLUSIVE-LINE, HOMURA, HOMURA PLUS, TAKUMI, TAKUMI PLUS — mazda.es/gama/mazda-cx-60/
- **Precio de entrada: Desde 54.220 €** (PRIME-LINE; nota 2 del pie: "Este precio se corresponde exclusivamente con la versión MHEV"). Gama hasta 69.890 € (TAKUMI PLUS). — mazda.es/gama/mazda-cx-60/, consultado 27-08-2026
- Disponibilidad: a la venta en España, promociones activas (oferta hasta 30/09/2026). — mazda.es/promociones/promociones-actuales/mazdacx60/
- Actualización 2026 (prestaciones/seguridad/diseño) llega a concesionarios desde primavera 2026 — Comunicado de prensa Mazda Motor Europe, Leverkusen, 13-11-2025 (eu.mazda-press.com)
- ⚠️ El pricelist PDF enlazado desde la web ("pricelist_mazda_cx-60_...eaa_compliance2.pdf") está DESACTUALIZADO (ENERO 2025 / "CX-60 2024", PVP 52.948 € etc.) — NO usar; manda la página viva del modelo.

## Propulsión (dos opciones en mercado español)
Fuente principal: es.mazda-press.com/cars/mazda-cx-60/ (nota "Llegada del Mazda CX-60 2025", Madrid 21-01-2025) + mazda.es
- **e-Skyactiv PHEV** (2.5L Skyactiv-G 4 cil + motor eléctrico 129 kW + batería 355V / 17,8 kWh): **327 CV / 241 kW**, **500 Nm**, 0-100 en 5,8 s, Vmax 200 km/h (limitada), **64 km de autonomía 100% eléctrica (WLTP combinado)**, consumo 1,4 l/100km, CO2 32-33 g/km, **i-Activ AWD**, 8AT. — "el coche de carretera más potente que Mazda haya fabricado jamás" (nota de prensa).
- **e-Skyactiv D 200 CV** (3.3L, 6 cilindros en línea, M Hybrid Boost 48V): 200 CV / 147 kW @3.600-4.200 rpm, **450 Nm** @1.400-3.000 rpm (+153 Nm del motor eléctrico), 0-100 en 8,4 s, Vmax 212 km/h, 5,0-5,1 l/100km, CO2 129-133 g/km, RWD (2WD), 8AT.
- **e-Skyactiv D 254 CV** (3.3L, 6 cilindros en línea, M Hybrid Boost 48V): 254 CV / 187 kW @3.750 rpm, **550 Nm** @1.500-2.400 rpm (+153 Nm), 0-100 en 7,4 s, Vmax 219 km/h, 5,3-5,5 l/100km, CO2 138-142 g/km, **i-Activ AWD**, 8AT.
- 2026 diésel: aprobado para HVO100; e-Skyactiv D 200: 5,1-5,4 l/100km / 132-134 g/km; D 254: 5,2-5,4 / 137-140 g/km. — comunicado EU 13-11-2025
- **Hallazgo regional:** en España la gama es PHEV + dos diésel de 6 cilindros en línea. NO existe variante gasolina de 6 cilindros (e-Skyactiv G) en el CX-60 español (sí en otros mercados). Las "variantes de motor recto de 6 cilindros e-Skyactiv" del brief corresponden en España al e-Skyactiv D 3.3L.

## Tecnología
- **Mi-Drive**: hasta **5 modos** de conducción (Normal, Sport; + Off-road y Remolque en tracción total; + EV en PHEV). — mazda.es
- **i-Activ AWD** (PHEV y D 254). — pricelist oficial + promociones
- KPC (Kinematic Posture Control), Head Up Display a color 10x3", pantalla táctil 12,3", visión 360° See-Through, Amazon Alexa (2026). — mazda.es + comunicado EU
- **Euro NCAP 5 estrellas**. — mazda.es
- Remolque hasta **2.500 kg** con frenos (ambas transmisiones) + Trailer Stability Control; enganche semieléctrico oculto. — mazda.es
- Maletero hasta **1.726 L**. — mazda.es
- Garantía Mazda integral 6 años / 150.000 km; batería alto voltaje 96 meses / 160.000 km. — mazda.es
- Plan Auto+ (Gobierno de España, sustituye MOVES III): incentivos PHEV/EV + 1.000 € CAEs. — mazda.es

## Interior / nivel TAKUMI
- **TAKUMI** (página actual): interior de **cuero Nappa blanco**, luces ambiente, **faros LED matriciales**, llantas de corte de diamante 20". — mazda.es/gama/mazda-cx-60/
- Materiales (comunicado EU 2026): **madera de arce real, cuero Nappa y tejidos japoneses** "en perfecta armonía" — espíritu "Crafted in Japan".
- Página modelo: "madera noble de arce, piel de gran calidad, tejidos japoneses y acabados cromados"; "maestros artesanos han modelado a mano sus líneas fluidas". — mazda.es
- Asset oficial (craft-heritage.jpg): interior cuero Nappa parchment con cosido de celosía (signature) — verificado visualmente.
- 2026 Homura/Homura Plus: interior tan con Nappa acolchado, volante bicolor, cristal insonorizante delantero. — comunicado EU

## Identidad visual (extraída de mazda.es)
- **Fuente**: MazdaType (Regular/Medium/Bold, woff2 en CDN propio) — stack del sitio: `MazdaType, helvetica, arial, sans-serif`. — es.cdn.mazda.media/assets/styles/core.*.css
- **Logo**: media-assets.mazda.eu (Cloudinary, hotlink-safe, HTTP 200) — `new_mazda_brand_logo-_2025.png`: emblema Mazda (ala en óvalo) + wordmark "MAZDA", **blanco sobre transparente** (verificado por píxeles: alfa=0 en esquinas, contenido RGB 255,255,255) → cabecera oscura.
- **Accent**: Soul Red muestreado del hero oficial (ext-static-large.jpg) → **#B62833** (método saturación, avg top 4000 px). Contraste blanco sobre #B62833 ≈ 5,9:1 (AA).
- Paleta pieza: dark #1A1A1A, white #FFFFFF, bridge #F4F4F5, accent #B62833.

## Imágenes (CDN oficial Mazda, hotlink-safe, 200)
- Hero: `.../2025-mazda-cx-60/assets/showroom/06-gallery-static-cx60-large-12.jpg` (1600×934) — CX-60 Soul Red Crystal, urbano golden hour, trasera 3/4, badge "e-Skyactiv PHEV" visible (autenticidad de marca).
- Takumi: `.../02-gallery-navigation-cx60-desktop-2-japanese-heritage2.jpg` (1200×675) — macro interior Nappa parchment con cosido de celosía.
- Logo: `.../01-global/logos/new_mazda_brand_logo-_2025.png` (480×480).

## Conversiones
- 241 kW × 1,3596 = 327 CV ✓ (fuente usa CV directamente)
- 187 kW × 1,3596 = 254 CV ✓
