import { createHash } from "node:crypto";
import { cp, readdir, readFile, rm, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function copyDir(src: string, dest: string): Promise<void> {
  await cp(src, dest, { recursive: true });
}

export async function removeDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/** List every file under `dir`, as paths relative to `dir`, sorted. */
async function listFiles(dir: string, base = dir): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full, base)));
    } else if (entry.isFile()) {
      out.push(relative(base, full));
    }
  }
  return out.sort();
}

/**
 * Content hash of a directory tree. Stable across machines (sorted relative
 * paths + file contents). Used to detect whether an installed skill was edited
 * locally before we overwrite it. `exclude` names are skipped at the top level.
 */
export async function hashDir(dir: string, exclude: string[] = []): Promise<string> {
  const files = (await listFiles(dir)).filter(
    (f) => !exclude.includes(f.split("/")[0] ?? f),
  );
  const hash = createHash("sha256");
  for (const f of files) {
    hash.update(f);
    hash.update("\0");
    hash.update(await readFile(join(dir, f)));
    hash.update("\0");
  }
  return "sha256:" + hash.digest("hex");
}
