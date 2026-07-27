# Risks — Nike Pegasus 42 (Women's)

| ID | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R1 | El ángulo "misma tecnología que energiza a un icono" depende de que el usuario entienda "icono" como el Pegasus (modelo icónico) y no lo interprete como un claim excesivo | Baja | El claim-rules.ts no lo dispara. El copy real de Nike dice "energize an icon". Es copy textual de la marca. |
| R2 | Sin confirmación de logo (swoosh) ni CDN para el hero asset | Media | isTestCampaign:true. bannerSrc usará placeholder PENDING-CDN-UPLOAD. El logo se omite hasta tener URL real. |
| R3 | columns-3-beneficios-sin-icono puede sentirse "vacío" sin iconos en las tarjetas | Media | Es deliberado — el brand pack desaconseja iconos. Si el usuario lo considera necesario, habrá que generar iconos PNG reales (variante -img). |
| R4 | La nota "13% más responsive" de ReactX foam es del copy oficial de Nike, pero al traducirla al español hay que mantener la literalidad sin añadir interpretación | Baja | Usar copy del brand pack (inglés) o traducción literal verificada |
