import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { createHttpDataSource } from "./architecture/dataSource";
import "@xyflow/react/dist/style.css";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing in index.html");

createRoot(container).render(
  <React.StrictMode>
    <App dataSource={createHttpDataSource()} />
  </React.StrictMode>,
);
