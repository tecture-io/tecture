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
  ApiDiagramLayoutUpdate,
  ApiNodeDetail,
  DiagramLayoutFile,
  DriftReport,
} from "@tecture/shared";
import { LoadingSplash } from "./LoadingSplash";
import type { WebDataSource } from "./dataSource";

export interface ArchitectureBundle {
  summary: ApiArchitectureSummary;
  diagrams: Record<string, ApiDiagram>;
  layouts: Record<string, DiagramLayoutFile>;
  nodes: Record<string, ApiNodeDetail>;
  missingDescriptions: Set<string>;
  /** Drift report from the evidence script, or null when none exists. */
  drift: DriftReport | null;
  /** Whether the data source reports "Don't show again" for the onboarding tour. */
  onboardingDismissed: boolean;
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

/** Onboarding tour state owned by the provider; read it through useOnboarding. */
export interface OnboardingSession {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Persist "Don't show again"; undefined when the data source can't. */
  dismiss?: () => void;
}

interface ContextValue {
  bundle: ArchitectureBundle;
  saveLayout: (slug: string, update: ApiDiagramLayoutUpdate) => Promise<void>;
  openInEditor?: (path: string) => void;
  reportUsage: (event: string, props?: { level?: number }) => void;
  onboarding: OnboardingSession;
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

export function useSaveLayout(): (
  slug: string,
  update: ApiDiagramLayoutUpdate,
) => Promise<void> {
  const ctx = useContext(ArchitectureBundleContext);
  if (!ctx) {
    throw new Error(
      "useSaveLayout must be used inside ArchitectureBundleProvider",
    );
  }
  return ctx.saveLayout;
}

/** Returns the editor-open capability, or undefined when running in the browser. */
export function useOpenInEditor(): ((path: string) => void) | undefined {
  const ctx = useContext(ArchitectureBundleContext);
  if (!ctx) {
    throw new Error(
      "useOpenInEditor must be used inside ArchitectureBundleProvider",
    );
  }
  return ctx.openInEditor;
}

/** Returns the anonymous usage reporter (no-op when the data source omits it). */
export function useReportUsage(): (
  event: string,
  props?: { level?: number },
) => void {
  const ctx = useContext(ArchitectureBundleContext);
  if (!ctx) {
    throw new Error(
      "useReportUsage must be used inside ArchitectureBundleProvider",
    );
  }
  return ctx.reportUsage;
}

export function useOnboardingSession(): OnboardingSession {
  const ctx = useContext(ArchitectureBundleContext);
  if (!ctx) {
    throw new Error(
      "useOnboardingSession must be used inside ArchitectureBundleProvider",
    );
  }
  return ctx.onboarding;
}

export interface ArchitectureBundleProviderProps {
  dataSource: WebDataSource;
  children: ReactNode;
  /** Forces a reload when the value changes. */
  reloadKey?: unknown;
  /** Opens the onboarding tour when the value changes. */
  showOnboardingKey?: unknown;
}

export function ArchitectureBundleProvider({
  dataSource,
  children,
  reloadKey,
  showOnboardingKey,
}: ArchitectureBundleProviderProps) {
  const [state, setState] = useState<BundleState>({
    status: "loading",
    phase: "summary",
    done: 0,
    total: 1,
  });

  // The user's last open/close choice for the onboarding tour, or null before
  // they make one (then the data source's dismissal decides). It lives here,
  // not in ArchitectureView, because this provider stays mounted while it
  // reloads: a file-change refresh must not reopen a tour the user closed.
  const [onboardingChoice, setOnboardingChoice] = useState<boolean | null>(
    null,
  );

  // A changed showOnboardingKey (e.g. the host's reset command) reopens the
  // tour, even mid-reload. The initial value is ignored.
  const lastShowOnboardingKey = useRef(showOnboardingKey);
  useEffect(() => {
    if (Object.is(showOnboardingKey, lastShowOnboardingKey.current)) return;
    lastShowOnboardingKey.current = showOnboardingKey;
    setOnboardingChoice(true);
  }, [showOnboardingKey]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", phase: "summary", done: 0, total: 1 });
    void loadBundle({
      dataSource,
      onState: (next) => {
        if (!cancelled) setState(next);
      },
      isCancelled: () => cancelled,
    });
    return () => {
      cancelled = true;
    };
  }, [dataSource, reloadKey]);

