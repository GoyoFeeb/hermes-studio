# Next Steps

## Fase actual

HTML Email Development — Pendiente de build

## Próximas acciones

- [ ] **AGENTE 07**: Ejecutar build del motor
- [ ] **AGENTE 08**: QA completo (visual, responsive, links, Outlook, contraste, production-gate)
- [ ] **AGENTE 09**: Export Manager — producción final, validación de assets, delivery notes

## Bloqueos para producción

### 🔴 CDN / Assets
Los iconos de tarjetas están en dominio propio de Tarifalo (`tarifalo.com/wp-content/uploads/2023/03/`). Son URLs reales que funcionan hoy pero dependen de que Tarifalo no cambie su estructura. No hay assets CDN externos pendientes de subir.

### 🔴 Placeholders legales
- [ ] Sustituir `[UNSUBSCRIBE_LINK]` por URL real de baja del ESP
- [ ] Sustituir `[PREFERENCES_LINK]` por URL real de preferencias del ESP
- [ ] Sustituir `[DIRECCIÓN FÍSICA — pendiente del cliente]` por dirección legal real

### 🟡 Cierre de producción
- [ ] Cambiar `isTestCampaign` a `false`
- [ ] Cambiar `productionReady` a `true`
- [ ] Regenerar con el motor
- [ ] Ejecutar `npm run production-gate` hasta exit 0
- [ ] Obtener aprobación humana final

## Discrepancias documentadas
- Tipografía: se solicitó Poppins/Capitana, el brand pack usa Sora/Arial — prevalece el brand pack
- Colores secundarios ajustados a valores del pack (#004B6B, #002035, #FFF1E0, #FFF6E7)
- Border-radius de píldora: solicitado 28px, pack usa 30px
