export interface ApiHealthResponse {
  status: "ok";
  uptime: number;
  timestamp: string;
}

export type DiagramDirection = "TB" | "LR";
export type DiagramLevel = 1 | 2 | 3;

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

export type ApiArchitectureErrorCode =
  | "diagram_not_found"
  | "node_not_found"
  | "description_not_found"
  | "architecture_unreadable";

export interface ApiArchitectureError {
  error: ApiArchitectureErrorCode;
  message?: string;
  slug?: string;
  id?: string;
}
