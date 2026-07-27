# Next Steps — Verificación post-restauración

## Bloqueos de cliente (producción real — no aplica a test)
- [ ] Sustituir `PENDING-CDN-UPLOAD/hero-banner.png` por URL CDN real cuando se necesite una campaña de producción
- [ ] Reemplazar `placeholder.invalid` con URLs CDN reales
- [ ] Confirmar dirección física para legalLine
- [ ] Configurar fromEmail real (`noreply@newsletter.nike.com`)
- [ ] Asignar UNSUBSCRIBE_LINK y PREFERENCES_LINK reales

## Pendientes técnicos
- Ninguno — el sistema funciona correctamente

## Notas
Esta campaña de test se creó exclusivamente para verificar la integridad del sistema post-restauración del CHANGELOG del motor.
Todos los gates de producción que fallan lo hacen por placeholders esperados en campañas de test (CDN, links legales).
