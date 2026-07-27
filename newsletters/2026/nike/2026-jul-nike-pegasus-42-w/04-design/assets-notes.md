# Assets Notes

## Logo
- Nike Swoosh PNG: pendiente de capturar de nike.com
- Mientras tanto: usar placeholder HTTPS
- Tamaño: 80×28px

## Hero Banner
- **Generado por**: `npm run generate-hero-image` (OpenAI gpt-image)
- **Tema**: "Nike Pegasus 42 para mujer. Máxima respuesta en cada zancada con la misma tecnología que energiza a un icono."
- **Tratamiento fotográfico**: Nike style — fondo blanco, perfil lateral, iluminación high-key, sin texto en la imagen
- **Dimensiones**: 600×350px
- **CDN**: pendiente de subida → `bannerSrc` queda en `PENDING-CDN-UPLOAD`

## Iconos
- **Ninguno** — variante `-sin-icono` deliberada según iconography.componentImplication
- Nike es fotografía-primero: no se usan iconos decorativos en ningún módulo

## Estado de assets

| Asset | Estado | Acción pendiente |
|---|---|---|
| Logo swoosh | Pendiente de captura | Capturar de nike.com, subir a CDN |
| Hero banner PNG | Pendiente de generación (OpenAI) | Ejecutar generate-hero-image en fase 06 |
| Hero banner CDN | Pendiente de subida | Subir PNG a CDN, actualizar bannerSrc |
