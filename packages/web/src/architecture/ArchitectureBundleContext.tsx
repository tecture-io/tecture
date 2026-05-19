import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ApiArchitectureSummary,
  ApiDiagram,
  ApiNodeDetail,
  DiagramLayoutFile,
} from "@tecture/shared";
import { LoadingSplash } from "./LoadingSplash";

export interface ArchitectureBundle {
  summary: ApiArchitectureSummary;
  diagrams: Record<string, ApiDiagram>;
  layouts: Record<string, DiagramLayoutFile>;
  nodes: Record<string, ApiNodeDetail>;
  missingDescriptions: Set<string>;
}

export type BundlePhase = "summary" | "diagrams" | "descriptions";

export type BundleState =
  | {
      status: "loading";
      phase: BundlePhase;
      done: number;
      total: number;
      archName?: string;
    }
  | { status: "error"; message: string }
  | { status: "ready"; bundle: ArchitectureBundle };

interface ContextValue {
  bundle: ArchitectureBundle;
  updateLayout: (slug: string, layout: DiagramLayoutFile) => void;
}

const ArchitectureBundleContext = createContext<ContextValue | null>(null);

export function useArchitectureBundle(): ArchitectureBundle {
  const ctx = useContext(ArchitectureBundleContext);
  if (!ctx) {
    throw new Error(
      "useArchitectureBundle must be used inside ArchitectureBundleProvider",
    );
  }
  return ctx.bundle;
}

export function useUpdateLayout(): (
  slug: string,
  layout: DiagramLayoutFile,
) => void {
  const ctx = useContext(ArchitectureBundleContext);
  if (!ctx) {
    throw new Error(
      "useUpdateLayout must be used inside ArchitectureBundleProvider",
    );
  }
  return ctx.updateLayout;
}

const emptyLayout = (slug: string): DiagramLayoutFile => ({
  version: 1,
  diagramId: slug,
  updatedAt: "",
  nodes: {},
});

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(body?.message ?? `HTTP ${res.status} on ${url}`);
  }
  return (await res.json()) as T;
}

async function fetchJsonOr<T>(url: string, fallback: T): Promise<T> {
  try {
    return await fetchJson<T>(url);
  } catch {
    return fallback;
  }
}

export function ArchitectureBundleProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<BundleState>({
    status: "loading",
    phase: "summary",
    done: 0,
    total: 1,
  });

  useEffect(() => {
    let cancelled = false;
    void loadBundle({
      onState: (next) => {
        if (!cancelled) setState(next);
      },
      isCancelled: () => cancelled,
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateLayout = useCallback(
    (slug: string, layout: DiagramLayoutFile) => {
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          status: "ready",
          bundle: {
            ...prev.bundle,
            layouts: { ...prev.bundle.layouts, [slug]: layout },
          },
        };
      });
    },
    [],
  );

  const bundle = state.status === "ready" ? state.bundle : null;
  const contextValue = useMemo<ContextValue | null>(() => {
    if (!bundle) return null;
    return { bundle, updateLayout };
  }, [bundle, updateLayout]);

  if (state.status !== "ready") {
    return <LoadingSplash state={state} />;
  }
  if (!contextValue) return null;

  return (
    <ArchitectureBundleContext.Provider value={contextValue}>
      {children}
    </ArchitectureBundleContext.Provider>
  );
}

interface LoadCallbacks {
  onState: (state: BundleState) => void;
  isCancelled: () => boolean;
}

async function loadBundle({ onState, isCancelled }: LoadCallbacks): Promise<void> {
  try {
    onState({ status: "loading", phase: "summary", done: 0, total: 1 });
    const summary = await fetchJson<ApiArchitectureSummary>("/api/architecture");
    if (isCancelled()) return;

    const diagramSlugs = summary.diagrams.map((d) => d.slug);
    let diagramsDone = 0;
    const diagramTotal = diagramSlugs.length * 2;
    onState({
      status: "loading",
      phase: "diagrams",
      done: 0,
      total: diagramTotal,
      archName: summary.name,
    });

    const bumpDiagrams = () => {
      diagramsDone += 1;
      onState({
        status: "loading",
        phase: "diagrams",
        done: diagramsDone,
        total: diagramTotal,
        archName: summary.name,
      });
    };

    const diagramResults = await Promise.all(
      diagramSlugs.map(async (slug) => {
        const diagramPromise = fetchJson<ApiDiagram>(
          `/api/architecture/diagrams/${encodeURIComponent(slug)}`,
        ).then((d) => {
          if (!isCancelled()) bumpDiagrams();
          return d;
        });
        const layoutPromise = fetchJsonOr<DiagramLayoutFile>(
          `/api/architecture/diagrams/${encodeURIComponent(slug)}/layout`,
          emptyLayout(slug),
        ).then((l) => {
          if (!isCancelled()) bumpDiagrams();
          return l;
        });
        const [diagram, layout] = await Promise.all([
          diagramPromise,
          layoutPromise,
        ]);
        return { slug, diagram, layout };
      }),
    );
    if (isCancelled()) return;

    const diagrams: Record<string, ApiDiagram> = {};
    const layouts: Record<string, DiagramLayoutFile> = {};
    const nodeIds = new Set<string>();
    for (const { slug, diagram, layout } of diagramResults) {
      diagrams[slug] = diagram;
      layouts[slug] = layout;
      for (const node of diagram.nodes ?? []) nodeIds.add(node.id);
    }

    const nodeIdList = [...nodeIds];
    let nodesDone = 0;
    onState({
      status: "loading",
      phase: "descriptions",
      done: 0,
      total: nodeIdList.length,
      archName: summary.name,
    });

    const bumpNodes = () => {
      nodesDone += 1;
      onState({
        status: "loading",
        phase: "descriptions",
        done: nodesDone,
        total: nodeIdList.length,
        archName: summary.name,
      });
    };

    const nodes: Record<string, ApiNodeDetail> = {};
    const missing = new Set<string>();
    await Promise.all(
      nodeIdList.map(async (id) => {
        try {
          const detail = await fetchJson<ApiNodeDetail>(
            `/api/architecture/nodes/${encodeURIComponent(id)}`,
          );
          nodes[id] = detail;
        } catch {
          missing.add(id);
        } finally {
          if (!isCancelled()) bumpNodes();
        }
      }),
    );
    if (isCancelled()) return;

    onState({
      status: "ready",
      bundle: {
        summary,
        diagrams,
        layouts,
        nodes,
        missingDescriptions: missing,
      },
    });
  } catch (err) {
    if (isCancelled()) return;
    const message = err instanceof Error ? err.message : String(err);
    onState({ status: "error", message });
  }
}
