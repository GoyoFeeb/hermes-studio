# Risks — Nike Pegasus 42 (adaptación a email)

## Riesgos de marca

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-001 | Fuente `Helvetica Now Display/Text` no disponible en email | Alto | Usar Helvetica/Arial como fallback — la cadena de fuentes de Nike ya incluye estos fallbacks |
| R-002 | El negro puro #111111 sobre blanco #FFFFFF puede ser demasiado duro en email | Bajo | Es el contraste de marca de Nike — se mantiene |
| R-003 | Las imágenes del Pegasus 42 necesitan el tratamiento fotográfico exacto de Nike (fondo blanco, perfil lateral) | Medio | hero-imagen puede generarlo con el prompt correcto; si no, capturar de nike.com |
| R-004 | Hero con fotografía necesita contraste suficiente para texto superpuesto | Alto | Usar texto blanco sobre imagen o overlay oscuro si es necesario; o texto debajo de la imagen |
| R-005 | Los iconos de especificaciones técnicas (peso, drop, amortiguación) son difíciles de reproducir en email sin imágenes reales | Medio | Usar iconos como imagen PNG desde nike.com o texto plano numerado |
| R-006 | CTA pill con 30px border-radius: Outlook no soporta bien border-radius sin VML | Medio | El VML de cta-bulletproof.html maneja esto con arcsize="50%" |
| R-007 | Sin iconos decorativos — el email no debe usar iconos de beneficio tipo emoji que Nike nunca usaría | Alto | Usar fotografía como único adorno visual; iconos solo para especificaciones técnicas |

## Riesgos de contenido

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-008 | No tenemos datos técnicos del Pegasus 42 verificados (peso 300g, drop 10mm — observados en la página pero no confirmados) | Alto — NO incluirlos sin verificar | Campaña de interés: mencionar el producto sin cifras técnicas, o usar las observadas marcándolas como "según ficha de producto" |
| R-009 | No tenemos logo de Nike (swoosh) en formato PNG | Medio | Capturar de nike.com durante el build |
| R-010 | Campaña isTestCampaign — placeholders válidos | Bajo | Usar merge-tags ESP para baja/preferencias |
| R-011 | Claims de rendimiento ("propulsive feel", "highest energy return", "más suave", "más transpirable") son copy real de Nike pero en email podrían disparar el gate de claims | Medio | Revisar claim-rules.ts — estos son copy textual de la marca, no claims inventados; documentar como riesgo aceptado |
