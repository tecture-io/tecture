// Bundles the canonical skill into this package, exactly like the installer's
// copy-skill.mjs — @tecture/install inlines @tecture/skill's code via tsup,
// and that code resolves the payload relative to the executing module
// (dist/skill/), so this package must carry its own copy.
//
// The meta.json version is stamped with @tecture/skill's version (NOT this
// package's): the skill version is coupled to @tecture/skill, and the
// .tecture.json manifests written on user machines must agree no matter which
// installer ran.
import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const skillSrc = resolve(here, "../../../.claude/skills/architecture-docs");
const skillDest = resolve(here, "../dist/skill/architecture-docs");
const metaDest = resolve(here, "../dist/skill/meta.json");
const skillPkgPath = resolve(here, "../../installer/package.json");

try {
  await access(resolve(skillSrc, "SKILL.md"));
} catch {
  console.error(
    `[copy-skill-bundle] Skill source not found at ${skillSrc}. Expected the canonical skill at .claude/skills/architecture-docs/.`,
  );
  process.exit(1);
}

const skillPkg = JSON.parse(await readFile(skillPkgPath, "utf8"));

await mkdir(dirname(skillDest), { recursive: true });
await cp(skillSrc, skillDest, { recursive: true });

await writeFile(
  metaDest,
  JSON.stringify({ name: "architecture-docs", version: skillPkg.version }, null, 2) +
    "\n",
);

console.log(
  `[copy-skill-bundle] Bundled architecture-docs@${skillPkg.version} -> dist/skill/`,
);
