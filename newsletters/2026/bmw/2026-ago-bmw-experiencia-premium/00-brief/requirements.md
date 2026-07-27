# Requirements — BMW Experiencia Premium

## Requisitos técnicos

- HTML de email compatible con Outlook, Gmail, Apple Mail, mobile
- CSS inline (generado por el motor vía juice)
- Sin JavaScript
- VML para botones en Outlook
- Dimensiones explícitas en imágenes
- Alt text en todas las imágenes
- Sin logotipo ni texto dentro de la imagen de cabecera
- Máximo 600px de ancho

## Requisitos legales y comerciales

- Sin claims de producto sin confirmación textual del sitio oficial de BMW
- Sin "gratuito", "puedes ahorrar X", urgencia, exclusividad sin confirmación explícita en el brief
- Datos de fuente pública marcados como "referencia oficial localizada, pendiente de aprobación cliente"
- Sin inventar URLs, claims, assets CDN ni datos legales
- La URL principal debe ser una URL real de BMW España ya existente en el sistema
- Los textos legales del footer deben incluir [DIRECCIÓN FÍSICA — pendiente del cliente] y [UNSUBSCRIBE_LINK] / [PREFERENCES_LINK] como placeholders

## Requisitos visuales

- Fotografía como elemento protagonista
- Sin decoración innecesaria
- Jerarquía construida con tamaño, peso y espaciado
- Sin efectos decorativos
- Azul BMW solo como acento, nunca dominante
- Los valores del brand pack verificado (`brands/bmw/tokens/brand-tokens.json` v2.3.1) prevalecen sobre las sugerencias visuales del usuario

## Restricciones de claims (automoción premium)

Aplican reglas HIGH del checker de claims para contenido automotriz:
- Evitar la palabra "potencia" — usar "energía", "respuesta", "rendimiento"
- Evitar "0 a 100" — usar "aceleración hasta los 100 km/h"
- Evitar "tracción integral" — usar "M xDrive" (sistema específico BMW)
- Evitar "acelera de X a Y" — usar "aceleración hasta"
- Evitar "velocidad máxima" — usar cifra sola sin el calificador

## Requisitos del pipeline

- Seguir orden estricto de agentes 01→09
- Mantener `isTestCampaign: true` y `productionReady: false`
- Usar `06-data/campaign-data.json`, nunca `newsletter-data.json`
- No editar manualmente `09-exports/final.html` ni `final-inline.html`
- No tocar `engine/components/`
