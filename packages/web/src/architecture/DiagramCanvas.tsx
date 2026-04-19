import { useEffect, useMemo, useState } from "react";
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
import type { ApiDiagram } from "@tecture/shared";
import { ArchitectureNode } from "./ArchitectureNode";
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

function DiagramCanvasInner({ diagramId, onSelectNode, onDrillIn }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ArchNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setReady(false);
    setNodes([]);
    setEdges([]);
    onSelectNode(null);

    fetch(`/api/architecture/diagrams/${encodeURIComponent(diagramId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(body?.message ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<ApiDiagram>;
      })
      .then(async (diagram) => {
        if (cancelled) return;
        const { nodes: rfNodes, edges: rfEdges } = diagramToFlow(diagram);
        const positioned = await layoutDiagram(
          rfNodes,
          rfEdges,
          diagram.meta?.direction,
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
    };
  }, [diagramId, onSelectNode, setEdges, setNodes]);

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
