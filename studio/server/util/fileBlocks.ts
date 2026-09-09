/**
 * fileBlocks.ts — formato de intercambio entre el backend y el modelo para las fases de
 * contenido: el modelo devuelve texto plano con bloques delimitados por
 * "=== FILE: ruta/relativa ===", nunca acceso directo a filesystem. El backend parsea y
 * escribe los archivos él mismo (ver campaignFs.writeGeneratedFiles) — así el modelo nunca
 * tiene una herramienta de escritura real sobre el repo compartido.
 */

const FILE_BLOCK_RE = /^=== FILE: (.+?) ===[ \t]*$/gm;

export function parseFileBlocks(text: string): Record<string, string> {
  const matches = [...text.matchAll(FILE_BLOCK_RE)];
  const files: Record<string, string> = {};

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const relPath = match[1].trim();
    let content = text.slice(start, end);
    content = content.replace(/^\r?\n/, '').replace(/\s+$/, '\n');
    files[relPath] = content;
  }

  return files;
}

export function buildOutputContract(expectedFiles: string[]): string {
  return [
    '',
    '---',
    'CONTRATO DE SALIDA (Hermes Studio — ejecución automatizada, sin revisión humana antes de',
    'escribir a disco):',
    '',
    'Devuelve EXCLUSIVAMENTE los archivos pedidos, cada uno en un bloque con este formato',
    'exacto (la ruta es siempre relativa a la raíz del repositorio del pipeline):',
    '',
    '=== FILE: ruta/relativa/al/archivo ===',
    '(contenido completo y final del archivo, tal cual debe quedar escrito en disco)',
    '',
    'Un bloque por archivo, en cualquier orden. No escribas nada antes del primer bloque ni',
    'después del último — ni explicaciones, ni resúmenes, ni disculpas, ni preguntas. No',
    'envuelvas el contenido en fences de markdown (```) salvo que el propio archivo sea código',
    'que las necesite dentro de su propio contenido. Los archivos exactos que debes producir en',
    'esta fase son:',
    ...expectedFiles.map((f) => `- ${f}`),
  ].join('\n');
}
