# CTA Options — Rolex Datejust "Una fecha para recordar"

## Opción A (recomendada — hero, intro y cierre)
**"Descubrir el Datejust"** → https://www.rolex.com/es/watches/datejust
- Sin verbo de compra directa — coherente con que Rolex no vende online.
- Reutilizar el MISMO texto en hero y banda-cierre es una decisión deliberada, no un descuido: `voice.rhythm` documenta un registro calmado, sin variación retórica forzada entre apertura y cierre — a diferencia de BMW (que sí varía "Descubre"/"Solicita información" para sugerir progresión hacia la acción), Rolex no empuja al lector hacia una conversión más "dura" al final, solo repite la misma invitación.

## Opción B (para el CTA de contexto de `intro-cta-asimetrico`)
**"Ver la colección Datejust"** → misma URL
- Diferenciado del CTA principal en texto (no en destino) para que el módulo de contexto no repita literalmente el ask principal — mismo criterio que `patterns/institutional.md` §8 (jerarquía de CTA: el secundario no debe sonar a "segundo hero").

## Opción C (alternativa, no elegida)
~~"Localizar un distribuidor"~~ — más preciso funcionalmente, pero rompe la consistencia de destino (apuntaría al localizador de distribuidores, una página distinta a la ficha del Datejust) y esta campaña no tiene esa URL verificada en `00-brief/source-links.md`. Se menciona la idea de "localizar distribuidor" en el copy del cierre (`closing.body`) sin convertirla en el CTA en sí.

## Opción D (no recomendada)
~~"Comprar el Datejust"~~ / ~~"Reservar el Datejust"~~ — verbos de compra directa, prohibidos por `00-brief/requirements.md` C-001 (Rolex no tiene checkout online).

## Asignación final

| Módulo | CTA | Destino | Razón |
|--------|-----|---------|-------|
| hero-imagen | "Descubrir el Datejust" | rolex.com/es/watches/datejust | CTA principal |
| intro-cta-asimetrico | "Ver la colección Datejust" | misma URL | Secundario, texto distinto para no repetir el ask principal |
| banda-cierre-asimetrico | "Descubrir el Datejust" | misma URL | Repite el CTA principal — mismo registro calmado del hero, sin escalar el tono |

## Forma del CTA (recordatorio, no una decisión de esta fase)

Los 3 CTA usan `cta-bulletproof.html` (pastilla sólida) / `cta-secondary-bulletproof.html` (pastilla outline, para el módulo 3) — decisión ya tomada en `03-strategy/module-selection.md` con evidencia real, no una elección de 05.
