// validate-schema.mjs — valida campaign-data.json contra el schema
import Ajv from 'ajv';
import fs from 'fs';
const schema = JSON.parse(fs.readFileSync('engine/schema/campaign-data.schema.json', 'utf-8'));
const data = JSON.parse(fs.readFileSync('newsletters/2026/nike/2026-jul-nike-pegasus-42/06-data/campaign-data.json', 'utf-8'));
const ajv = new Ajv();
const validate = ajv.compile(schema);
const valid = validate(data);
if (valid) {
  console.log('✅ Schema OK');
  process.exit(0);
} else {
  console.log('❌ ERRORES:', JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
