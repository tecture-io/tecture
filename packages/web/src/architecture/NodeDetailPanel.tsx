import { useCallback, useState } from "react";
import type { DriftFinding, NodeMetaType } from "@tecture/shared";
import {
  buildDeepDivePrompt,
  buildSourceUrl,
  driftForNode,
  isDeepDivable,
} from "@tecture/shared";
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
  const driftFindings =
    bundle.drift && detail
      ? driftForNode(bundle.drift, detail.diagramId, nodeId)
      : [];
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
        <div className="min-w-0 flex-1">
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
          {path || (detail && isDeepDivable(detail)) ? (
            <div className="mt-1.5 flex w-full items-center gap-x-3">
              {path ? (
                <OpenSourceAction
                  path={path}
                  accent={style.accent}
                  onOpenInEditor={
                    openInEditor ? () => openInEditor(path) : undefined
                  }
                  sourceUrl={sourceUrl}
                />
              ) : null}
              {detail && isDeepDivable(detail) ? (
                <CopyPromptButton
                  prompt={buildDeepDivePrompt(detail)}
                  accent={style.accent}
                  className="ml-auto"
                />
              ) : null}
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
        {driftFindings.length > 0 && (
          <EvidenceSection findings={driftFindings} />
        )}
      </div>
    </aside>
  );
}

const EVIDENCE_SEVERITY_COLORS: Record<DriftFinding["severity"], string> = {
  error: "#f87171",
  warn: "#fbbf24",
  info: "#38bdf8",
};

/** Drift findings touching this node, from the evidence script's report. */
function EvidenceSection({ findings }: { findings: DriftFinding[] }) {
  return (
    <div
      className="mt-4 border-t pt-3"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div
        className="mb-2 text-[9px] tracking-[0.25em] uppercase"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        Evidence ({findings.length})
      </div>
      <div className="flex flex-col gap-1.5">
        {findings.map((finding, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-[11px] leading-snug"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span
              className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                backgroundColor: EVIDENCE_SEVERITY_COLORS[finding.severity],
              }}
              title={finding.severity}
            />
            <span style={{ color: "var(--text-primary, #e2e8f0)" }}>
              {finding.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ACTION_CLASS =
  "inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80";

function actionStyle(accent: string) {
  return {
    color: accent,
    fontFamily: "var(--font-mono)",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
  } as const;
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
      <button
        type="button"
        className={ACTION_CLASS}
        style={actionStyle(accent)}
        onClick={onOpenInEditor}
        title={path}
      >
        {icon}
        <span>{isDir ? "Open folder" : "Open file"}</span>
      </button>
    );
  }
  if (sourceUrl) {
    return (
      <a
        className={ACTION_CLASS}
        style={actionStyle(accent)}
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        title={path}
      >
        {icon}
        <span>{isDir ? "View folder" : "View file"}</span>
      </a>
    );
  }
  return null;
}

/** Copies an auto-generated, id-keyed deep-dive prompt to paste into a coding agent. */
function CopyPromptButton({
  prompt,
  accent,
  className,
}: {
  prompt: string;
  accent: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    void copyText(prompt).then((ok) => {
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }, [prompt]);

  return (
    <button
      type="button"
      className={className ? `${ACTION_CLASS} ${className}` : ACTION_CLASS}
      style={actionStyle(accent)}
      onClick={onCopy}
      title="Copy a prompt to enrich this component's description with a coding agent"
    >
      {copied ? (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
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
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span>{copied ? "Copied" : "Copy deep-dive prompt"}</span>
    </button>
  );
}

/**
 * Copy text to the clipboard, falling back to a hidden textarea + execCommand for
 * restrictive hosts (e.g. the VS Code webview) where the async clipboard API may be
 * unavailable. Returns whether the copy succeeded.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the execCommand path
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
