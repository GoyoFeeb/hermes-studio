/**
 * cloud-launch.ts — escribe el entorno filtrado o, en --dry-run, solo los nombres.
 * Lo llama cloud-entrypoint.sh como root, antes de setpriv. No imprime valores.
 */
import * as fs from "fs";
import { cloudEnvKeys, filterCloudEnv, renderEnvFile, SETPRIV_ARGS } from "./cloudEnv";

const dryRun = process.argv.includes("--dry-run");
const writeAt = process.argv.indexOf("--write");
const target = writeAt >= 0 ? process.argv[writeAt + 1] : "";

if (dryRun) {
  process.stdout.write(
    JSON.stringify({
      setpriv: [...SETPRIV_ARGS],
      keys: cloudEnvKeys(process.env),
    })
  );
  process.exit(0);
}

if (!target) {
  console.error("Uso: cloud-launch.ts --dry-run | --write <archivo>");
  process.exit(2);
}

fs.writeFileSync(target, renderEnvFile(filterCloudEnv(process.env)), { mode: 0o600 });
