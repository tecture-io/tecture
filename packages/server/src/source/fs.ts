import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import type {
  ApiDiagramLayoutUpdate,
  DiagramFile,
  DiagramLayoutFile,
  ManifestFile,
  NodeLayoutEntry,
} from "@tecture/shared";
import {
  type ArchitectureDataSource,
  DescriptionNotFoundError,
  DiagramNotFoundError,
  type LayoutStore,
  SLUG_RE,
  emptyLayout,
  isFiniteNumber,
  isValidLayoutEntry,
  normalizeLayoutUpdate,
} from "./types.js";

export function safeJoin(root: string, ...segments: string[]): string {
  const absRoot = resolve(root);
  const candidate = resolve(join(absRoot, ...segments));
  const guard = absRoot.endsWith(sep) ? absRoot : absRoot + sep;
  if (candidate !== absRoot && !candidate.startsWith(guard)) {
    throw new Error(`Path escapes architecture root: ${candidate}`);
  }
  return candidate;
}

function isNodeErrnoError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}

async function loadJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as T;
}

export class FsArchitectureDataSource implements ArchitectureDataSource {
  constructor(private readonly root: string) {}

  async loadManifest(): Promise<ManifestFile> {
    const path = safeJoin(this.root, "manifest.json");
    return loadJsonFile<ManifestFile>(path);
  }

  async loadDiagram(slug: string): Promise<DiagramFile> {
    if (!SLUG_RE.test(slug)) throw new DiagramNotFoundError(slug);
    const path = safeJoin(this.root, "diagrams", `${slug}.json`);
    try {
      return await loadJsonFile<DiagramFile>(path);
    } catch (err) {
      if (isNodeErrnoError(err) && err.code === "ENOENT") {
        throw new DiagramNotFoundError(slug);
      }
      throw err;
    }
  }

  async loadDescription(nodeId: string): Promise<string> {
    if (!SLUG_RE.test(nodeId)) throw new DescriptionNotFoundError(nodeId);
    const path = safeJoin(this.root, "descriptions", `${nodeId}.md`);
    try {
      return await readFile(path, "utf8");
    } catch (err) {
      if (isNodeErrnoError(err) && err.code === "ENOENT") {
        throw new DescriptionNotFoundError(nodeId);
      }
      throw err;
    }
  }
}

export class FsLayoutStore implements LayoutStore {
  constructor(private readonly tectureRoot: string) {}

  private path(slug: string): string {
    return safeJoin(this.tectureRoot, "layouts", `${slug}.json`);
  }

  async loadLayout(slug: string): Promise<DiagramLayoutFile> {
    if (!SLUG_RE.test(slug)) return emptyLayout(slug);
    const path = this.path(slug);
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
        if (!isValidLayoutEntry(entry)) continue;
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

  async saveLayout(
    slug: string,
    update: ApiDiagramLayoutUpdate,
  ): Promise<DiagramLayoutFile> {
    const file = normalizeLayoutUpdate(slug, update);
    const path = this.path(slug);
    await mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.tmp`;
    await writeFile(tmp, `${JSON.stringify(file, null, 2)}\n`, "utf8");
    await rename(tmp, path);
    return file;
  }
}
