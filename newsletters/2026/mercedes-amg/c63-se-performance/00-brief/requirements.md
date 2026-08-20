# Requirements — Mercedes-AMG C 63 S E PERFORMANCE

Fuente: prompt de dirección creativa (2026-08-20) + reglas del sistema (AGENTS.md, skill
newsletter-pipeline).

## Vinculantes (del brief creativo)

1. **Un solo concepto rector.** Todo titular deriva de «Antes del ruido, el impulso.» Ningún
   segundo titular capaz de funcionar como concepto independiente.
2. **3-5 escenas, nunca más**, cada una con función narrativa distinta y aporte propio
   (documentado en brief.md §4). Prohibido:
   - Barra de datos sueltos tipo «680 CV · 1020 Nm · 3,4s» — toda cifra va en frase con verbo.
   - Grid de 3 columnas con icono + título + párrafo (excepción: componentes reales de la
     sección 6 del prompt — no aplica aquí).
   - Bloques alternados imagen-izquierda/texto-derecha repetidos más de una vez con la misma
     composición (aquí: 2 bloques en espejo, permitido por el patrón fotografia-primero).
   - Repetir el mismo string de CTA. Cada CTA con copy distinta según su momento
     (primero descubre, último configura).
   - Placeholders sin resolver: nada entre corchetes, ningún texto duplicado.
   - «Mercedes-AMG» como texto CSS: el logo SIEMPRE es el lockup oficial (imagen/SVG).
   - Claims sin respaldo del paso 1: gratis, garantizado, líder, «el mejor», cifras no
     verificadas, urgencia/exclusividad falsa.
3. **Copy**: máx. 40 palabras por bloque corrido. Cada característica técnica se traduce a
   experiencia de conducción, nunca dato suelto. «C 63» máx. 3 veces en toda la pieza.
4. **Autoauditoría obligatoria** antes de entregar (checklist de 8 preguntas — todas «no»).
5. **Formato de salida del brief**: concepto + escenas con componente del motor + datos con
   fuente + copy + checklist. (Entregado y aprobado por el cliente.)

## Del sistema (AGENTS.md / skill)

6. Orden estricto de fases 01→09; cada fase deja entregables escritos; 4 archivos de control
   sincronizados en cada transición.
7. Claim safety agente 05 (29 reglas): reformulaciones para specs automotrices (potencia →
   energía/respuesta; «0 a 100» → «3,4 segundos hasta los 100»; «tracción integral» →
   «AMG Performance 4MATIC+»; sin «velocidad máxima»; sin «consumo» en cuerpo).
8. NORMA 600px: cada escena incluido su fondo = tabla 600px centrada, nunca full-bleed;
   verificar Playwright 1280 (w=600, x=340, scrollWidth=1280).
9. Datos públicos sin aprobación del cliente: marcar como «referencia oficial localizada,
   pendiente de aprobación cliente» (nunca «verificada»).
10. No borrar nada: mover a `_archive/` si se reemplaza.

## Assets

11. Fotografía REAL del CDN oficial de la marca (imgix, `?fm=jpg`), nunca IA ni stock.
12. Logo oficial: raster PNG del brand pack (design-input/logo-mercedes-amg-white-588.png).
13. Enlaces: configurador oficial amg4.me/configure_c63se_sedan, página modelo ES/EN.

## Fuera de alcance (pendientes, no entrar en la pieza)

14. Precio España, fecha de disponibilidad ES, matiz 250/280 km/h → ver open-questions.md.
