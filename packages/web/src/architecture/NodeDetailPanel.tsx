import type { NodeMetaType } from "@tecture/shared";
import { getNodeStyle } from "./nodeStyles";
import { MarkdownContent } from "./MarkdownContent";
import { useArchitectureBundle } from "./ArchitectureBundleContext";

interface Props {
  nodeId: string;
  onClose: () => void;
}

export function NodeDetailPanel({ nodeId, onClose }: Props) {
  const bundle = useArchitectureBundle();
  const detail = bundle.nodes[nodeId];
  const missingDescription = bundle.missingDescriptions.has(nodeId);
  const style = getNodeStyle(detail?.meta?.type as NodeMetaType | undefined);

  return (
    <aside
      className="animate-slide-in-right absolute top-3 right-3 z-10 flex flex-col border shadow-lg backdrop-blur-md"
      style={{
        width: "min(520px, calc(100vw - 24px))",
        maxHeight: "calc(100vh - 24px)",
        backgroundColor: "rgba(10, 15, 26, 0.85)",
        borderColor: "var(--border-default)",
      }}
    >
      <div
        className="flex shrink-0 items-start justify-between border-b px-5 py-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="min-w-0">
          <div
            className="blueprint-annotation mb-1"
            style={{ color: style.accent }}
          >
            {style.label}
          </div>
          <div
            className="truncate text-base leading-tight font-semibold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
          >
            {detail?.label ?? nodeId}
          </div>
          {detail?.meta?.technology ? (
            <div
              className="mt-0.5 text-xs"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              {String(detail.meta.technology)}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex h-7 w-7 shrink-0 items-center justify-center border transition-colors hover:text-white"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-muted)",
            backgroundColor: "transparent",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {!detail && (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            No details available for this node.
          </div>
        )}
        {detail && missingDescription && (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Description not available.
          </div>
        )}
        {detail && !missingDescription &&
          (detail.description ? (
            <MarkdownContent source={detail.description} />
          ) : (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              No description provided.
            </div>
          ))}
      </div>
    </aside>
  );
}
