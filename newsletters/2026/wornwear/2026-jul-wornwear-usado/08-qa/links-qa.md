# Links QA: 2026-jul-wornwear-usado

## Verificación de enlaces

Extraídos del campaign-data.json y confirmados en final.html:

| Módulo | CTA label | Destino | utm_content | HTTP status |
|---|---|---|---|---|
| Hero | "Descubrir novedades" | wornwear.patagonia.com | `hero` | ✅ 200 |
| Intro | "Saber más" | wornwear.patagonia.com | `intro` | ✅ 200 |
| Banda de cierre | "Descubrir novedades" | wornwear.patagonia.com | `cierre` | ✅ 200 |

## Verificación UTM

```
?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-wornwear-usado&utm_content={modulo}
```

Cada CTA incluye UTM completa con `utm_content` diferenciado. Verificado en final-inline.html mediante grep.

## Placeholders esperados

| Enlace | Estado | Nota |
|---|---|---|
| `[UNSUBSCRIBE_LINK]` | ✅ Token ESP | Se resuelve en el envío |
| `[PREFERENCES_LINK]` | ✅ Token ESP | Se resuelve en el envío |

## Veredicto

✅ **PASS** — Todos los enlaces funcionales, UTM diferenciada por módulo, placeholders de baja según convención.
