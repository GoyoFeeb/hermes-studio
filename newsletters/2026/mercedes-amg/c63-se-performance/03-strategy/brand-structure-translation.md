# Brand Structure Translation: Mercedes-AMG — C 63 S E PERFORMANCE

> Fuente: https://www.mercedes-amg.com/en/c-class-sedan (observado 2026-08-20) +
> `layout.contentRhythm` / `layout.brandStructure` del brand pack v2.3.0
> (composiciónArchetype: producto-cinematico).

## Mapeo secciones reales → módulos email

| # | Sección real | Módulo email | Visual pattern | Justificación |
|---|---|---|---|---|
| 1 | Hero «Here's to the heart» — fotografía a sangre con titular y CTA «Configure now» integrados sobre la imagen | hero-imagen (módulo 2) | foto-full → banner real a sangre + copy sobre negro | La sección de apertura de la página es foto dominante + frase corta + un único CTA. El motor traduce banner en su fila y copy sobre `colors.primary` (negro) — la traducción honesta del patrón (el pack documenta que la variante «a sangre» del motor es deuda pendiente; aceptada como está) |
| 2 | «Engine & Drivetrain — The best of all worlds» — eyebrow + titular + párrafo + fotografía del tren motriz | editorial-foto-texto (módulo 3) | foto-texto (imagen izquierda) | Es el bloque editorial dominante de la página (se repite 4 veces). Una sola aparición en email = traducción honesta; el brief prohíbe repetir la misma composición. Fotografía del tren motriz real de la página |
| 3 | «High-performance battery — A forward-looking powerhouse» — eyebrow + titular + 2 párrafos + fotografía de la batería | editorial-foto-texto-inverso (módulo 4) | texto-foto (imagen derecha) | Segundo bloque editorial del mismo patrón real; el espejo (foto derecha) evita la repetición compositiva y mantiene el ritmo de la página. Fotografía de la batería real de la página |
| 4 | Sección de cierre/CTA «Configure your new Mercedes-AMG C-Class now» + bloque GET IN TOUCH | banda-cierre (módulo 5) | escena-oscura-inmersiva (brandStructure: traducción de las secciones inmersivas oscuras del sitio) | La página cierra con acción (configurador) tras bloques editoriales; el email cierra con la banda oscura de marca y el CTA de configuración, espejo del hero |

## Qué se omite y por qué

| Sección real | Tipo | Motivo de omisión |
|---|---|---|
| Private Lounge / Walkaround | comunidad (requiere login/registro con Mercedes me ID) | No es accionable desde un email; exigiría registro para ver el contenido |
| Exterior «Eccentric elegance» / «Clear forms — Wrapped in performance» | galerías de fotografía exterior (grid) | Se elige UNA fotografía por escena (regla del pack: el grid no se traduce a email); el hero ya aporta la foto de producto dominante |
| «Model overview» (500 kW / 1.020 Nm / 3,4 s / 280 km/h) | tabla de cifras por variante | Exactamente el formato «barra de datos sueltos» prohibido por el brief y por mustAvoid del pack («Tiras o tarjetas de cifras sueltas sin verbo»). Las cifras viajan en frases con verbo dentro de los módulos 2, 3 y 4 |
| GET IN TOUCH | formulario de contacto | Formulario no traducible a email; el CTA de configuración lo sustituye como acción final |
| Related Content (Estate, E 53…) | enlaces a otros modelos | Fuera del alcance de esta pieza (un solo modelo) |
| Bloque de consumo/emisiones (repetición tras cada sección) | línea legal | Se condensa en la línea legal del footer (módulo 6), nunca en cuerpo |

## Decisiones estructurales que hacen esta pieza distinta de una plantilla

1. **Sin tira de métricas, sin grid, sin intro**: el patrón `fotografia-primero` se usa en su
   forma más cinematográfica (header → hero → 2 editoriales en espejo → cierre → footer), que es
   la que replica la página real: foto + titular + 1 párrafo, cuatro veces, sin grids ni datos
   sueltos.
2. **Dos editoriales en espejo (foto-izq / foto-der)**, no dos bloques idénticos: traduce los
   dos bloques editoriales reales (Engine & Drivetrain, High-performance battery) manteniendo el
   ritmo de la página sin repetir composición (regla del brief).
3. **Las cifras viven dentro de las frases** («reúne 500 kW», «guarda 6,1 kWh») — la página las
   muestra en un «Model overview» que deliberadamente NO se traduce.
4. **Cierre oscuro que espeja el hero**: apertura y cierre en negro (identidad de la marca),
   con el cuerpo editorial en claro entre ambos — el arco visual de la página real
   (foto oscura → editorial claro → cierre CTA).
