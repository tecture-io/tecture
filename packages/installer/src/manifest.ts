import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathExists } from "./fsutil.js";

/** Marker file written next to the installed skill, used by sync/update. */
export const MANIFEST_FILE = ".tecture.json";

export interface InstallManifest {
  skill: string;
  version: string;
  agent: string;
  scope: "global" | "project";
  /** Hash of the payload as installed, so we can detect later local edits. */
  checksum: string;
  installedAt: string;
  /** Provenance, for humans inspecting the file. */
  installer: string;
}

export async function readManifest(skillDir: string): Promise<InstallManifest | null> {
  const file = join(skillDir, MANIFEST_FILE);
  if (!(await pathExists(file))) return null;
  try {
    return JSON.parse(await readFile(file, "utf8")) as InstallManifest;
  } catch {
    return null;
  }
}

export async function writeManifest(
  skillDir: string,
  manifest: InstallManifest,
): Promise<void> {
  await writeFile(
    join(skillDir, MANIFEST_FILE),
    JSON.stringify(manifest, null, 2) + "\n",
  );
}
