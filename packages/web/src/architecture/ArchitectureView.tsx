import { useCallback, useEffect, useState } from "react";
import type { ApiArchitectureSummary } from "@tecture/shared";
import { DiagramCanvas } from "./DiagramCanvas";
import { DiagramList } from "./DiagramList";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { KeyboardHint } from "./KeyboardHint";

interface Props {
  diagramId: string | null;
}

export function ArchitectureView({ diagramId }: Props) {
  const [summary, setSummary] = useState<ApiArchitectureSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/architecture")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiArchitectureSummary>;
      })
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setSummaryError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (diagramId || !summary) return;
    window.location.hash = `#/diagram/${summary.topDiagram}`;
  }, [diagramId, summary]);

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
        <CanvasPlaceholder
          message={
            summaryError
              ? `Error: ${summaryError}`
              : summary
                ? "Opening top diagram…"
                : "Loading architecture…"
          }
        />
      )}

      <DiagramList
        summary={summary}
        currentDiagramId={diagramId}
        onSelect={selectDiagram}
        onGoHome={() => {
          if (summary) selectDiagram(summary.topDiagram);
        }}
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
