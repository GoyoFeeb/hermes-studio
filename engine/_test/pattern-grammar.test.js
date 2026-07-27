const {parsePatternSequence, validateModulesAgainstPattern} = require('../lib/pattern.js');

const mk = (body) => `<!-- PATTERN_SEQUENCE (x) -->\n${body}\n<!-- /PATTERN_SEQUENCE -->`;
const mods = (...names) => names.map(n => ({component: n}));
let pass=0, fail=0;
function t(name, fn){
  try { fn(); console.log('  ✅', name); pass++; }
  catch(e){ console.log('  ❌', name, '→', e.message); fail++; }
}
function assert(c,m){ if(!c) throw new Error(m||'assert falló'); }

// ── A. RETROCOMPATIBILIDAD: sintaxis vieja, comportamiento idéntico ──
const OLD = mk(`1. header-logo (required)
2. hero-asimetrico|hero-centrado|hero-imagen|hero-marca-* (required)
3. intro-cta|intro-cta-asimetrico (optional)
4. columns-3-beneficios|card-tarifa-3 (required)
5. category-grid|category-grid-img (optional)
6. usp-cards|usp-cards-asimetrico (optional)
7. banda-cierre|banda-cierre-asimetrico (required)
8. footer (required)`);

t('vieja sintaxis parsea (8 anclas, ninguna zona)', ()=>{
  const s = parsePatternSequence(OLD,'x');
  assert(s.length===8, 'esperaba 8 segmentos, hay '+s.length);
  assert(s.every(x=>x.kind==='anchor'), 'todos deben ser anclas');
  assert(s.every(x=>x.rule.max===1), 'max por defecto debe ser 1');
});
t('vieja: secuencia real de UAX pasa', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(OLD,'x'),
    mods('header-logo','hero-centrado','intro-cta','columns-3-beneficios','category-grid','usp-cards','banda-cierre','footer'));
  assert(r.ok, JSON.stringify(r.errors));
});
t('vieja: opcionales omitidos pasa', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(OLD,'x'),
    mods('header-logo','hero-imagen','card-tarifa-3','banda-cierre','footer'));
  assert(r.ok, JSON.stringify(r.errors));
});
t('vieja: comodín hero-marca-* sigue funcionando', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(OLD,'x'),
    mods('header-logo','hero-marca-tarifalo','columns-3-beneficios','banda-cierre','footer'));
  assert(r.ok, JSON.stringify(r.errors));
});
t('vieja: SIGUE rechazando repetición (max 1 por defecto)', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(OLD,'x'),
    mods('header-logo','hero-centrado','columns-3-beneficios','columns-3-beneficios','banda-cierre','footer'));
  assert(!r.ok, 'debería fallar: repetición no permitida con max 1');
});
t('vieja: SIGUE rechazando desorden', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(OLD,'x'),
    mods('header-logo','columns-3-beneficios','hero-centrado','banda-cierre','footer'));
  assert(!r.ok, 'debería fallar: hero fuera de orden');
});
t('vieja: SIGUE rechazando obligatorio ausente', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(OLD,'x'),
    mods('header-logo','hero-centrado','columns-3-beneficios','footer'));
  assert(!r.ok, 'debería fallar: falta banda-cierre');
});
t('vieja: SIGUE rechazando componente ajeno al patrón', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(OLD,'x'),
    mods('header-logo','hero-centrado','pasos','banda-cierre','footer'));
  assert(!r.ok, 'debería fallar: pasos no es de este patrón');
});

// ── B. GRAMÁTICA NUEVA ──
const NEW = mk(`1. header-logo (required)
2. hero-asimetrico|hero-centrado|hero-imagen|hero-marca-* (required)
- intro-cta|intro-cta-asimetrico (optional, max 2)
- columns-3-beneficios|columns-3-beneficios-sin-icono|card-tarifa-3 (required, max 2)
- category-grid|category-grid-img (optional, max 2)
- usp-cards|usp-cards-sin-icono-asimetrico (optional, max 2)
3. banda-cierre|banda-cierre-asimetrico (required)
4. footer (required)`);

t('nueva: parsea 2 anclas + 1 zona(4 reglas) + 2 anclas', ()=>{
  const s = parsePatternSequence(NEW,'x');
  assert(s.length===5, 'esperaba 5 segmentos, hay '+s.length);
  assert(s[0].kind==='anchor' && s[1].kind==='anchor', 'los 2 primeros son anclas');
  assert(s[2].kind==='zone' && s[2].rules.length===4, 'el 3º es zona con 4 reglas');
  assert(s[3].kind==='anchor' && s[4].kind==='anchor', 'los 2 últimos son anclas');
});
t('nueva: la secuencia de siempre SIGUE siendo válida', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(NEW,'x'),
    mods('header-logo','hero-centrado','intro-cta','columns-3-beneficios','category-grid','usp-cards','banda-cierre','footer'));
  assert(r.ok, JSON.stringify(r.errors));
});
t('nueva: ORDEN DISTINTO del cuerpo ahora se acepta (antes imposible)', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(NEW,'x'),
    mods('header-logo','hero-imagen','usp-cards','columns-3-beneficios','intro-cta','banda-cierre','footer'));
  assert(r.ok, JSON.stringify(r.errors));
});
t('nueva: REPETICIÓN de un bloque ahora se acepta (antes imposible)', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(NEW,'x'),
    mods('header-logo','hero-imagen','columns-3-beneficios','category-grid','columns-3-beneficios-sin-icono','banda-cierre','footer'));
  assert(r.ok, JSON.stringify(r.errors));
});
t('nueva: repetir MÁS de max sigue fallando', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(NEW,'x'),
    mods('header-logo','hero-imagen','columns-3-beneficios','columns-3-beneficios','columns-3-beneficios','banda-cierre','footer'));
  assert(!r.ok, 'debería fallar: 3 > max 2');
});
t('nueva: ancla de apertura fuera de sitio sigue fallando', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(NEW,'x'),
    mods('hero-imagen','header-logo','columns-3-beneficios','banda-cierre','footer'));
  assert(!r.ok, 'debería fallar: header-logo no abre');
});
t('nueva: ancla de cierre fuera de sitio sigue fallando', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(NEW,'x'),
    mods('header-logo','hero-imagen','banda-cierre','columns-3-beneficios','footer'));
  assert(!r.ok, 'debería fallar: cuerpo después del cierre');
});
t('nueva: obligatorio de zona ausente sigue fallando', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(NEW,'x'),
    mods('header-logo','hero-imagen','intro-cta','category-grid','banda-cierre','footer'));
  assert(!r.ok, 'debería fallar: falta el bloque de beneficios');
});
t('nueva: footer ausente sigue fallando', ()=>{
  const r = validateModulesAgainstPattern(parsePatternSequence(NEW,'x'),
    mods('header-logo','hero-imagen','columns-3-beneficios','banda-cierre'));
  assert(!r.ok, 'debería fallar: falta footer');
});

// ── C. errores de sintaxis ──
t('max 0 se rechaza con mensaje claro', ()=>{
  let threw=false;
  try { parsePatternSequence(mk('- a (optional, max 0)'),'x'); } catch(e){ threw = /max debe ser >= 1/.test(e.message); }
  assert(threw,'debería lanzar por max 0');
});
t('línea basura se rechaza', ()=>{
  let threw=false;
  try { parsePatternSequence(mk('esto no es una regla'),'x'); } catch(e){ threw=true; }
  assert(threw,'debería lanzar');
});

console.log(`\n  ${pass} OK, ${fail} FAIL`);
process.exit(fail? 1:0);
