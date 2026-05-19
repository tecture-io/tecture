import { useCallback, useEffect, useState } from "react";
import { DiagramCanvas } from "./DiagramCanvas";
import { DiagramList } from "./DiagramList";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { KeyboardHint } from "./KeyboardHint";
import { useArchitectureBundle } from "./ArchitectureBundleContext";

interface Props {
  diagramId: string | null;
}

export function ArchitectureView({ diagramId }: Props) {
  const bundle = useArchitectureBundle();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (diagramId) return;
    window.location.hash = `#/diagram/${bundle.summary.topDiagram}`;
  }, [diagramId, bundle.summary.topDiagram]);

  const selectDiagram = useCallback((slug: string) => {
    setSelectedNodeId(null);
    window.location.hash = `#/diagram/${slug}`;
  }, []);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-deep)" }}
    >
      {diagramId ? (
        <DiagramCanvas
          key={diagramId}
          diagramId={diagramId}
          onSelectNode={setSelectedNodeId}
          onDrillIn={selectDiagram}
        />
      ) : (
        <CanvasPlaceholder message="Opening top diagram…" />
      )}

      <DiagramList
        summary={bundle.summary}
        currentDiagramId={diagramId}
        onSelect={selectDiagram}
        onGoHome={() => selectDiagram(bundle.summary.topDiagram)}
      />
      <KeyboardHint />
      {selectedNodeId && (
        <NodeDetailPanel
          key={selectedNodeId}
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

function CanvasPlaceholder({ message }: { message: string }) {
  return (
    <div
      className="blueprint-grid pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
      }}
    >
      <span className="text-xs tracking-[0.3em] uppercase">{message}</span>
    </div>
  );
}
