'use strict';

/**
 * lib/tokens.js — carga y resolución del brand pack (brand-tokens.json).
 * Prompt 13 (engine/build-newsletter.js). Ver engine/README.md para el contrato completo.
 */

const fs = require('fs');
const path = require('path');

const MIN_VERSION = '2.2.0';

/**
 * Compara dos versiones "semver-lite" (x.y.z, solo números). Devuelve -1/0/1.
 */
function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na < nb ? -1 : 1;
  }
  return 0;
}

/**
 * Carga brand-tokens.json a partir de la ruta declarada en campaign-data.json (campo `brand`,
 * relativa a la raíz de sistema-final/ — hoy vive en newsletters/2026/newsletter-system/brands/
 * porque brands/ todavía no se ha movido a la raíz, eso es F4 del plan de transformación).
 *
 * @param {string} brandRelPath - ej. "brands/paraycompara/tokens/brand-tokens.json"
 * @param {string} systemRoot - raíz de sistema-final/
 * @returns {{tokens: object, resolvedPath: string}}
 * @throws {Error} si el archivo no existe, no es JSON válido, o su versión es < 2.2.0
 */
function loadBrandTokens(brandRelPath, systemRoot) {
  // El brand pack todavía vive bajo newsletters/2026/newsletter-system/ (no se ha movido a la
  // raíz — eso es la Fase 4 del plan). Probamos primero la ruta literal declarada en
  // campaign-data.json (por si en el futuro SÍ vive en la raíz), y si no existe, probamos con
  // el prefijo actual. Documentado explícitamente para no sorprender a quien lea esto en F4.
  const candidates = [
    path.resolve(systemRoot, brandRelPath),
    path.resolve(systemRoot, 'newsletters/2026/newsletter-system', brandRelPath)
  ];
  const resolvedPath = candidates.find((p) => fs.existsSync(p));
  if (!resolvedPath) {
    throw new Error(
      `Brand pack no encontrado. Probado:\n  - ${candidates.join('\n  - ')}\n` +
      `Verifica el campo "brand" de campaign-data.json.`
    );
  }

  let tokens;
  try {
    tokens = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } catch (err) {
    throw new Error(`Brand pack en ${resolvedPath} no es JSON válido: ${err.message}`);
  }

  if (!tokens.version) {
    throw new Error(`Brand pack en ${resolvedPath} no declara "version".`);
  }
  if (compareVersions(tokens.version, MIN_VERSION) < 0) {
    throw new Error(
      `Brand pack en ${resolvedPath} está en v${tokens.version}, se requiere >= v${MIN_VERSION} ` +
      `(el motor asume tokens fusionados en el prompt 09 y ampliados en el 11/12).`
    );
  }

  return { tokens, resolvedPath };
}

/**
 * Resuelve un path tipo "typography.h1HeroOnBrand.size" contra el objeto de tokens.
 * @returns {*} el valor encontrado, o undefined si el path no existe.
 */
function resolveTokenPath(tokens, tokenPath) {
  const parts = tokenPath.split('.');
  let cur = tokens;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object' || !(part in cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

module.exports = { loadBrandTokens, resolveTokenPath, compareVersions, MIN_VERSION };
