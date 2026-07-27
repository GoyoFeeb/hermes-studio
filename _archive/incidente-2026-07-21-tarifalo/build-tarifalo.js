#!/usr/bin/env node
/**
 * build-tarifalo.js — Complete HTML newsletter builder for Tarífalo.
 *
 * Generates a complete, self-contained HTML email with:
 * - Campaign data from campaign-data.json
 * - Brand colors from brand-tokens.json
 * - VML bulletproof buttons
 * - Responsive design via @media queries
 *
 * Usage:
 *   node newsletters/2026/tarifalo/2026-jul-tarifalo-compara-energia/build-tarifalo.js
 */

const fs = require('fs');
const path = require('path');

const CAMPAIGN_DIR = __dirname;
const DATA_PATH = path.join(CAMPAIGN_DIR, '06-data', 'campaign-data.json');
const OUT_DIR = path.join(CAMPAIGN_DIR, '09-exports');

let juice;
try {
  juice = require('juice');
  juice = juice.default || juice;
} catch (e) {
  console.error('✗ juice not found. Run: npm install juice');
  process.exit(1);
}

function escapeHtml(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Color constants for Tarífalo ────────────────────────────────────────
const C = {
  primary: '#003049',
  deep: '#002035',
  light: '#004B6B',
  white: '#FFFFFF',
  cta: '#F77F00',
  onBrandSec: '#FCE4C8',
  cream: '#FFF6E7',
  creamSection: '#FFF1E0',
  body: '#333333',
  bodySec: '#666666',
  border: '#E0D5C5',
  halo: '#FFE0B0',
  sep: '#D4C5B5'
};

// ─── Build complete HTML with all sections ──────────────────────────────

function buildHTML(data) {
  // Extract module data
  const mods = {};
  data.modules.forEach(m => { mods[m.component] = m.data; });
  const meta = data.metadata;

  // Generate UTM URLs
  function utmUrl(base, content) {
    return `${base}?utm_source=newsletter&utm_medium=email&utm_campaign=${meta.campaignName}&utm_content=${content}`;
  }

  const heroCtaUrl = `https://tarifalo.com/comparador/luz-gas/?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-tarifalo-compara-energia&utm_content=hero-cta`;
  const closingCtaUrl = `https://tarifalo.com/comparador/luz-gas/?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-tarifalo-compara-energia&utm_content=closing-cta`;

  function heroSection() {
    const d = mods['hero-asimetrico'];
    return `<tr>
<td style="background-color:${C.primary};padding:0;" bgcolor="${C.primary}">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
    <tr>
      <td align="center" class="mobile-pad-sm" style="padding:28px 32px 12px;">
        <img src="https://tarifalo.com/wp-content/uploads/2023/02/tarifalo-logo-svg-vf.svg"
             alt="Tarífalo — comparador de tarifas de luz y gas"
             width="176" height="48"
             style="display:block;outline:none;border:none;text-decoration:none;width:176px;height:48px;max-width:100%;">
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:20px 0 0;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            <td align="center" class="mobile-pad-sm" style="padding:0 32px 8px;vertical-align:middle;">
              <h1 class="mobile-hero-h1" style="font-family:'Sora',Arial,Helvetica,sans-serif;font-size:28px;font-weight:800;color:${C.white};margin:0;line-height:1.16;letter-spacing:-0.5px;text-align:center;mso-line-height-rule:exactly;">
                ${escapeHtml(d.h1)}
              </h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" class="mobile-pad-sm" style="padding:0 40px 0;">
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:${C.onBrandSec};margin:0;line-height:1.5;text-align:center;mso-line-height-rule:exactly;">
          ${escapeHtml(d.subtitle)}
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" class="mobile-pad-sm" style="padding:24px 32px 0;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="mobile-full">
          <tr>
            <td align="center" style="padding:0;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                href="${escapeHtml(heroCtaUrl)}" style="height:52px;v-text-anchor:middle;width:280px;"
                arcsize="50%" strokecolor="${C.cta}" fillcolor="${C.cta}">
                <w:anchorlock/>
                <center style="color:${C.white};font-family:'Sora',Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;">${escapeHtml(d.cta.label)}</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;" class="mobile-full">
                <tr>
                  <td align="center" class="mobile-full" style="background-color:${C.cta};border-radius:50px;padding:17px 36px;box-shadow:0 12px 28px rgba(247,127,0,0.22);">
                    <a href="${escapeHtml(heroCtaUrl)}" target="_blank"
                       style="display:block;color:${C.white};font-family:'Sora',Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;letter-spacing:0.5px;text-decoration:none;text-align:center;line-height:22px;mso-line-height-rule:exactly;">${escapeHtml(d.cta.label)}</a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:32px 32px 40px;">&nbsp;</td>
    </tr>
  </table>
</td>
</tr>`;
  }

  function trustBarSection() {
    const items = mods['trust-bar'].items;
    const row = (text) =>
      `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
        <tr>
          <td align="center" style="background-color:${C.primary};border-radius:50%;width:22px;height:22px;line-height:0;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.white};margin:0;line-height:22px;text-align:center;mso-line-height-rule:exactly;">&#10003;</p>
          </td>
          <td width="8" style="font-size:1px;line-height:1px;">&nbsp;</td>
          <td align="left">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;color:${C.primary};margin:0;line-height:16px;mso-line-height-rule:exactly;">${escapeHtml(text)}</p>
          </td>
        </tr>
      </table>`;
    return `<tr>
<td style="background-color:${C.white};padding:32px 24px 0;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:${C.creamSection};border-radius:50px;">
    <tr>
      <td align="center" style="padding:20px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            ${items.map((item, i) => `
            <td align="center" style="width:33%;padding:6px 4px;vertical-align:middle;" class="mobile-stack">
              ${row(item.text)}
            </td>
            ${i < items.length - 1 ? `<td width="1" style="background-color:${C.border};font-size:1px;line-height:1px;" class="mobile-hide">&nbsp;</td>` : ''}
            `).join('')}
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>`;
  }

  function sectionEyebrow(eyebrow, title, align) {
    const al = align || 'center';
    return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 10px;${al === 'left' ? 'margin-left:0;' : ''}">
      <tr><td width="32" height="2" style="background-color:${C.light};font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.light};margin:0 0 6px;line-height:16px;letter-spacing:3px;text-transform:uppercase;text-align:${al};mso-line-height-rule:exactly;">
      ${escapeHtml(eyebrow)}
    </p>
    <h2 class="mobile-section-title" style="font-family:'Sora',Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:${C.primary};margin:0 0 6px;line-height:1.2;letter-spacing:-0.3px;text-align:${al};mso-line-height-rule:exactly;">
      ${escapeHtml(title)}
    </h2>`;
  }

  function cardsSection() {
    const d = mods['card-tarifa'];
    return `<tr>
<td style="background-color:${C.white};padding:0;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
    <tr>
      <td align="center" class="mobile-pad-sm" style="padding:56px 24px 44px;">
        ${sectionEyebrow(d.eyebrow, d.title)}
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;color:${C.bodySec};margin:0 0 24px;line-height:1.5;text-align:center;mso-line-height-rule:exactly;">
          ${escapeHtml(d.subtitle)}
        </p>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            ${d.items.map(item => `
            <td style="width:33%;padding:0 6px 12px;vertical-align:top;" class="mobile-stack">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:${C.white};border:1px solid ${C.border};border-radius:16px;box-shadow:0 14px 32px rgba(0,48,73,0.08);">
                <tr><td height="4" style="background-color:${C.light};border-radius:16px 16px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:26px 22px 22px;text-align:center;">
                  <img src="${escapeHtml(item.icon)}" alt="" width="48" height="48" style="display:block;outline:none;border:none;width:48px;height:48px;margin:0 auto;">
                  <h3 style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:${C.primary};margin:12px 0 4px;line-height:20px;mso-line-height-rule:exactly;">${escapeHtml(item.title)}</h3>
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;color:${C.bodySec};margin:0 0 10px;line-height:1.5;mso-line-height-rule:exactly;">${escapeHtml(item.body)}</p>
                  <a href="${escapeHtml(item.href)}" target="_blank" style="display:inline-block;color:${C.cta};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;text-decoration:none;padding:2px 0;">${escapeHtml(item.linkLabel)} &#8594;</a>
                </td></tr>
              </table>
            </td>
            `).join('')}
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>`;
  }

  function stepsSection() {
    const d = mods['pasos'];
    return `<tr>
<td style="background-color:${C.white};padding:0;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
    <tr>
      <td align="center" class="mobile-pad-sm" style="padding:56px 24px 44px;">
        ${sectionEyebrow(d.eyebrow, d.title)}
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            ${d.items.map(item => `
            <td align="center" style="width:33%;padding:0 10px;vertical-align:top;" class="mobile-stack">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr><td align="center" style="padding:0 0 12px;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="background-color:${C.halo};border-radius:50%;padding:4px;line-height:0;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td align="center" style="background-color:${C.primary};border-radius:50%;width:56px;height:56px;line-height:0;">
                              <p style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;color:${C.white};margin:0;line-height:56px;text-align:center;mso-line-height-rule:exactly;">${escapeHtml(item.number)}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td align="center" style="padding:0 0 4px;">
                  <h3 style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${C.primary};margin:0;line-height:20px;mso-line-height-rule:exactly;">${escapeHtml(item.title)}</h3>
                </td></tr>
                <tr><td align="center">
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;color:${C.bodySec};margin:0;line-height:1.5;mso-line-height-rule:exactly;">${escapeHtml(item.body)}</p>
                </td></tr>
              </table>
            </td>
            `).join('')}
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>`;
  }

  function listSection() {
    const d = mods['lista-premium'];
    return `<tr>
<td style="background-color:${C.creamSection};padding:0;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
    <tr>
      <td align="left" class="mobile-pad-sm" style="padding:56px 24px 44px;">
        ${sectionEyebrow(d.eyebrow, d.title, 'left')}
        ${d.items.map(item => `
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:${C.white};border:1px solid ${C.border};border-radius:16px;box-shadow:0 14px 32px rgba(0,48,73,0.08);margin:0 0 12px;">
          <tr><td height="4" style="background-color:${C.light};border-radius:16px 16px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:20px 22px 22px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td width="36" valign="middle" style="padding:0 14px 0 0;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td align="center" style="background-color:${C.primary};border-radius:50%;width:36px;height:36px;line-height:0;">
                          <img src="${escapeHtml(item.icon)}" alt="" width="36" height="36" style="display:block;outline:none;border:none;width:36px;height:36px;">
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="left" valign="middle">
                    <h3 style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${C.primary};margin:0 0 2px;line-height:20px;mso-line-height-rule:exactly;">${escapeHtml(item.title)}</h3>
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;color:${C.bodySec};margin:0;line-height:1.5;mso-line-height-rule:exactly;">${escapeHtml(item.body)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        `).join('')}
      </td>
    </tr>
  </table>
</td>
</tr>`;
  }

  function closingSection() {
    const d = mods['banda-cierre'];
    return `<tr>
<td style="background-color:${C.deep};padding:0;" bgcolor="${C.deep}">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
    <tr>
      <td align="center" class="mobile-pad-sm" style="padding:60px 32px 52px;">
        <h2 class="mobile-section-title" style="font-family:'Sora',Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;color:${C.white};margin:0 0 10px;line-height:1.18;letter-spacing:-0.4px;text-align:center;mso-line-height-rule:exactly;">
          ${escapeHtml(d.title)}
        </h2>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:${C.onBrandSec};margin:0 0 24px;line-height:1.5;text-align:center;mso-line-height-rule:exactly;">
          ${escapeHtml(d.body)}
        </p>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="mobile-full">
          <tr>
            <td align="center" style="padding:0;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                href="${escapeHtml(closingCtaUrl)}" style="height:52px;v-text-anchor:middle;width:280px;"
                arcsize="50%" strokecolor="${C.cta}" fillcolor="${C.cta}">
                <w:anchorlock/>
                <center style="color:${C.white};font-family:'Sora',Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;">${escapeHtml(d.cta.label)}</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;" class="mobile-full">
                <tr>
                  <td align="center" class="mobile-full" style="background-color:${C.cta};border-radius:50px;padding:17px 36px;box-shadow:0 12px 28px rgba(247,127,0,0.22);">
                    <a href="${escapeHtml(closingCtaUrl)}" target="_blank"
                       style="display:block;color:${C.white};font-family:'Sora',Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;letter-spacing:0.5px;text-decoration:none;text-align:center;line-height:22px;mso-line-height-rule:exactly;">${escapeHtml(d.cta.label)}</a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>`;
  }

  function footerSection() {
    const d = mods['footer'];
    return `<tr>
<td style="background-color:${C.cream};padding:0;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
    <tr>
      <td align="center" style="padding:40px 24px 8px;border-top:2px solid ${C.halo};">
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;color:${C.primary};margin:0;line-height:1.4;letter-spacing:0.2px;text-align:center;mso-line-height-rule:exactly;">
          ${escapeHtml(d.brandName)}
        </p>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:400;color:${C.bodySec};margin:2px 0 0;line-height:1.4;text-align:center;mso-line-height-rule:exactly;">
          ${escapeHtml(d.tagline)}
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:16px 24px 24px;">
        <hr style="border:none;border-top:1px solid ${C.border};margin:0 0 16px;width:100%;">
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:400;color:${C.bodySec};margin:0 0 12px;line-height:1.45;text-align:center;mso-line-height-rule:exactly;">
          ${escapeHtml(d.disclosure)}
        </p>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            <td align="center" style="padding:0 0 12px;">
              <a href="${escapeHtml(d.unsubscribeUrl)}" target="_blank" style="color:${C.bodySec};font-family:Arial,Helvetica,sans-serif;font-size:12px;text-decoration:underline;margin:0 5px;">Darse de baja</a>
              <span style="color:${C.sep};font-size:12px;">|</span>
              <a href="${escapeHtml(d.preferencesUrl)}" target="_blank" style="color:${C.bodySec};font-family:Arial,Helvetica,sans-serif;font-size:12px;text-decoration:underline;margin:0 5px;">Preferencias</a>
            </td>
          </tr>
        </table>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:400;color:${C.bodySec};margin:0;line-height:1.4;text-align:center;mso-line-height-rule:exactly;">
          &copy; 2026 ${escapeHtml(d.brandName)}. [DIRECCIÓN FÍSICA — pendiente del cliente]
        </p>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:400;color:${C.bodySec};margin:8px 0 0;line-height:1.4;text-align:center;mso-line-height-rule:exactly;">
          <a href="[PLACEHOLDER_PRIVACY]" target="_blank" style="color:${C.bodySec};font-family:Arial,Helvetica,sans-serif;font-size:11px;text-decoration:underline;">Política de privacidad</a>
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  // ─── Assemble ──────────────────────────────────────────────────────────
  const bodySections = [
    heroSection(),
    trustBarSection(),
    cardsSection(),
    stepsSection(),
    listSection(),
    closingSection(),
    footerSection()
  ].join('\n');

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="es">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(meta.subjectLine)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style type="text/css">
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/sora/v17/xMQ9uFFYT72X5wkB_18qmnndmSdSnh2BAfO5mnuyOo1lfiQwV6-x.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/sora/v17/xMQOuFFYT72X5wkB_18qmnndmSfSmU-NKQI.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
.hidden-preheader {
  display:none !important; overflow:hidden !important; line-height:1px !important;
  opacity:0 !important; max-height:0 !important; max-width:0 !important;
  font-size:1px !important; font-family:Arial,Helvetica,sans-serif !important;
  color:#FFF6E7 !important; mso-hide:all !important;
}
@media only screen and (max-width:599px) {
  .mobile-stack { display:block !important; width:100% !important; }
  .mobile-full { width:100% !important; }
  .mobile-hide { display:none !important; }
  .mobile-img { width:100% !important; height:auto !important; }
  .mobile-pad-sm { padding-left:24px !important; padding-right:24px !important; }
  .mobile-hero-h1 { font-size:26px !important; line-height:1.18 !important; }
  .mobile-hero-stat { font-size:32px !important; }
  .mobile-section-title { font-size:20px !important; }
}
.yshortcuts a { border-bottom:none !important; }
a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.cream};font-family:Arial,Helvetica,sans-serif;">
<!--[if mso]><style type="text/css">body,table,td,p,a,li,blockquote{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->

<!-- PREHEADER -->
<div class="hidden-preheader" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;font-size:1px;font-family:Arial,Helvetica,sans-serif;color:${C.cream};mso-hide:all;">
  ${escapeHtml(meta.preheader)}
</div>

<!-- OUTER -->
<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:${C.cream};min-width:100%;">
<tr><td align="center" style="padding:0;">
<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="max-width:600px;background-color:${C.white};margin:0 auto;">

${bodySections}`;

  return html;
}

// ─── Verification ────────────────────────────────────────────────────────

function verify(html) {
  const errors = [];

  // No unresolved placeholders
  if (/\{\{/.test(html)) {
    const list = html.match(/\{\{[^}]+\}\}/g);
    errors.push(`Unresolved placeholders: ${list.join(', ')}`);
  }

  // Table balance
  const ot = (html.match(/<table[ >]/g) || []).length;
  const ct = (html.match(/<\/table>/g) || []).length;
  if (ot !== ct) errors.push(`Tables: ${ot} open, ${ct} closed`);

  const or = (html.match(/<tr[ >]/g) || []).length;
  const cr = (html.match(/<\/tr>/g) || []).length;
  if (or !== cr) errors.push(`Rows: ${or} open, ${cr} closed`);

  const od = (html.match(/<td[ >]/g) || []).length;
  const cd = (html.match(/<\/td>/g) || []).length;
  if (od !== cd) errors.push(`Cells: ${od} open, ${cd} closed`);

  // Image count
  const imgs = (html.match(/<img /g) || []).length;

  // UTM links
  const utms = (html.match(/utm_source=newsletter/g) || []).length;

  // VML buttons
  const vmls = (html.match(/v:roundrect/g) || []).length;

  // No JS, no CSS gradients
  if (/<script/i.test(html)) errors.push('Contains <script> tags');
  if (/linear-gradient|radial-gradient/i.test(html)) errors.push('Contains CSS gradients');

  return { ok: errors.length === 0, errors, counts: { tables: ot, rows: or, cells: od, images: imgs, utm: utms, vmlButtons: vmls } };
}

// ─── Main ────────────────────────────────────────────────────────────────

function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Tarífalo — Build Newsletter');
  console.log('═══════════════════════════════════════════\n');

  // 1. Load data
  let data;
  try {
    data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch (e) {
    console.error(`✗ Failed to load data: ${e.message}`);
    process.exit(1);
  }
  console.log(`  ✓ Campaign: ${data.metadata.campaignName}`);

  // 2. Build HTML
  console.log('• Building HTML...');
  const source = buildHTML(data);
  console.log('  ✓ Complete HTML built');

  // 3. Verify source
  console.log('• Verifying source...');
  const v = verify(source);
  if (!v.ok) {
    console.error('✗ Verification failed:');
    v.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`  ✓ ${v.counts.tables} tables, ${v.counts.rows} rows, ${v.counts.cells} cells`);
  console.log(`  ✓ ${v.counts.images} images, ${v.counts.utm} UTM links, ${v.counts.vmlButtons} VML buttons`);
  console.log('  ✓ No JS, no CSS gradients');

  // 4. Inline with juice
  console.log('• Inlining CSS...');
  let inline;
  try {
    inline = juice(source, { preserveMediaQueries: true });
  } catch (e) {
    console.error(`✗ juice error: ${e.message}`);
    process.exit(1);
  }

  // Verify inline parity
  const srcImgs = (source.match(/<img /g) || []).length;
  const inlineImgs = (inline.match(/<img /g) || []).length;
  if (srcImgs !== inlineImgs) {
    console.error(`✗ Image parity: ${srcImgs} source vs ${inlineImgs} inline`);
    process.exit(1);
  }

  // 5. Write outputs
  console.log('• Writing output...');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const srcPath = path.join(OUT_DIR, 'final.html');
  const inlinePath = path.join(OUT_DIR, 'final-inline.html');
  fs.writeFileSync(srcPath, source, 'utf8');
  fs.writeFileSync(inlinePath, inline, 'utf8');

  const kb = (Buffer.byteLength(inline, 'utf8') / 1024).toFixed(1);
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  ✓ BUILD SUCCESSFUL`);
  console.log(`    09-exports/final.html`);
  console.log(`    09-exports/final-inline.html (${kb} KB)`);
  console.log(`═══════════════════════════════════════════\n`);
}

main();
