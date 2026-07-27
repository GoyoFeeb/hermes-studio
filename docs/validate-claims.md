# Validate Claims — Validación automática de claims

## Visión general

`validate-claims` escanea el contenido activo de `newsletter-data.json` en busca de claims prohibidos, técnicos no validados o expresiones comerciales de riesgo.

## Comandos

```bash
# Modo normal (prueba interna)
npm run validate-claims -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta

# Modo production (candidata a envío real)
npm run validate-claims -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta --production
```

## Campos que revisa

El script escanea solo contenido activo de la newsletter (no warnings internos ni metadata técnica):

- `metadata.subjectLine`
- `metadata.preheader`
- `modules[*].content.title`
- `modules[*].content.subtitle`
- `modules[*].content.body`
- `modules[*].content.bullets[*]`
- `modules[*].content.items[*].title`
- `modules[*].content.items[*].text`
- `modules[*].cta.text`
- `modules[*].links[*].text` (footer link labels)

## Severidades

| Severidad | Significado | Modo normal | Modo production |
|---|---|---|---|
| 🔴 Crítica | Financiero/legal (intereses cero, garantizado, aprobación inmediata) | Error → exit 1 | Error → exit 1 |
| 🟠 Alta | Técnico no validado (tracción, potencia, velocidad, líder del segmento) | Error → exit 1 | Error → exit 1 |
| 🟡 Media | Marketing fuerte (mejor oferta, edición limitada, última oportunidad) | Warning → exit 0 | Error → exit 1 |

## Claims prohibidos globales (críticos)

intereses cero, sin intereses, financiación asegurada, aprobación inmediata, aprobado al instante, garantizado, sin condiciones, entrega garantizada, stock garantizado

## Claims técnicos sensibles de automoción (altos)

tracción trasera, tracción integral, potencia, consumo (técnico), velocidad máxima, 0 a 100, acelera de, tecnología de última generación, experiencia de conducción única, el más deportivo, el más eficiente, líder del segmento, mejor (comparativo)

## Claims de marketing fuertes (medios)

edición limitada, última oportunidad, exclusivo por tiempo limitado, sin letra pequeña, mejor oferta, mejor precio

## Comportamiento por modo

| Modo | Críticos | Altos | Medios | Exit code |
|---|---|---|---|---|
| Normal | Error | Error | Warning | 1 si hay críticos/altos, 0 si solo medios |
| Production | Error | Error | Error | 0 solo si no hay claims detectados |

## Ejemplo de salida (con claim detectado)

```
🔴 Críticos: 1
🟠 Altos:    0
🟡 Medios:   0

❌ Errores (1):

  ❌ "intereses cero" detectado en modules[2] (hero).cta.text
     Contexto: "Solicita tu financiación con intereses cero"
     Recomendación: Usar TAE/TIN real sin prometer "cero". Validar con legal.
```

## Cuándo usar

| Situación | Recomendación |
|---|---|
| Antes de agente 06 (Newsletter Data) | Ejecutar para detectar claims en copy |
| Antes de export | Ejecutar para verificar contenido final |
| Antes de envío real | Ejecutar en modo production |
| Como validación continua | Incluir en gate de producción |

## Gate de producción completo

```bash
# 1. Validar estructura y flags de producción
npm run validate-newsletter -- --campaign <campaign> --production

# 2. Validar enlaces y placeholders CRM
npm run check-links -- --campaign <campaign> --strict

# 3. Validar claims en contenido activo
npm run validate-claims -- --campaign <campaign> --production

# Solo si los 3 pasan (exit 0), la campaña es candidata a envío real
```
