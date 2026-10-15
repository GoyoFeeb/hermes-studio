# Módulos técnicos de ejemplo — Hermes Studio

Piezas técnicas ya resueltas para Outlook, móvil y modo oscuro. Van dentro de la tabla de 600 px de
`email-base.html`. Son ejemplos de construcción, no de diseño: tipografía, colores, tamaños y composición
salen del brief y de la marca.

## Espaciados que mide Studio (a 600 y a 375 px)

Studio renderiza la pieza y devuelve como error cualquiera de estos casos:
- **Texto o botón pegado (menos de 12 px)** al borde de su banda de color, a una foto que tiene al lado o al borde
  de la pieza. Dentro de una banda, 24 px de padding como mínimo; entre una foto y el texto de la columna de al
  lado, 24 px.
- **Texto pegado a su línea decorativa** (un `border-left` de cita o lista): `padding-left` de 12 px como mínimo,
  también en móvil.
- **Hueco vacío** de más de 88 px, del mismo color y mucho mayor que el resto de separaciones de la pieza: entre
  escenas, 32-48 px. Un botón no lleva 8 px por arriba y 90 por abajo: reparte el aire.
- **Textos que se pisan.**

## Alineaciones que mide Studio (a 600 y a 375 px)

- **Una sola columna izquierda.** Elige un margen lateral (p. ej. 40 px en escritorio, 22 px en móvil) y úsalo en
  todas las escenas: textos, fotos que no van a todo el ancho, tarjetas y botones alineados a la izquierda empiezan
  ahí. Si dos bordes quedan a 3-12 px uno del otro (40 y 48, 22 y 30), Studio lo devuelve como descuadre. Una sangría
  a propósito se separa más de 12 px.
- El texto dentro de una tarjeta o caja de color se mide contra su caja, no contra la columna: la caja sí va al margen.
- **Lo centrado, centrado**: el mismo padding a los dos lados.

## Foto + texto con aire (32 px como mínimo entre la foto y el texto, con padding de la celda)

```html
<tr><td><img src="[foto.jpg]" width="600" alt="[DESCRIPCIÓN]" class="fluid" style="width:100%; max-width:600px; height:auto;"></td></tr>
<tr><td class="px dm-text" style="padding:36px 40px 40px; font-family:'[FUENTE DE MARCA]', Arial, sans-serif; font-size:17px; line-height:1.55; color:[TEXTO];">
  <h2 class="h1" style="margin:0 0 16px; font-size:40px; line-height:1.1;">[TITULAR]</h2>
  <p style="margin:0;">[TEXTO]</p>
</td></tr>
```

## Dos columnas que se apilan en móvil

Los `max-width` de las columnas deben sumar al menos 20 px menos que su contenedor (aquí 250 + 250 = 500 en 520): si
suman justo el hueco, el espacio en blanco entre los dos `<div>` las apila también en escritorio.

```html
<tr><td class="px" style="padding:0 40px 40px;">
  <!--[if mso]><table role="presentation" width="520"><tr><td width="250" valign="top"><![endif]-->
  <div class="stack" style="display:inline-block; width:100%; max-width:250px; vertical-align:top;">[COLUMNA 1]</div>
  <!--[if mso]></td><td width="20"></td><td width="250" valign="top"><![endif]-->
  <div class="stack stack-gap" style="display:inline-block; width:100%; max-width:250px; vertical-align:top;">[COLUMNA 2]</div>
  <!--[if mso]></td></tr></table><![endif]-->
</td></tr>
```

## Botón a prueba de Outlook (VML) con los colores de botón de la marca

`border-radius` siempre en px, nunca en %: en un botón más ancho que alto un porcentaje dibuja un óvalo. Para un
botón píldora usa `999px` (y `arcsize="50%"` en el VML, que ahí sí es correcto). El `arcsize` sale del radio de la
marca: radio ÷ alto del botón (4px en 52px ≈ 8%).

```html
<tr><td class="px btn" align="center" style="padding:8px 40px 48px;">
  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="[URL]" style="height:52px; v-text-anchor:middle; width:260px;" arcsize="10%" stroke="f" fillcolor="[FONDO BOTÓN]"><w:anchorlock/><center style="color:[TEXTO BOTÓN]; font-family:Arial, sans-serif; font-size:16px; font-weight:bold;">[TEXTO DEL BOTÓN]</center></v:roundrect><![endif]-->
  <!--[if !mso]><!--><a href="[URL]" style="display:inline-block; background-color:[FONDO BOTÓN]; color:[TEXTO BOTÓN]; font-family:'[FUENTE DE MARCA]', Arial, sans-serif; font-size:16px; font-weight:700; line-height:52px; padding:0 32px; border-radius:[RADIO DE LA MARCA];">[TEXTO DEL BOTÓN]</a><!--<![endif]-->
</td></tr>
```
