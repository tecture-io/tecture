import { cp, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webDist = resolve(here, "../../web/dist");
const destDir = resolve(here, "../dist/public");

try {
  await access(webDist);
} catch {
  console.error(
    `[copy-web-assets] Web build not found at ${webDist}. Run "pnpm --filter @tecture/web build" first.`,
  );
  process.exit(1);
}

await cp(webDist, destDir, { recursive: true });
console.log(`[copy-web-assets] Copied ${webDist} -> ${destDir}`);
