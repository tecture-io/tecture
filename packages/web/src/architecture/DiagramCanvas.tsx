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
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import type {
  ApiDiagramLayoutUpdate,
  DiagramLayoutFile,
  NodeLayoutEntry,
} from "@tecture/shared";
import { ArchitectureNode } from "./ArchitectureNode";
import { Legend } from "./Legend";
import { LayoutPersistenceContext } from "./LayoutPersistenceContext";
import { FloatingEdge } from "./edges/FloatingEdge";
import { diagramToFlow, type ArchNodeData } from "./transform";
import { layoutDiagram } from "./layout";
import {
  useArchitectureBundle,
  useSaveLayout,
} from "./ArchitectureBundleContext";

const nodeTypes = { architecture: ArchitectureNode };
const edgeTypes = { floating: FloatingEdge };

interface Props {
  diagramId: string;
  onSelectNode: (nodeId: string | null) => void;
  onDrillIn: (diagramId: string) => void;
}

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
  const bundle = useArchitectureBundle();
  const saveLayout = useSaveLayout();
  const diagram = bundle.diagrams[diagramId];

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ArchNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [ready, setReady] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDiagramIdRef = useRef(diagramId);
  currentDiagramIdRef.current = diagramId;
  const layoutRef = useRef(bundle.layouts[diagramId]);
  layoutRef.current = bundle.layouts[diagramId];
  // Positions sent to saveLayout that bundle.layouts may not reflect yet.
  const unsavedEntriesRef = useRef<Record<string, NodeLayoutEntry> | null>(
    null,
  );

  // Read the nodes this canvas last rendered: during unmount cleanup React
  // Flow's store is already empty (getNodes() saved {} on navigation).
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const persistLayout = useCallback(() => {
    const slug = currentDiagramIdRef.current;
    const entries = collectLayoutEntries(nodesRef.current);
    unsavedEntriesRef.current = entries;
    const update: ApiDiagramLayoutUpdate = { nodes: entries };
    saveLayout(slug, update)
      .catch((err) => {
        console.warn("[tecture] failed to persist layout", err);
      })
      .finally(() => {
        if (unsavedEntriesRef.current === entries) {
          unsavedEntriesRef.current = null;
        }
      });
  }, [saveLayout]);
  const persistLayoutRef = useRef(persistLayout);
  persistLayoutRef.current = persistLayout;

  // Saves a debounced drag/resize now, while the canvas still holds the
  // user's positions.
  const flushPendingSave = useCallback(() => {
    if (!saveTimeoutRef.current) return;
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = null;
    persistLayoutRef.current();
  }, []);

  // Mount-only: a fresh canvas (the parent keys it by diagramId) starts with no
  // selection. A data reload re-runs the layout effect below but must not
  // clear the selection, so this lives in its own effect.
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  useEffect(() => {
    onSelectNodeRef.current(null);
  }, []);

  // Leaving the diagram inside the debounce window must not drop the save.
  useEffect(() => flushPendingSave, [flushPendingSave]);

  // Re-runs when the diagram object changes (first load and every file-change
  // reload). Layout saves only replace bundle.layouts, so they never land here.
  // The viewport is untouched: React Flow's `fitView` prop applies only on the
  // first render, so a reload keeps the user's camera.
  useEffect(() => {
    let cancelled = false;
    setLayoutError(null);

    if (!diagram) {
      setLayoutError(`Diagram "${diagramId}" was not loaded`);
      setNodes([]);
      setEdges([]);
      return () => {
        cancelled = true;
      };
    }

    // A drag that is still debounced or in flight isn't in bundle.layouts:
    // save it now and lay out from it, or the reload would snap those nodes
    // back and the late save would write the old positions to disk.
    flushPendingSave();
    const savedLayout = layoutRef.current ?? emptyLayout(diagramId);
    const unsaved = unsavedEntriesRef.current;
    const currentLayout = unsaved
      ? { ...savedLayout, nodes: { ...savedLayout.nodes, ...unsaved } }
      : savedLayout;
    const { nodes: rfNodes, edges: rfEdges } = diagramToFlow(diagram);
    layoutDiagram(rfNodes, rfEdges, diagram.meta?.direction, currentLayout)
      .then((positioned) => {
        if (cancelled) return;
        // Carry React Flow's selection highlight across a reload.
        setNodes((prev) => {
          const selected = new Set(
            prev.filter((n) => n.selected).map((n) => n.id),
          );
          return (positioned as Node<ArchNodeData>[]).map((n) =>
            selected.has(n.id) ? { ...n, selected: true } : n,
          );
        });
        setEdges(rfEdges);
        requestAnimationFrame(() => !cancelled && setReady(true));
      })
      .catch((err: Error) => {
        if (!cancelled) setLayoutError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [diagram, diagramId, flushPendingSave, setEdges, setNodes]);

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
        {diagram && <Legend diagram={diagram} />}
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          nodeColor="#22d3ee"
          nodeStrokeColor="#1e2d4a"
          maskColor="rgba(10, 15, 26, 0.7)"
        />
      </ReactFlow>

      {layoutError && (
        <CanvasOverlay label={`Error: ${layoutError}`} />
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
