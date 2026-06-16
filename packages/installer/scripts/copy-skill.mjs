// Bundles the canonical skill into the package and stamps it with the package
// version, so `@tecture/skill@X` always carries skill version X (version-locked,
// offline, no GitHub fetch). Runs after tsup, which cleans dist/.
import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const skillSrc = resolve(here, "../../../.claude/skills/architecture-docs");
const skillDest = resolve(here, "../dist/skill/architecture-docs");
const metaDest = resolve(here, "../dist/skill/meta.json");
const pkgPath = resolve(here, "../package.json");

try {
  await access(resolve(skillSrc, "SKILL.md"));
} catch {
  console.error(
    `[copy-skill] Skill source not found at ${skillSrc}. Expected the canonical skill at .claude/skills/architecture-docs/.`,
  );
  process.exit(1);
}

const pkg = JSON.parse(await readFile(pkgPath, "utf8"));

await mkdir(dirname(skillDest), { recursive: true });
await cp(skillSrc, skillDest, { recursive: true });

await writeFile(
  metaDest,
  JSON.stringify({ name: "architecture-docs", version: pkg.version }, null, 2) + "\n",
);

console.log(`[copy-skill] Bundled architecture-docs@${pkg.version} -> dist/skill/`);
