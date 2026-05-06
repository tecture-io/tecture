import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  ApiDiagramLayoutUpdate,
  DiagramLayoutFile,
  NodeLayoutEntry,
} from "@tecture/shared";
import { SLUG_RE, isNodeErrnoError, safeJoin } from "./loader.js";

export class LayoutInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LayoutInvalidError";
  }
}

function emptyLayout(slug: string): DiagramLayoutFile {
  return { version: 1, diagramId: slug, updatedAt: "", nodes: {} };
}

function layoutPath(tectureRoot: string, slug: string): string {
  return safeJoin(tectureRoot, "layouts", `${slug}.json`);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isValidEntry(v: unknown): v is NodeLayoutEntry {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  if (!isFiniteNumber(e.x) || !isFiniteNumber(e.y)) return false;
  if ("width" in e && e.width !== undefined && !isFiniteNumber(e.width)) return false;
  if ("height" in e && e.height !== undefined && !isFiniteNumber(e.height)) return false;
  return true;
}

export async function loadLayout(
  tectureRoot: string,
  slug: string,
): Promise<DiagramLayoutFile> {
  if (!SLUG_RE.test(slug)) return emptyLayout(slug);
  const path = layoutPath(tectureRoot, slug);
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    if (isNodeErrnoError(err) && err.code === "ENOENT") return emptyLayout(slug);
    console.warn(`[tecture] failed to read layout ${path}: ${String(err)}`);
    return emptyLayout(slug);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn(`[tecture] malformed layout JSON at ${path}: ${String(err)}`);
    return emptyLayout(slug);
  }

  if (!parsed || typeof parsed !== "object") return emptyLayout(slug);
  const p = parsed as Record<string, unknown>;
  const nodes: Record<string, NodeLayoutEntry> = {};
  if (p.nodes && typeof p.nodes === "object") {
    for (const [id, entry] of Object.entries(p.nodes as Record<string, unknown>)) {
      if (!SLUG_RE.test(id)) continue;
      if (!isValidEntry(entry)) continue;
      const out: NodeLayoutEntry = { x: entry.x, y: entry.y };
      if (isFiniteNumber(entry.width)) out.width = entry.width;
      if (isFiniteNumber(entry.height)) out.height = entry.height;
      nodes[id] = out;
    }
  }
  return {
    version: 1,
    diagramId: slug,
    updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : "",
    nodes,
  };
}

export async function saveLayout(
  tectureRoot: string,
  slug: string,
  update: ApiDiagramLayoutUpdate,
): Promise<DiagramLayoutFile> {
  if (!SLUG_RE.test(slug)) {
    throw new LayoutInvalidError(`invalid diagram slug: ${slug}`);
  }
  if (!update || typeof update !== "object" || !update.nodes || typeof update.nodes !== "object") {
    throw new LayoutInvalidError("body must be { nodes: Record<string, { x, y, width?, height? }> }");
  }

  const nodes: Record<string, NodeLayoutEntry> = {};
  for (const [id, entry] of Object.entries(update.nodes)) {
    if (!SLUG_RE.test(id)) {
      throw new LayoutInvalidError(`invalid node id: ${id}`);
    }
    if (!isValidEntry(entry)) {
      throw new LayoutInvalidError(`invalid layout entry for ${id}`);
    }
    const out: NodeLayoutEntry = { x: entry.x, y: entry.y };
    if (isFiniteNumber(entry.width)) out.width = entry.width;
    if (isFiniteNumber(entry.height)) out.height = entry.height;
    nodes[id] = out;
  }

  const file: DiagramLayoutFile = {
    version: 1,
    diagramId: slug,
    updatedAt: new Date().toISOString(),
    nodes,
  };

  const path = layoutPath(tectureRoot, slug);
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  await rename(tmp, path);
  return file;
}
