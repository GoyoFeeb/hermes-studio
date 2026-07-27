#!/usr/bin/env node
// Editorial smoke test: creates a campaign-data with editorial-foto-texto and validates schema
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

const examplePath = path.join(ROOT, 'engine/schema/campaign-data.example.json');
const example = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

// Add editorial-foto-texto to modules
const editorialModule = {
  component: 'editorial-foto-texto',
  data: {
    imageSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
    imageAlt: 'Persona con gafas en entorno profesional',
    eyebrow: 'DISEÑO',
    title: 'Diseñado para inspirar',
    body: 'Cada línea sigue el ADN visual de la marca. Sin concesiones.',
    cta: { href: 'https://example.com/ver-mas', label: 'Ver colección' }
  }
};

// Replace first intro-cta
const idx = example.modules.findIndex(m => m.component === 'intro-cta' || m.component === 'intro-cta-asimetrico');
if (idx >= 0) example.modules.splice(idx, 1, editorialModule);

// Validate schema
const Ajv = require('ajv');
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'engine/schema/campaign-data.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
const valid = validate(example);

if (valid) {
  console.log('✅ Schema validation: PASS');
  const outPath = '/tmp/editorial-test-data.json';
  fs.writeFileSync(outPath, JSON.stringify(example, null, 2));
  console.log('Test data written to ' + outPath);
} else {
  console.log('❌ Schema validation: FAIL');
  for (const e of validate.errors || []) {
    console.log('  -', e.instancePath, e.message);
  }
  process.exit(1);
}
