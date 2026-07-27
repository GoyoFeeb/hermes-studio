# Risks: Para y Compara — 2026-jul-ahorra-fibra-movil

## Riesgos visuales y de assets

| # | Riesgo | Severidad | Descripción |
|---|---|---|---|
| RV01 | Sin brand guide oficial | **Crítica** | No se dispone de guía de marca. Todos los colores y tipografías son inferidos del CSS de la web y pueden no coincidir con la identidad corporativa real. |
| RV02 | Sin logo en alta resolución | **Crítica** | No hay logo aprobado para la newsletter. La campaña no puede producirse sin un asset visual de marca. |
| RV03 | Sin assets gráficos | **Alta** | No hay imágenes, iconos ni capturas del comparador. La newsletter dependerá de texto + iconos genéricos o placeholders. |
| RV04 | Paleta inferida del CSS web | **Alta** | Los colores extraídos (morado #792771, naranja #F85842) pueden corresponder solo al comparador y no a la marca corporativa en otros canales. |
| RV05 | Tipografía Alexandria no disponible en email | **Media** | Alexandria no es una fuente web-safe. La newsletter usará Arial como fallback. El cliente debe aprobar este cambio o proporcionar una fuente alternativa. |
| RV06 | Sin confirmación de uso de insignia TOP 3 | **Media** | La insignia "TOP 3 Comparadores España 2025" visible en web no puede usarse en newsletter sin verificar fuente y vigencia. |

## Riesgos de campaña

| # | Riesgo | Severidad | Descripción |
|---|---|---|---|
| RC01 | Precios visibles en web no verificados | **Crítica** | Los precios 14,50€, 18,90€ y 15,50€ visibles en web no deben incluirse en la newsletter sin confirmación. |
| RC02 | Sorteo iPhone 16 | **Alta** | Promoción visible en web pero no confirmada para uso en newsletter. |
| RC03 | Enlaces de baja y preferencias | **Crítica** | Sin enlaces de baja, la newsletter no puede enviarse a listas reales. |
| RC04 | fromEmail y fromName | **Crítica** | Sin dirección de remitente confirmada, el production-gate bloqueará en modo producción. |
| RC05 | Claims promocionales no verificados | **Alta** | Cualquier claim sobre "mejor precio", "más barato", "TOP 3" requiere documentación o aprobación. |

## Resumen de bloqueos para producción

Para que la campaña sea `productionReady`, deben resolverse:

1. Logo oficial en alta resolución
2. Brand guide o confirmación de paleta/tipografía
3. Enlaces de baja y preferencias
4. fromEmail y fromName
5. Confirmación de claims promocionales permitidos
6. Confirmación sobre uso/no uso de precios visibles en web
7. Confirmación sobre inclusión/no inclusión del sorteo iPhone 16