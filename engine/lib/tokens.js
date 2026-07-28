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
 * relativa a la raíz de sistema-final/ — todos los brand packs viven en brands/{cliente}/,
 * incluido paraycompara desde 2026-07-28: hasta esa fecha su pack vivía en
 * newsletters/2026/newsletter-system/brands/paraycompara/ [un prototipo previo "v2.0" del
 * sistema, no archivado] y este archivo necesitaba una ruta de fallback duplicada en 4 sitios
 * distintos para encontrarlo — ver la auditoría técnica 2026-07-28. Unificado: ya no hace
 * falta ningún fallback).
 *
 * @param {string} brandRelPath - ej. "brands/paraycompara/tokens/brand-tokens.json"
 * @param {string} systemRoot - raíz de sistema-final/
 * @returns {{tokens: object, resolvedPath: string}}
 * @throws {Error} si el archivo no existe, no es JSON válido, o su versión es < 2.2.0
 */
function loadBrandTokens(brandRelPath, systemRoot) {
  const resolvedPath = path.resolve(systemRoot, brandRelPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Brand pack no encontrado en ${resolvedPath}.\n` +
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
