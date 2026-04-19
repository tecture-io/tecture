import { useEffect, useState } from "react";
import { StyleGuide } from "./StyleGuide";
import { ArchitectureView } from "./architecture/ArchitectureView";

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function parseRoute(hash: string): { view: "architecture" | "style-guide"; diagramId: string | null } {
  if (hash === "#/style-guide") return { view: "style-guide", diagramId: null };
  const match = hash.match(/^#\/diagram\/([^/?#]+)/);
  if (match) return { view: "architecture", diagramId: decodeURIComponent(match[1]!) };
  return { view: "architecture", diagramId: null };
}

export function App() {
  const hash = useHashRoute();
  const route = parseRoute(hash);
  if (route.view === "style-guide") return <StyleGuide />;
  return <ArchitectureView diagramId={route.diagramId} />;
}
