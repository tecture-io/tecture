import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@tecture/web/App";
import "./styles.css";
import "@xyflow/react/dist/style.css";
import { createPostMessageDataSource, vscode } from "./postMessageDataSource";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing in index.html");

const dataSource = createPostMessageDataSource();

function Shell() {
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg && typeof msg === "object" && msg.type === "refresh") {
        setReloadKey((k) => k + 1);
      }
      if (msg && typeof msg === "object" && msg.type === "selectDiagram") {
        window.location.hash = `#/diagram/${encodeURIComponent(msg.slug)}`;
      }
    };
    window.addEventListener("message", onMessage);
    vscode.postMessage({ type: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <App
      dataSource={dataSource}
      reloadKey={reloadKey}
      showDiagramList={false}
    />
  );
}

createRoot(container).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>,
);