  const saveLayout = useCallback(
    async (slug: string, update: ApiDiagramLayoutUpdate) => {
      const saved = await dataSource.saveLayout(slug, update);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          status: "ready",
          bundle: {
            ...prev.bundle,
            layouts: { ...prev.bundle.layouts, [slug]: saved },
          },
        };
      });
    },
    [dataSource],
  );

  const openInEditor = useMemo(
    () =>
      dataSource.openInEditor
        ? (path: string) => dataSource.openInEditor?.(path)
        : undefined,
    [dataSource],
  );

  const reportUsage = useCallback(
    (event: string, props?: { level?: number }) => {
      dataSource.reportUsage?.(event, props);
    },
    [dataSource],
  );

  const dismissOnboarding = useMemo(
    () =>
      dataSource.dismissOnboarding
        ? () => {
            dataSource.dismissOnboarding?.().catch((err) => {
              console.warn(
                "[tecture] failed to persist onboarding dismissal",
                err,
              );
            });
          }
        : undefined,
    [dataSource],
  );

  const bundle = state.status === "ready" ? state.bundle : null;
  const contextValue = useMemo<ContextValue | null>(() => {
    if (!bundle) return null;
    return {
      bundle,
      saveLayout,
      openInEditor,
      reportUsage,
      onboarding: {
        open: onboardingChoice ?? !bundle.onboardingDismissed,
        setOpen: setOnboardingChoice,
        dismiss: dismissOnboarding,
      },
    };
  }, [
    bundle,
    saveLayout,
    openInEditor,
    reportUsage,
    onboardingChoice,
    dismissOnboarding,
  ]);

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
  dataSource: WebDataSource;
  onState: (state: BundleState) => void;
  isCancelled: () => boolean;
}

async function loadBundle({
  dataSource,
  onState,
  isCancelled,
}: LoadCallbacks): Promise<void> {
  try {
    onState({ status: "loading", phase: "summary", done: 0, total: 1 });
    // Drift is optional decoration — load it alongside everything else and
    // never let its failure break the bundle.
    const driftPromise: Promise<DriftReport | null> = dataSource.loadDrift
      ? dataSource.loadDrift().catch(() => null)
      : Promise.resolve(null);
    const onboardingDismissedPromise: Promise<boolean> =
      dataSource.isOnboardingDismissed
        ? dataSource.isOnboardingDismissed().catch(() => false)
        : Promise.resolve(false);
    const summary = await dataSource.loadSummary();
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
        const diagramPromise = dataSource.loadDiagram(slug).then((d) => {
          if (!isCancelled()) bumpDiagrams();
          return d;
        });
        const layoutPromise = dataSource.loadLayout(slug).then((l) => {
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
          const detail = await dataSource.loadNodeDetail(id);
          nodes[id] = detail;
        } catch {
          missing.add(id);
        } finally {
          if (!isCancelled()) bumpNodes();
        }
      }),
    );
    if (isCancelled()) return;

    const [drift, onboardingDismissed] = await Promise.all([
      driftPromise,
      onboardingDismissedPromise,
    ]);
    if (isCancelled()) return;

    onState({
      status: "ready",
      bundle: {
        summary,
        diagrams,
        layouts,
        nodes,
        missingDescriptions: missing,
        drift,
        onboardingDismissed,
      },
    });
  } catch (err) {
    if (isCancelled()) return;
    const message = err instanceof Error ? err.message : String(err);
    onState({ status: "error", message });
  }
}
