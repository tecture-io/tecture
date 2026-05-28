import type { NodeMetaType } from "@tecture/shared";
import { buildSourceUrl } from "@tecture/shared";
import { getNodeStyle } from "./nodeStyles";
import { MarkdownContent } from "./MarkdownContent";
import {
  useArchitectureBundle,
  useOpenInEditor,
} from "./ArchitectureBundleContext";

interface Props {
  nodeId: string;
  onClose: () => void;
}

export function NodeDetailPanel({ nodeId, onClose }: Props) {
  const bundle = useArchitectureBundle();
  const openInEditor = useOpenInEditor();
  const detail = bundle.nodes[nodeId];
  const missingDescription = bundle.missingDescriptions.has(nodeId);
  const style = getNodeStyle(detail?.meta?.type as NodeMetaType | undefined);
  const path = detail?.path;
  const sourceUrl = openInEditor
    ? undefined
    : path
      ? buildSourceUrl(bundle.summary.source, bundle.summary.sourceHost, path)
      : undefined;

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
          {path ? (
            <OpenSourceAction
              path={path}
              accent={style.accent}
              onOpenInEditor={openInEditor ? () => openInEditor(path) : undefined}
              sourceUrl={sourceUrl}
            />
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

function OpenSourceAction({
  path,
  accent,
  onOpenInEditor,
  sourceUrl,
}: {
  path: string;
  accent: string;
  onOpenInEditor?: () => void;
  sourceUrl?: string;
}) {
  const isDir = path.endsWith("/");
  const className =
    "mt-1.5 inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80";
  const style = {
    color: accent,
    fontFamily: "var(--font-mono)",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
  } as const;
  const icon = (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );

  if (onOpenInEditor) {
    return (
      <button type="button" className={className} style={style} onClick={onOpenInEditor} title={path}>
        {icon}
        <span>{isDir ? "Open folder" : "Open file"}</span>
      </button>
    );
  }
  if (sourceUrl) {
    return (
      <a className={className} style={style} href={sourceUrl} target="_blank" rel="noreferrer" title={path}>
        {icon}
        <span>{isDir ? "View folder" : "View file"}</span>
      </a>
    );
  }
  return null;
}
