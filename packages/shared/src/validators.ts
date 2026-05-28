import type {
  ApiArchitectureSummary,
  ApiDiagramLayoutUpdate,
  ApiDiagramSummary,
  ArchitectureNode,
  DiagramFile,
  DiagramLayoutFile,
  ManifestFile,
  NodeLayoutEntry,
  SourceHost,
} from "./index";

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
    source: manifest.source,
    sourceHost: manifest.sourceHost,
    topDiagram: manifest.topDiagram,
    diagrams,
  };
}

const HOST_DOMAINS: Array<{ host: SourceHost; match: RegExp }> = [
  { host: "github", match: /(^|\.)github\.com$/i },
  { host: "gitlab", match: /(^|\.)gitlab\.com$/i },
  { host: "bitbucket", match: /(^|\.)bitbucket\.org$/i },
];

function inferSourceHost(source: string): SourceHost | undefined {
  // Extract the hostname without relying on the URL global (kept lib-agnostic for shared):
  // scheme://[userinfo@]host[:port]/...
  const hostname = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]*@)?([^:/?#]+)/i.exec(source)?.[1];
  if (!hostname) return undefined;
  return HOST_DOMAINS.find(({ match }) => match.test(hostname))?.host;
}

/**
 * Build a web URL that views `path` (a repo-root-relative file or directory, trailing "/" = dir)
 * on the source repo host. `HEAD` resolves to the default branch so links stay current. Falls back
 * to the repo root when the host is unknown, and returns undefined when there is no source.
 */
export function buildSourceUrl(
  source: string | undefined,
  host: SourceHost | undefined,
  path: string,
): string | undefined {
  if (!source) return undefined;
  const base = source.replace(/\/+$/, "").replace(/\.git$/i, "");
  const resolvedHost = host ?? inferSourceHost(base);
  const isDir = path.endsWith("/");
  const encoded = path
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  if (!encoded) return base;
  switch (resolvedHost) {
    case "github":
      return `${base}/${isDir ? "tree" : "blob"}/HEAD/${encoded}`;
    case "gitlab":
      return `${base}/-/${isDir ? "tree" : "blob"}/HEAD/${encoded}`;
    case "bitbucket":
      return `${base}/src/HEAD/${encoded}`;
    default:
      return base;
  }
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
