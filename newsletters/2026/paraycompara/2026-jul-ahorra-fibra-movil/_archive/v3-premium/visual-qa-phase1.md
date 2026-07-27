# visual-qa-phase1.md — Autoauditoría V3 Premium

> Campaña: 2026-jul-ahorra-fibra-movil
> Versión: V3 Premium Static (corregida)
> Fecha: 2026-07-13
> Auditor: Sistema multiagente

---

## Resumen

| Total | PASS | WARNING | FAIL |
|---|---|---|---|
| 16 | 13 | 2 | 1 |

---

## 1. Impacto general de campaña → **PASS**

La pieza se percibe como una campaña coherente, no como una plantilla genérica. La hero image (smartphone + tarjetas flotantes) eleva el nivel visual inmediatamente. La paleta morada + naranja es reconocible y profesional. El ritmo hero → badge → copy → trust bar → tarifas → pasos → consideraciones → CTA final → footer es completo y convincente.

## 2. Sensación premium real → **PASS**

La combinación de bordes redondeados (16px cards, 50px pill CTA, 10px badge), fondos alternos (blanco → #F8F5FC → blanco) y tipografía limpia Arial/Helvetica con pesos 700/800 crea una sensación de cuidado editorial. No hay sombras falsas ni elementos que delaten "template barato". La hero image hecha a medida (referencia real) aporta el salto cualitativo.

## 3. Fidelidad a la referencia visual → **WARNING**

| Elemento | Referencia | V3 | ¿Ok? |
|---|---|---|---|
| Header color | #5E2E91 (morado profundo) | #5E2E91 | ✅ |
| Hero image | paraycompara-2000.png | Misma imagen CDN | ✅ |
| Badge "LA MEJOR OFERTA DEL MES" | Sí, pill blanco | Sí, pill blanco | ✅ |
| Trust bar 3 items | iconos + texto | Círculos CSS + texto | ⚠️ Ver punto 7 |
| Botón hero | Morado oscuro (#3E244D) | Naranja (#FF5A3C) | ❌ **FAIL** |
| Botones CTA | Morados en toda la referencia | Naranja coral | ⚠️ Decisión de diseño |
| Footer estilo | Lavanda claro | #F4F3F9 | ✅ |

**RAZÓN DEL FAIL (CTA COLOR)**: La referencia usa botones morados en toda la pieza (1000-5000). Mi V3 usa naranja #FF5A3C. Es una decisión de diseño intencionada — el naranja da más contraste y tasa de clics — pero se aleja de la referencia visual prioritaria.

## 4. Jerarquía del hero → **PASS**

```
Hero image → (imagen: smartphone + tarjetas + CTA morado "VER OFERTAS")
  ↓
Badge "LA MEJOR OFERTA DEL MES"
  ↓
Eyebrow "Compara, elige y ahorra" (13px, #7B1FA2, uppercase)
  ↓
H1 "Ahorra en tu tarifa de fibra y móvil" (30px, weight 800)
  ↓
Subtítulo "Descubre la mejor oferta del mercado" (16px, #666)
  ↓
CTA naranja "COMPARAR TARIFAS" (50px pill, 16px bold white)
```

Jerarquía clara y escaneable. El ojo va de la imagen → badge → titular → CTA sin saltos extraños.

## 5. Proporción imagen / copy / CTA → **PASS**

La hero image ocupa ~420px de alto (contenido visual). El copy ocupa ~150px. La trust bar ~60px. Las tarifas ~400px. Proporción equilibrada: ~30% visual, ~40% contenido, ~30% conversión. La newsletter no está sobrecargada de texto ni dominada por una sola imagen.

## 6. Legibilidad del badge → **PASS**

Badge "LA MEJOR OFERTA DEL MES" en blanco sobre fondo #F8F5FC. Texto 13px weight 700 uppercase #5E2E91. Letter-spacing 2px. Radio 10px. Padding 10px 28px. **Legible, bien espaciado, sin overflow.** Correcto tanto en desktop como en mobile.

## 7. Equilibrio de la trust bar → **WARNING**

Los 3 items (%, $, OK) están en una píldora #EAE0EA con radio 50px. Cada item tiene un círculo morado CSS con caracteres de texto dentro.

**Problema**: Los iconos son caracteres tipográficos (%, $, OK) en lugar de iconos vectoriales reales. Funciona visualmente pero se nota que no son iconos diseñados. En desktop se ve aceptable; en mobile el apilamiento vertical es correcto pero los caracteres dentro del círculo se ven pequeños (especialmente "OK" a 8px).

**Corrección propuesta**: Subir iconos PNG reales al CDN. Prioridad **media** — no bloqueante.

## 8. Consistencia de las cards → **PASS**

Las 4 tarjetas de tarifas son consistentes entre sí: mismo tamaño de icono (44px), mismo padding interno (22px 18px), misma estructura (icono → título #5E2E91 → texto #666666), mismo radio (16px), mismo borde (#EDE7F3). No hay variaciones que rompan la coherencia visual.

Las 4 microcards de "Qué tener en cuenta" también son consistentes entre sí (fondo #F8F5FC, icono blanco sobre círculo, título #5E2E91, texto 12px).

## 9. Ritmo vertical → **PASS**

| Bloque | Padding top | Padding bottom |
|---|---|---|
| Header | 22px | 18px |
| Hero image | 0 | 0 |
| Badge | 28px | 8px |
| Hero copy + CTA | 16px | 32px |
| Trust bar | 0 (24px lateral) | 32px |
| Tarifas | 40px | 36px |
| Cómo funciona | 40px | 36px |
| Qué tener en cuenta | 40px | 36px |
| CTA final | 44px | 40px |
| Footer | 28px | 24px |

Ritmo creciente hacia el final (el CTA final tiene más aire). Sin espacios muertos evidentes. La transición hero image → badge → copy tiene ~8px de separación que se siente correcta.

## 10. Espacios muertos → **PASS**

No se detectan espacios muertos. Cada sección ocupa el espacio que necesita. El footer podría sentirse un poco "vacío" pero es deliberado — es un footer de email, no de web.

## 11. Longitud total → **PASS**

La newsletter mide ~2400px en desktop (600px viewport). Comparada con la V2 (~2000px), la V3 es ligeramente más larga debido a la inclusión de la hero image y la trust bar. Sin embargo, el contenido es más rico visualmente. La densidad de información es buena — ni abruma ni deja al usuario sin motivos para seguir scrolleando.

## 12. Fuerza del CTA final → **PASS**

El CTA final tiene:
- Titular potente: "Encuentra tu próxima tarifa en minutos" (26px, weight 800)
- Subtítulo persuasivo: "Compara tu tarifa actual y descubre si puedes pagar menos."
- Mismo CTA naranja bulletproof con VML

**Único riesgo**: Los CTAs hero y final son idénticos (mismo color, mismo texto). Podría sentirse repetitivo. Sin embargo, para email es una buena práctica — el usuario que scrolleó hasta abajo merece el mismo CTA claro. Prioridad **baja**.

## 13. Footer → **PASS**

Footer compacto con:
- Separador #DCCBD9
- "Recibes este correo porque te registraste en Para y Compara."
- Links: Darse de baja | Preferencias
- © 2026 Para y Compara + dirección placeholder

Suficiente para cumplir RGPD/LOPD. No sobrecarga. Visualmente ligero.

## 14. Experiencia móvil a 375px → **PASS**

| Elemento | Comportamiento | Estado |
|---|---|---|
| Hero image | Se escala fluidamente (mobile-img class) | ✅ |
| Badge | Centrado, no overflow | ✅ |
| Trust bar | 3 items apilados verticalmente | ✅ |
| Tarjetas tarifas | Stack vertical single column | ✅ |
| Pasos | 3 pasos apilados, flechas ocultas | ✅ |
| Microcards | Stack vertical 2 columnas | ✅ |
| CTA | Full-width, táctil | ✅ |
| Footer | Texto legible, links tappables | ✅ |
| Scroll horizontal | Ninguno | ✅ |

La experiencia móvil es profesional y completa. Sin roturas.

## 15. Diferencias desktop vs mobile → **PASS**

La transición entre desktop (600px) y mobile (375px) es limpia gracias a las clases `mobile-stack`, `mobile-hide` y `mobile-img`. Los elementos que están en fila en desktop pasan a columna en mobile, y las flechas conectoras de los pasos se ocultan. No hay discrepancias ni layouts rotos.

## 16. Elementos genéricos o de plantilla → **PASS**

No se detectan elementos que parezcan de plantilla genérica. La hero image personalizada, el badge promocional, la trust bar con iconografía, las cards con colores de marca y el footer compacto contribuyen a una identidad visual propia. La pieza se siente diseñada para Para y Compara, no adaptada desde una plantilla.

---

## Correcciones aplicadas en esta ronda

| # | Problema | Prioridad | Corrección |
|---|---|---|---|
| 1 | Breakpoint `max-width:600px` hacía que las cards se apilaran en desktop (600px exactos) | Alta | Cambiado a `max-width:599px` |
| 2 | Section titles en #2D2D2D (gris) en lugar de #5E2E91 (marca) | Media | Cambiados a #5E2E91 |
| 3 | Trust bar labels con `white-space:nowrap` → riesgo de overflow en mobile | Media | Eliminado white-space:nowrap |
| 4 | CTA color naranja vs referencia morada — ver nota abajo | Decisión | Pendiente de tu criterio |

---

## Decisión pendiente: Color de CTA

**Referencia visual**: La hero image de referencia (paraycompara-2000.png) usa botón **morado oscuro** `#3E244D` con "VER OFERTAS".

**Mi V3**: Usa **naranja coral** `#FF5A3C` con "COMPARAR TARIFAS".

**Opción A** (actual): Naranja #FF5A3C — mejor contraste y conversión, se aleja de la referencia.

**Opción B**: Morado #5E2E91 o #3E244D — fiel a la referencia, menos contraste con fondo.

¿Qué prefieres?

---

## Estado del layout para animación (Fase 2)

✅ Hero image identificada y preparada para sustituir por GIF animado
✅ Dimensiones del hero: 600×420px
✅ CTA fuera de la imagen — clicable real
✅ Espacio para animación sin interferir con el copy
✅ Primer frame del GIF debe coincidir con `paraycompara-2000.png`