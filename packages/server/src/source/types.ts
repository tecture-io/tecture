import type {
  ApiArchitectureSummary,
  ApiDiagramLayoutUpdate,
  ApiDiagramSummary,
  ArchitectureNode,
  DiagramFile,
  DiagramLayoutFile,
  ManifestFile,
  NodeLayoutEntry,
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

export class LayoutInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LayoutInvalidError";
  }
}

export interface ArchitectureDataSource {
  loadManifest(): Promise<ManifestFile>;
  loadDiagram(slug: string): Promise<DiagramFile>;
  loadDescription(nodeId: string): Promise<string>;
}

export interface LayoutStore {
  loadLayout(slug: string): Promise<DiagramLayoutFile>;
  saveLayout(
    slug: string,
    update: ApiDiagramLayoutUpdate,
  ): Promise<DiagramLayoutFile>;
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function isValidLayoutEntry(v: unknown): v is NodeLayoutEntry {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  if (!isFiniteNumber(e.x) || !isFiniteNumber(e.y)) return false;
  if ("width" in e && e.width !== undefined && !isFiniteNumber(e.width)) return false;
  if ("height" in e && e.height !== undefined && !isFiniteNumber(e.height)) return false;
  return true;
}

export function emptyLayout(slug: string): DiagramLayoutFile {
  return { version: 1, diagramId: slug, updatedAt: "", nodes: {} };
}

export function normalizeLayoutUpdate(
  slug: string,
  update: ApiDiagramLayoutUpdate,
): DiagramLayoutFile {
  if (!SLUG_RE.test(slug)) {
    throw new LayoutInvalidError(`invalid diagram slug: ${slug}`);
  }
  if (
    !update ||
    typeof update !== "object" ||
    !update.nodes ||
    typeof update.nodes !== "object"
  ) {
    throw new LayoutInvalidError(
      "body must be { nodes: Record<string, { x, y, width?, height? }> }",
    );
  }
  const nodes: Record<string, NodeLayoutEntry> = {};
  for (const [id, entry] of Object.entries(update.nodes)) {
    if (!SLUG_RE.test(id)) {
      throw new LayoutInvalidError(`invalid node id: ${id}`);
    }
    if (!isValidLayoutEntry(entry)) {
      throw new LayoutInvalidError(`invalid layout entry for ${id}`);
    }
    const out: NodeLayoutEntry = { x: entry.x, y: entry.y };
    if (isFiniteNumber(entry.width)) out.width = entry.width;
    if (isFiniteNumber(entry.height)) out.height = entry.height;
    nodes[id] = out;
  }
  return {
    version: 1,
    diagramId: slug,
    updatedAt: new Date().toISOString(),
    nodes,
  };
}

export async function buildArchitectureSummary(
  source: ArchitectureDataSource,
): Promise<ApiArchitectureSummary> {
  const manifest = await source.loadManifest();
  const diagrams = await Promise.all(
    manifest.diagrams.map(async (slug): Promise<ApiDiagramSummary> => {
      const diagram = await source.loadDiagram(slug);
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
  source: ArchitectureDataSource,
  nodeId: string,
): Promise<{ node: ArchitectureNode; diagramId: string }> {
  if (!SLUG_RE.test(nodeId)) throw new NodeNotFoundError(nodeId);
  const manifest = await source.loadManifest();
  for (const slug of manifest.diagrams) {
    let diagram: DiagramFile;
    try {
      diagram = await source.loadDiagram(slug);
    } catch (err) {
      if (err instanceof DiagramNotFoundError) continue;
      throw err;
    }
    const match = diagram.nodes?.find((n) => n.id === nodeId);
    if (match) return { node: match, diagramId: slug };
  }
  throw new NodeNotFoundError(nodeId);
}
