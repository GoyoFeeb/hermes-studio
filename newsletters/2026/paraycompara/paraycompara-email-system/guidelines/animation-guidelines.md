# Animation Guidelines — Para y Compara Email System

> Versión 1.0
> Las animaciones son opcionales y progresivas.

---

## Principios

- Sin JavaScript
- Sin animación esencial (el contenido debe funcionar sin ella)
- Sin movimiento que afecte la lectura
- Sin elementos que se solapen
- Fallback estático siempre presente

## Animaciones permitidas

| Tipo | Cómo | Compatibilidad | Riesgo |
|---|---|---|---|
| Fade-in | Opacidad 0→1 | Parcial (Gmail: no, Apple Mail: sí) | Bajo — fallback estático |
| Pequeño desplazamiento | translateY(10px→0) | Baja | Medio — puede no renderizarse |
| Pulso muy suave | scale(1→1.05) | Baja | Bajo — apenas perceptible |
| Transición de opacidad | hover: opacity change | Muy baja | Solo mejora secundaria |

## Clasificación

| Nivel | Qué significa | Ejemplo |
|---|---|---|
| ✅ Ampliamente compatible | Funciona en Apple Mail, Yahoo, Samsung | Fade-in con CSS |
| ⚠️ Parcialmente compatible | Funciona en algunos clientes | Pequeño desplazamiento |
| ❌ No recomendable | No funciona en la mayoría | Animaciones complejas |

## Recomendación

Para newsletters de Para y Compara, prioriza la versión estática. Si decides añadir animación:

1. Que sea sutil (fade-in del hero)
2. Que no afecte al contenido (sin elementos que desaparezcan)
3. Que tenga fallback estático (el primer frame debe comunicar el mensaje completo)
4. Que no aumente el peso más de 100 KB
5. Probar en Apple Mail y Yahoo antes de enviar

## No usar

- GIFs animados grandes (>200 KB)
- Animaciones que oculten/revelen contenido
- Elementos que se muevan continuamente
- Parpadeos
- Efectos 3D
- Rotaciones