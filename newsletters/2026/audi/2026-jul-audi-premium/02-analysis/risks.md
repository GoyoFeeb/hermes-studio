# Riesgos Identificados — Campaña Audi

## Riesgos Técnicos

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R-001 | **Logo SVG**: El logo de Audi es SVG inline en la web y no se ha capturado PNG oficial | El header puede quedar sin logo, solo texto "AUDI" | Usar texto "AUDI" con tracking como fallback de marca. Pendiente de conseguir PNG de los anillos de Audi |
| R-002 | **AudiType no disponible**: La tipografía AudiType es propietaria de Audi AG y no se puede usar en email | Pérdida de fidelidad de marca | Usar Inter como sustituto — sans geométrico con carácter técnico similar |
| R-003 | **Sin fotografía oficial**: No se dispone de fotografía de modelo Audi para el hero | La newsletter se vería incompleta sin hero-imagen | Generar hero mediante IA (generate-hero-image) o usar placeholder hasta recibir assets |
| R-004 | **Fondo #101319**: El azul muy oscuro puede no contrastar bien con texto blanco en todos los clientes | Legibilidad reducida en Outlook | WCAG: verificar ratio de contraste (previsiblemente >10:1 con #FFFFFF) |

## Riesgos de Contenido

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R-005 | **Claims técnicos**: Incluir specs de potencia, aceleración o autonomía sin verificación | Falla el claims gate, posible exposición legal | No incluir claims técnicos sin confirmación textual del cliente. Usar lenguaje aspiracional |
| R-006 | **Sin modelo específico**: El brief no especifica qué modelo Audi promocionar | Hero y copy genéricos, menor conversión | Usar lenguaje general de marca o preguntar al cliente |
| R-007 | **Sin URL de aterrizaje**: No se ha proporcionado URL para el CTA | La newsletter no es funcional para producción | Usar placeholder hasta recibir la URL real |

## Riesgos de Proceso

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R-008 | **Primera marca automotive premium sin referencia previa**: Audi es la segunda marca automotriz (tras BMW) pero con identidad visual muy distinta | Posibles desviaciones en brand pack | Validar brand pack contra observación real de audi.es |
| R-009 | **El patrón fotografia-primero puede tener límites**: Solo 6 slots — si el brief necesita más módulos, no caben | Newsletter demasiado corta | Valorar si es necesario o si la brevedad es parte del minimalismo Audi |

## Bloqueos actuales

- **[Q-001]** Modelo específico a promocionar — no definido
- **[Q-002]** URL de aterrizaje — no proporcionada
- **[Q-004]** Assets fotográficos oficiales — no disponibles
- **[Q-005]** Claims técnicos — pendientes de confirmación
