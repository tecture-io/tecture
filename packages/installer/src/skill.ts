import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface BundledSkill {
  /** Skill folder name, e.g. "architecture-docs". */
  name: string;
  /** Version, coupled to the @tecture/skill package version at build time. */
  version: string;
  /** Absolute path to the skill payload that gets copied into agent dirs. */
  payloadDir: string;
}

/**
 * Resolve the skill bundled into this package at build time. Layout produced by
 * scripts/copy-skill.mjs:
 *   dist/skill/meta.json
 *   dist/skill/architecture-docs/   <- payload copied to agents
 */
export async function loadBundledSkill(): Promise<BundledSkill> {
  const here = dirname(fileURLToPath(import.meta.url));
  const skillRoot = resolve(here, "skill");
  const meta = JSON.parse(await readFile(resolve(skillRoot, "meta.json"), "utf8")) as {
    name: string;
    version: string;
  };
  return {
    name: meta.name,
    version: meta.version,
    payloadDir: resolve(skillRoot, meta.name),
  };
}
