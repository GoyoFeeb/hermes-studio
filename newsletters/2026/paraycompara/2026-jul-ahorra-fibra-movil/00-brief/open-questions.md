# Open Questions: Para y Compara — 2026-jul-ahorra-fibra-movil

## Preguntas abiertas

### [Q-001] — ¿Qué precios/promociones están aprobados para la newsletter?

**Pregunta:** ¿Podemos incluir alguno de los precios visibles en la web oficial (14,50€ fibra+móvil, 18,90€ móvil+fibra, 15,50€ iPhone 16 en plan) o deben omitirse todos y limitarse al mensaje de invitación a comparar?

**Contexto:** La web muestra precios de entrada, pero no está claro si están vigentes, son de operadores específicos o el cliente los autoriza para la newsletter.

**Impacto:** Alto — determina si la newsletter puede incluir precios o debe ser puramente informativa.

**Posible respuesta / Suposición temporal:** No incluir ningún precio. Centrar la newsletter en la invitación a comparar sin cifras.

**Destinatario:** Cliente

---

### [Q-002] — ¿Está activo y aprobado el sorteo del iPhone 16 para la campaña?

**Pregunta:** ¿Podemos mencionar el sorteo del iPhone 16 en la newsletter o debe omitirse?

**Contexto:** El sorteo aparece en la web oficial, pero no está confirmado si sigue activo ni si el cliente autoriza su uso en email marketing.

**Impacto:** Medio — podría ser un incentivo potente pero requiere confirmación.

**Posible respuesta / Suposición temporal:** No mencionar el sorteo hasta confirmación explícita.

**Destinatario:** Cliente

---

### [Q-003] — ¿Qué enlaces de baja y preferencias debemos usar?

**Pregunta:** ¿Cuáles son los enlaces de unsubscribe y preferences que deben incluirse en el footer de la newsletter?

**Contexto:** Sin enlaces de baja y preferencias, la newsletter no puede enviarse a listas reales. El production-gate los exige en modo producción.

**Impacto:** Alto — bloquea producción. Para prueba interna se puede usar placeholder.

**Posible respuesta / Suposición temporal:** Usar placeholders `[UNSUBSCRIBE_LINK]` y `[PREFERENCES_LINK]` para pruebas internas.

**Destinatario:** Cliente

---

### [Q-004] — ¿Qué fromEmail y fromName deben usarse?

**Pregunta:** ¿Qué dirección de email y nombre de remitente deben configurarse para la campaña?

**Contexto:** El production-gate en modo producción exige un fromEmail con formato válido.

**Impacto:** Alto — bloquea producción.

**Posible respuesta / Suposición temporal:** Usar `newsletter@paraycompara.com` como placeholder.

**Destinatario:** Cliente

---

### [Q-005] — ¿Está aprobada la insignia "TOP 3 Comparadores España 2025"?

**Pregunta:** ¿Podemos incluir la insignia "TOP 3 Comparadores España 2025" visible en la web? ¿De qué fuente proviene y está vigente?

**Contexto:** La insignia aparece en el header de la web oficial. Si se incluye en la newsletter, debe estar verificada.

**Impacto:** Medio

**Posible respuesta / Suposición temporal:** No incluir hasta confirmación de la fuente y vigencia.

**Destinatario:** Cliente