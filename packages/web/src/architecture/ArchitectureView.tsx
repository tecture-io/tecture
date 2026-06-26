import { useCallback, useEffect, useState } from "react";
import { DiagramCanvas } from "./DiagramCanvas";
import { DiagramList } from "./DiagramList";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { KeyboardHint } from "./KeyboardHint";
import { OnboardingWizard } from "./OnboardingWizard";
import { useOnboarding } from "./useOnboarding";
import {
  useArchitectureBundle,
  useReportUsage,
} from "./ArchitectureBundleContext";

interface Props {
  diagramId: string | null;
  showDiagramList?: boolean;
}

// Last diagram we reported a view for. Module-scoped (not a component ref) so a
// StrictMode remount or any re-render can't double-count the same navigation.
let lastReportedDiagram: string | null = null;

export function ArchitectureView({ diagramId, showDiagramList = true }: Props) {
  const bundle = useArchitectureBundle();
  const reportUsage = useReportUsage();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const onboarding = useOnboarding();

  useEffect(() => {
    if (diagramId) return;
    window.location.hash = `#/diagram/${bundle.summary.topDiagram}`;
  }, [diagramId, bundle.summary.topDiagram]);

  // Usage: one event per diagram the user actually navigates to, tagged with
  // its C4 level. This is the real "viewed" signal — not the bundle's
  // background prefetch of every diagram. Deduped by slug so re-renders (or a
  // changed summary reference) never double-count the same diagram.
  useEffect(() => {
    if (!diagramId || diagramId === lastReportedDiagram) return;
    lastReportedDiagram = diagramId;
    const level = bundle.summary.diagrams.find(
      (d) => d.slug === diagramId,
    )?.level;
    reportUsage("diagram.viewed", typeof level === "number" ? { level } : {});
  }, [diagramId, bundle.summary.diagrams, reportUsage]);

  // Usage: fire only when the user opens a node's detail panel (a click), never
  // for the bundle's background prefetch of all node details.
  const handleSelectNode = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
      if (nodeId) reportUsage("node.inspected");
    },
    [reportUsage],
  );

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
          onSelectNode={handleSelectNode}
          onDrillIn={selectDiagram}
        />
      ) : (
        <CanvasPlaceholder message="Opening top diagram…" />
      )}

      {showDiagramList && (
        <DiagramList
          summary={bundle.summary}
          currentDiagramId={diagramId}
          onSelect={selectDiagram}
          onGoHome={() => selectDiagram(bundle.summary.topDiagram)}
        />
      )}
      <KeyboardHint />
      {selectedNodeId && (
        <NodeDetailPanel
          key={selectedNodeId}
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
      <HelpButton onClick={onboarding.openWizard} />
      <OnboardingWizard
        open={onboarding.open}
        onClose={onboarding.closeWizard}
        architectureName={bundle.summary.name}
        architectureDescription={bundle.summary.description}
      />
    </div>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Show getting started tour"
      title="Getting started"
      className="absolute right-4 z-10 flex h-8 w-8 items-center justify-center border shadow-lg backdrop-blur-md transition-colors hover:text-white"
      style={{
        // Sit just above the @xyflow Controls cluster (bottom-right) so the
        // help affordance reads as part of the canvas controls.
        bottom: "132px",
        borderColor: "var(--border-default)",
        backgroundColor: "rgba(10, 15, 26, 0.85)",
        color: "var(--text-muted)",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>
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
