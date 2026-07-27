#!/usr/bin/env node
// Editorial smoke test v2: Create proper fotografia-primero data with editorial-foto-texto
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

const data = {
  _comment: "Smoke test for editorial-foto-texto component",
  metadata: {
    campaignName: "2026-jul-test-editorial",
    clientName: "Test",
    subjectLine: "Test — Editorial foto+texto",
    preheader: "Comprobando el nuevo componente editorial",
    fromName: "Test Brand",
    fromEmail: "test@example.com",
    version: "1.0.0",
    createdAt: "2026-07-27",
    isTestCampaign: true,
    productionReady: false
  },
  brand: "brands/nike/tokens/brand-tokens.json",
  pattern: "fotografia-primero",
  modules: [
    {
      component: "header-logo",
      data: {
        logoSrc: "https://feebbodigital.com/creativities-library/nike/logo-nike.png",
        logoAlt: "Nike",
        logoWidth: 66,
        logoHeight: 30,
        label: "JUST DO IT"
      }
    },
    {
      component: "hero-imagen",
      data: {
        bannerSrc: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        bannerAlt: "Zapatilla Nike en movimiento",
        brandName: "Nike",
        h1: "Nuevo diseño, misma esencia",
        subtitle: "La evolución de un icono.",
        cta: { href: "https://example.com/ver", label: "Descubrir" }
      }
    },
    {
      component: "editorial-foto-texto",
      data: {
        imageSrc: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=276",
        imageAlt: "Detalle del tejido transpirable",
        eyebrow: "MATERIALES",
        title: "Transpiración total",
        body: "Tejido Flyknit que se adapta a cada paso sin perder sujeción.",
        cta: { href: "https://example.com/mas", label: "Saber más" }
      }
    },
    {
      component: "editorial-foto-texto-inverso",
      data: {
        imageSrc: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=276",
        imageAlt: "Suela con tecnología React",
        eyebrow: "TECNOLOGÍA",
        title: "Amortiguación reactiva",
        body: "La espuma React devuelve energía en cada zancada.",
        cta: { href: "https://example.com/tecnologia", label: "Ver tecnología" }
      }
    },
    {
      component: "banda-cierre",
      data: {
        title: "Muévete como nunca",
        body: "Diseñado para quienes no ponen límites.",
        cta: { href: "https://example.com/comprar", label: "Comprar ahora" }
      }
    },
    {
      component: "footer",
      data: {
        brandName: "Nike",
        tagline: "Just Do It",
        disclosure: "Recibes este correo porque formas parte de la comunidad Nike.",
        unsubscribeUrl: "[UNSUBSCRIBE_LINK]",
        preferencesUrl: "[PREFERENCES_LINK]",
        legalLine: "© 2026 Nike, Inc. One Bowerman Drive, Beaverton, OR 97005, USA."
      }
    }
  ],
  utm: {
    source: "newsletter",
    medium: "email",
    campaign: "2026-jul-test-editorial"
  }
};

// Validate schema
const Ajv = require('ajv');
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'engine/schema/campaign-data.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
const valid = validate(data);

if (valid) {
  console.log('✅ Schema validation: PASS');
  const outPath = '/tmp/editorial-test-v2.json';
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log('Test data written to ' + outPath);
} else {
  console.log('❌ Schema validation: FAIL');
  for (const e of validate.errors || []) {
    console.log('  -', e.instancePath, e.message);
  }
  process.exit(1);
}
