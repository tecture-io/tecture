import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import type {
  ApiDiagram,
  ApiDiagramLayoutUpdate,
  DiagramLayoutFile,
  NodeLayoutEntry,
} from "@tecture/shared";
import { ArchitectureNode } from "./ArchitectureNode";
import { LayoutPersistenceContext } from "./LayoutPersistenceContext";
import { FloatingEdge } from "./edges/FloatingEdge";
import { diagramToFlow, type ArchNodeData } from "./transform";
import { layoutDiagram } from "./layout";

const nodeTypes = { architecture: ArchitectureNode };
const edgeTypes = { floating: FloatingEdge };

interface Props {
  diagramId: string;
  onSelectNode: (nodeId: string | null) => void;
  onDrillIn: (diagramId: string) => void;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; diagram: ApiDiagram };

export function DiagramCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

const emptyLayout = (slug: string): DiagramLayoutFile => ({
  version: 1,
  diagramId: slug,
  updatedAt: "",
  nodes: {},
});

function collectLayoutEntries(
  nodes: Node[],
): Record<string, NodeLayoutEntry> {
  const out: Record<string, NodeLayoutEntry> = {};
  for (const n of nodes) {
    const entry: NodeLayoutEntry = {
      x: n.position?.x ?? 0,
      y: n.position?.y ?? 0,
    };
    const w = n.width ?? (n.style?.width as number | undefined);
    const h = n.height ?? (n.style?.height as number | undefined);
    if (typeof w === "number" && Number.isFinite(w)) entry.width = w;
    if (typeof h === "number" && Number.isFinite(h)) entry.height = h;
    out[n.id] = entry;
  }
  return out;
}

function DiagramCanvasInner({ diagramId, onSelectNode, onDrillIn }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ArchNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [ready, setReady] = useState(false);
  const { getNodes } = useReactFlow();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDiagramIdRef = useRef(diagramId);
  currentDiagramIdRef.current = diagramId;

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setReady(false);
    setNodes([]);
    setEdges([]);
    onSelectNode(null);

    Promise.all([
      fetch(`/api/architecture/diagrams/${encodeURIComponent(diagramId)}`).then(
        async (res) => {
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as
              | { message?: string }
              | null;
            throw new Error(body?.message ?? `HTTP ${res.status}`);
          }
          return res.json() as Promise<ApiDiagram>;
        },
      ),
      fetch(
        `/api/architecture/diagrams/${encodeURIComponent(diagramId)}/layout`,
      ).then(async (res) => {
        if (!res.ok) return emptyLayout(diagramId);
        return (await res.json()) as DiagramLayoutFile;
      }),
    ])
      .then(async ([diagram, layout]) => {
        if (cancelled) return;
        const { nodes: rfNodes, edges: rfEdges } = diagramToFlow(diagram);
        const positioned = await layoutDiagram(
          rfNodes,
          rfEdges,
          diagram.meta?.direction,
          layout,
        );
        if (cancelled) return;
        setNodes(positioned as Node<ArchNodeData>[]);
        setEdges(rfEdges);
        setState({ status: "ready", diagram });
        requestAnimationFrame(() => !cancelled && setReady(true));
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });

    return () => {
      cancelled = true;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [diagramId, onSelectNode, setEdges, setNodes]);

  const persistLayout = useCallback(() => {
    const slug = currentDiagramIdRef.current;
    const update: ApiDiagramLayoutUpdate = { nodes: collectLayoutEntries(getNodes()) };
    fetch(`/api/architecture/diagrams/${encodeURIComponent(slug)}/layout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    }).catch((err) => {
      console.warn("[tecture] failed to persist layout", err);
    });
  }, [getNodes]);

  const notifyLayoutChanged = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      persistLayout();
    }, 150);
  }, [persistLayout]);

  const persistenceValue = useMemo(
    () => ({ notifyLayoutChanged }),
    [notifyLayoutChanged],
  );

  const onNodeDragStop = useCallback<NodeMouseHandler>(() => {
    notifyLayoutChanged();
  }, [notifyLayoutChanged]);

  const onNodeClick = useMemo<NodeMouseHandler>(
    () => (_event, node) => {
      onSelectNode(node.id);
    },
    [onSelectNode],
  );

  const onNodeDoubleClick = useMemo<NodeMouseHandler>(
    () => (_event, node) => {
      const data = node.data as ArchNodeData;
      if (data.subDiagramId) onDrillIn(data.subDiagramId);
    },
    [onDrillIn],
  );

  return (
    <LayoutPersistenceContext.Provider value={persistenceValue}>
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => onSelectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={2}
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 0.2s ease-in",
        }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={20}
          size={1}
          color="rgba(34, 78, 130, 0.12)"
        />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          nodeColor="#22d3ee"
          nodeStrokeColor="#1e2d4a"
          maskColor="rgba(10, 15, 26, 0.7)"
        />
      </ReactFlow>

      {state.status === "loading" && (
        <CanvasOverlay label="Loading diagram…" />
      )}
      {state.status === "error" && (
        <CanvasOverlay label={`Error: ${state.message}`} />
      )}
    </div>
    </LayoutPersistenceContext.Provider>
  );
}

function CanvasOverlay({ label }: { label: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
      }}
    >
      <span className="text-xs tracking-[0.3em] uppercase">{label}</span>
    </div>
  );
}
