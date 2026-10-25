import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@tecture/web/App";
import { mergeAppearance, type GraphAppearance } from "@tecture/shared";
import "./styles.css";
import "@xyflow/react/dist/style.css";
import { createPostMessageDataSource, vscode } from "./postMessageDataSource";

declare global {
  interface Window {
    /** Seeded by the host in composeHtml() so the first paint uses user settings. */
    __TECTURE_APPEARANCE__?: unknown;
  }
}

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing in index.html");

const dataSource = createPostMessageDataSource();

function parseDiagramSlug(hash: string): string | null {
  const match = hash.match(/^#\/diagram\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

function Shell() {
  const [reloadKey, setReloadKey] = useState(0);
  const [appearance, setAppearance] = useState<GraphAppearance>(() =>
    mergeAppearance(window.__TECTURE_APPEARANCE__),
  );
  const lastReportedSlug = useRef<string | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg && typeof msg === "object" && msg.type === "refresh") {
        setReloadKey((k) => k + 1);
      }
      if (msg && typeof msg === "object" && msg.type === "appearance") {
        setAppearance(mergeAppearance(msg.overrides));
      }
      if (msg && typeof msg === "object" && msg.type === "selectDiagram") {
        window.location.hash = `#/diagram/${encodeURIComponent(msg.slug)}`;
      }
    };
    window.addEventListener("message", onMessage);
    vscode.postMessage({ type: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Notify the host whenever the active diagram changes so the sidebar tree
  // can follow drill-ins and in-canvas navigation. Deduped so re-asserting the
  // same slug never produces a redundant message (no circular events).
  useEffect(() => {
    const reportActiveDiagram = () => {
      const slug = parseDiagramSlug(window.location.hash);
      if (!slug || slug === lastReportedSlug.current) return;
      lastReportedSlug.current = slug;
      vscode.postMessage({ type: "diagramChanged", slug });
    };
    reportActiveDiagram();
    window.addEventListener("hashchange", reportActiveDiagram);
    return () => window.removeEventListener("hashchange", reportActiveDiagram);
  }, []);

  return (
    <App
      dataSource={dataSource}
      reloadKey={reloadKey}
      showDiagramList={false}
      appearance={appearance}
    />
  );
}

createRoot(container).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>,
);
