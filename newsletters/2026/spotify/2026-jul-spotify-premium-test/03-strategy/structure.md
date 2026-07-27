# Structure: Spotify — 2026-jul-spotify-premium-test

## Secuencia exacta de componentes del motor

Contra la PATTERN_SEQUENCE de `patterns/institutional.md`:

```
1. header-logo (required)
2. hero-centrado (required)        ← hero-centrado elegido (sin stat)
3. intro-cta-asimetrico (optional) ← INCLUIDO
4. columns-3-beneficios-sin-icono (required)
5. category-grid|category-grid-img (optional) ← OMITIDO
6. usp-cards-asimetrico (optional) ← INCLUIDO
7. banda-cierre-asimetrico (required)
8. footer (required)
```

## Datos por módulo (estructura campaign-data.json)

### 1. header-logo
```json
{
  "component": "header-logo",
  "data": {
    "label": "SPOTIFY",
    "logoSrc": "https://placeholder.brand.es/spotify-logo.png",
    "logoWidth": 110,
    "logoHeight": 32,
    "logoAlt": "Spotify"
  }
}
```

### 2. hero-centrado
```json
{
  "component": "hero-centrado",
  "data": {
    "brandName": "SPOTIFY",
    "h1": "1 mes de Premium gratis",
    "subtitle": "Descubre la música sin límites. Sin anuncios, sin compromiso.",
    "cta": {
      "label": "Prueba Premium gratis",
      "href": "https://www.spotify.com/us/premium/?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-spotify-premium-test"
    }
  }
}
```

### 3. intro-cta-asimetrico (opcional)
```json
{
  "component": "intro-cta-asimetrico",
  "data": {
    "title": "Todo lo que amas de la música, sin interrupciones",
    "body": "Con Premium, tu música suena como debe ser: sin anuncios, con la mejor calidad y en cualquier momento. Durante un mes, descubre lo que es escuchar sin límites.",
    "cta": {
      "label": "Empieza tu mes gratis",
      "href": "https://www.spotify.com/us/premium/?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-spotify-premium-test"
    }
  }
}
```

### 4. columns-3-beneficios-sin-icono
```json
{
  "component": "columns-3-beneficios-sin-icono",
  "data": {
    "title": "Así suena Premium",
    "intro": "Cuatro razones para dar el salto. Una prueba gratuita para comprobarlo.",
    "highlight": "Oferta exclusiva para nuevos usuarios de Premium",
    "highlightNote": "Solo si no has probado Premium antes. Después, $12.99/mes.",
    "items": [
      {
        "title": "Música sin anuncios",
        "body": "Disfruta de toda tu música favorita sin un solo corte publicitario. Escucha sin pausas, sin interrupciones."
      },
      {
        "title": "Calidad sin pérdida",
        "body": "Escucha cada detalle con audio lossless. Descarga tus canciones y podcasts favoritos para llevarlos siempre contigo."
      },
      {
        "title": "Control total",
        "body": "Salta las canciones que quieras, reproduce cualquier tema en cualquier momento. Tú decides qué suena."
      }
    ]
  }
}
```

### 5. (OMITIDO — category-grid)

### 6. usp-cards-asimetrico (opcional)
```json
{
  "component": "usp-cards-asimetrico",
  "data": {
    "title": "La música, sin límites",
    "body": "Miles de millones de horas de música, podcasts y audiolibros te esperan. Y ahora puedes probarlo todo gratis.",
    "badge": "Música sin límites",
    "items": [
      {
        "title": "Referente global del audio",
        "body": "La plataforma donde artistas y oyentes se encuentran. Donde la música cobra vida."
      },
      {
        "title": "En todos tus dispositivos",
        "body": "Móvil, tablet, ordenador, altavoz, TV, coche. Tu música te sigue a todas partes."
      },
      {
        "title": "Cancela cuando quieras",
        "body": "Sin permanencia, sin compromiso. Disfruta del mes gratis y decide después."
      }
    ]
  }
}
```

### 7. banda-cierre-asimetrico
```json
{
  "component": "banda-cierre-asimetrico",
  "data": {
    "title": "Prueba Premium gratis",
    "body": "1 mes gratis. Sin compromiso. Descubre por qué millones de personas ya escuchan sin límites.",
    "cta": {
      "label": "Prueba Premium gratis",
      "href": "https://www.spotify.com/us/premium/?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-spotify-premium-test"
    }
  }
}
```

### 8. footer
```json
{
  "component": "footer",
  "data": {
    "brandName": "Spotify",
    "legalLine": "© 2026 Spotify USA Inc. [DIRECCIÓN FÍSICA — PENDIENTE DEL CLIENTE]. Oferta válida solo para usuarios que no hayan probado Premium antes. Después del mes gratis, $12.99/mes.",
    "unsubscribeUrl": "[UNSUBSCRIBE_LINK]",
    "preferencesUrl": "[PREFERENCES_LINK]"
  }
}
```

## Verificación contra PATTERN_SEQUENCE

| Índice pattern | Componente en structure | Estado |
|---|---|---|
| 1 | header-logo (required) | ✅ |
| 2 | hero-centrado (required) | ✅ |
| 3 | intro-cta-asimetrico (optional) | ✅ INCLUIDO |
| 4 | columns-3-beneficios-sin-icono (required) | ✅ |
| 5 | category-grid (optional) | ⬜ OMITIDO |
| 6 | usp-cards-asimetrico (optional) | ✅ INCLUIDO |
| 7 | banda-cierre-asimetrico (required) | ✅ |
| 8 | footer (required) | ✅ |

**Total: 7 módulos** (OK — dentro del límite 3-7)
**CTA principal en el primer tercio:** Sí (módulo 2 de 7) ✅
