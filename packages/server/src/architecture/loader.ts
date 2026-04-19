import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type {
  ApiArchitectureSummary,
  ApiDiagramSummary,
  ArchitectureNode,
  DiagramFile,
  ManifestFile,
} from "@tecture/shared";

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class DiagramNotFoundError extends Error {
  constructor(public readonly slug: string) {
    super(`Diagram not found: ${slug}`);
    this.name = "DiagramNotFoundError";
  }
}

export class NodeNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Node not found: ${id}`);
    this.name = "NodeNotFoundError";
  }
}

export class DescriptionNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Description not found: ${id}`);
    this.name = "DescriptionNotFoundError";
  }
}

function isNodeErrnoError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}

function safeJoin(root: string, ...segments: string[]): string {
  const absRoot = resolve(root);
  const candidate = resolve(join(absRoot, ...segments));
  const guard = absRoot.endsWith(sep) ? absRoot : absRoot + sep;
  if (candidate !== absRoot && !candidate.startsWith(guard)) {
    throw new Error(`Path escapes architecture root: ${candidate}`);
  }
  return candidate;
}

async function loadJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as T;
}

export async function loadManifest(root: string): Promise<ManifestFile> {
  const path = safeJoin(root, "manifest.json");
  return loadJsonFile<ManifestFile>(path);
}

export async function loadDiagram(
  root: string,
  slug: string,
): Promise<DiagramFile> {
  if (!SLUG_RE.test(slug)) throw new DiagramNotFoundError(slug);
  const path = safeJoin(root, "diagrams", `${slug}.json`);
  try {
    return await loadJsonFile<DiagramFile>(path);
  } catch (err) {
    if (isNodeErrnoError(err) && err.code === "ENOENT") {
      throw new DiagramNotFoundError(slug);
    }
    throw err;
  }
}

export async function loadDescription(
  root: string,
  nodeId: string,
): Promise<string> {
  if (!SLUG_RE.test(nodeId)) throw new DescriptionNotFoundError(nodeId);
  const path = safeJoin(root, "descriptions", `${nodeId}.md`);
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    if (isNodeErrnoError(err) && err.code === "ENOENT") {
      throw new DescriptionNotFoundError(nodeId);
    }
    throw err;
  }
}

export async function buildArchitectureSummary(
  root: string,
): Promise<ApiArchitectureSummary> {
  const manifest = await loadManifest(root);
  const diagrams = await Promise.all(
    manifest.diagrams.map(async (slug): Promise<ApiDiagramSummary> => {
      const diagram = await loadDiagram(root, slug);
      return {
        slug,
        name: diagram.name,
        level: diagram.level,
        nodeCount: diagram.nodes?.length ?? 0,
        edgeCount: diagram.edges?.length ?? 0,
      };
    }),
  );
  return {
    name: manifest.name,
    description: manifest.description,
    topDiagram: manifest.topDiagram,
    diagrams,
  };
}

export async function findNode(
  root: string,
  nodeId: string,
): Promise<{ node: ArchitectureNode; diagramId: string }> {
  if (!SLUG_RE.test(nodeId)) throw new NodeNotFoundError(nodeId);
  const manifest = await loadManifest(root);
  for (const slug of manifest.diagrams) {
    let diagram: DiagramFile;
    try {
      diagram = await loadDiagram(root, slug);
    } catch (err) {
      if (err instanceof DiagramNotFoundError) continue;
      throw err;
    }
    const match = diagram.nodes?.find((n) => n.id === nodeId);
    if (match) return { node: match, diagramId: slug };
  }
  throw new NodeNotFoundError(nodeId);
}
