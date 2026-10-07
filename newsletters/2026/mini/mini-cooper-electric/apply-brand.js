// Aplica el sistema tipográfico oficial MINI + logos oficiales mini.es al HTML
const fs = require('fs');
const F = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/mini-cooper-electric-newsletter.html';
let h = fs.readFileSync(F, 'utf8');

const FONTS = `@font-face{font-family:'MINISansReg';src:url('https://www.mini.es/etc.clientlibs/settings/wcm/designs/minidigital-white/fonts/latin/resources/MINISansSerif-Regular.woff') format('woff');font-display:swap;}
@font-face{font-family:'MINISansBold';src:url('https://www.mini.es/etc.clientlibs/settings/wcm/designs/minidigital-white/fonts/latin/resources/MINISansSerif-Bold.woff') format('woff');font-display:swap;}
@font-face{font-family:'MINIBold';src:url('https://www.mini.es/etc.clientlibs/settings/wcm/designs/minidigital-white/fonts/latin/resources/MINISerif-Bold.woff') format('woff');font-display:swap;}
`;

const reps = [
  ['@font-face oficiales', '<style>', '<style>\n' + FONTS],
  ['kickers -> MINISansBold', `font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2.5px;color:#9B9B9B;text-transform:uppercase;`, `font-family:'MINISansBold',Arial,sans-serif;font-size:12px;font-weight:400;letter-spacing:2px;color:#9B9B9B;text-transform:uppercase;`],
  ['h1 -> MINIBold serif', `font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:40px;line-height:1.08;font-weight:800;letter-spacing:-0.5px;color:#FFFFFF;`, `font-family:'MINIBold',Georgia,'Times New Roman',serif;font-size:40px;line-height:1.08;font-weight:400;color:#FFFFFF;text-transform:uppercase;`],
  ['h2 -> MINIBold serif', `font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:32px;line-height:1.12;font-weight:800;letter-spacing:-0.4px;color:#1A1A1A;`, `font-family:'MINIBold',Georgia,'Times New Roman',serif;font-size:32px;line-height:1.12;font-weight:400;color:#1A1A1A;text-transform:uppercase;`],
  ['body 17px -> MINISansReg 16px', `font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:17px;`, `font-family:'MINISansReg',Arial,sans-serif;font-size:16px;`],
  ['anchor CTA -> Arial regular', `display:inline-block;background-color:#000000;color:#FFFFFF;text-decoration:none;padding:16px 38px;border-radius:2px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1.5px;`, `display:inline-block;background-color:#000000;color:#FFFFFF;text-decoration:none;padding:15px 36px;border-radius:2px;font-family:Arial,sans-serif;font-size:15px;font-weight:400;`],
  ['VML center -> Arial regular', `color:#FFFFFF;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1.5px;`, `color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:400;`],
  ['CTA1 sentence case', 'DESCUBRIR LA NUEVA GENERACIÓN', 'Descubrir la nueva generación'],
  ['CTA2 sentence case', 'PROBAR EL GO-KART FEELING', 'Probar el go-kart feeling'],
  ['CTA3 sentence case', 'CONFIGURAR EL MÍO', 'Configurar el mío'],
  ['masthead logo -> token', `src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/MINI_logo.svg/500px-MINI_logo.svg.png" width="250" height="110"`, `src="{{LOGO_BLACK}}" width="250" height="115"`],
  ['footer plate -> logo blanco directo', `<table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;">\n        <tr>\n          <td style="padding:14px 28px;">\n            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/MINI_logo.svg/500px-MINI_logo.svg.png" width="200" height="88" alt="" role="presentation" style="display:block;border:0;outline:none;text-decoration:none;" />\n          </td>\n        </tr>\n      </table>`, `<img src="{{LOGO_WHITE}}" width="200" height="92" alt="" role="presentation" style="display:block;border:0;outline:none;text-decoration:none;" />`],
  ['footer © 13px -> MINISansReg', `font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;`, `font-family:'MINISansReg',Arial,sans-serif;font-size:13px;`],
  ['footer legal 12px -> MINISansReg', `font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;`, `font-family:'MINISansReg',Arial,sans-serif;font-size:12px;`],
];

let fail = false;
for (const [name, from, to] of reps) {
  const count = h.split(from).length - 1;
  h = h.split(from).join(to);
  console.log(`${count > 0 ? 'OK ' : '!! '} ${name}: ${count}`);
  if (count === 0) fail = true;
}
fs.writeFileSync(F, h);
console.log(fail ? 'HAY REEMPLAZOS FALLIDOS' : 'TODOS LOS REEMPLAZOS OK');
