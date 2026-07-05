export interface ApiHealthResponse {
  status: "ok";
  uptime: number;
  timestamp: string;
}

export type DiagramDirection = "TB" | "LR";
export type DiagramLevel = 1 | 2 | 3;
export type SourceHost = "github" | "gitlab" | "bitbucket";

export type NodeMetaType =
  | "system"
  | "person"
  | "service"
  | "database"
  | "queue"
  | "gateway"
  | "frontend"
  | "cache"
  | "storage"
  | "external";

export type EdgeMetaType =
  | "calls"
  | "reads"
  | "writes"
  | "publishes"
  | "subscribes"
  | "data-flow";

export interface NodeMeta {
  type?: NodeMetaType;
  technology?: string;
  isContainer?: boolean;
  [key: string]: unknown;
}

export interface EdgeMeta {
  type?: EdgeMetaType;
  [key: string]: unknown;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  parentId?: string | null;
  subDiagramId?: string | null;
  /** Repo-root-relative path to the file or directory this node maps to. Trailing "/" = directory. */
  path?: string;
  meta?: NodeMeta;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  meta?: EdgeMeta;
}

export interface DiagramFile {
  name: string;
  level?: DiagramLevel;
  meta?: {
    direction?: DiagramDirection;
    layout?: string;
  };
  nodes: ArchitectureNode[];
  edges?: ArchitectureEdge[];
}

export interface ManifestFile {
  name: string;
  description?: string;
  source?: string;
  sourceHost?: SourceHost;
  topDiagram: string;
  diagrams: string[];
}

export interface ApiDiagramSummary {
  slug: string;
  name: string;
  level?: DiagramLevel;
  nodeCount: number;
  edgeCount: number;
}

export interface ApiArchitectureSummary {
  name: string;
  description?: string;
  source?: string;
  sourceHost?: SourceHost;
  topDiagram: string;
  diagrams: ApiDiagramSummary[];
}

export interface ApiDiagram extends DiagramFile {
  slug: string;
  edges: ArchitectureEdge[];
}

export interface ApiDiagramNodes {
  diagramId: string;
  nodes: ArchitectureNode[];
}

export interface ApiDiagramEdges {
  diagramId: string;
  edges: ArchitectureEdge[];
}

export interface ApiNodeDetail extends ArchitectureNode {
  diagramId: string;
  description: string;
}

export interface NodeLayoutEntry {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface DiagramLayoutFile {
  version: 1;
  diagramId: string;
  updatedAt: string;
  nodes: Record<string, NodeLayoutEntry>;
}

export interface ApiDiagramLayout extends DiagramLayoutFile {}

export interface ApiDiagramLayoutUpdate {
  nodes: Record<string, NodeLayoutEntry>;
}

export type ApiArchitectureErrorCode =
  | "diagram_not_found"
  | "node_not_found"
  | "description_not_found"
  | "architecture_unreadable"
  | "layout_invalid"
  | "layout_not_supported";

export interface ApiArchitectureError {
  error: ApiArchitectureErrorCode;
  message?: string;
  slug?: string;
  id?: string;
}

export type TectureRequest =
  | { id: string; type: "loadSummary" }
  | { id: string; type: "loadDiagram"; slug: string }
  | { id: string; type: "loadLayout"; slug: string }
  | { id: string; type: "loadNodeDetail"; nodeId: string }
  | { id: string; type: "loadDrift" }
  | { id: string; type: "openFile"; path: string }
  | {
      id: string;
      type: "saveLayout";
      slug: string;
      update: ApiDiagramLayoutUpdate;
    };

export type TectureResponse =
  | { id: string; ok: true; data: unknown }
  | { id: string; ok: false; error: string };

export type TectureEvent =
  | { type: "refresh" }
  | { type: "selectDiagram"; slug: string };

export type TectureNotification =
  | { type: "ready" }
  | { type: "diagramChanged"; slug: string }
  // Anonymous usage signal emitted on real user actions (not data fetches).
  // Carries only a C4 level — never slugs, names, or content.
  | { type: "usage"; event: string; level?: number };

export * from "./validators";
export * from "./deepDive";
export * from "./drift";
