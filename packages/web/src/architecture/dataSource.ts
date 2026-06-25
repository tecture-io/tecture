import type {
  ApiArchitectureSummary,
  ApiDiagram,
  ApiDiagramLayoutUpdate,
  ApiNodeDetail,
  DiagramLayoutFile,
} from "@tecture/shared";
import { emptyLayout } from "@tecture/shared";

export interface WebDataSource {
  loadSummary(): Promise<ApiArchitectureSummary>;
  loadDiagram(slug: string): Promise<ApiDiagram>;
  loadLayout(slug: string): Promise<DiagramLayoutFile>;
  loadNodeDetail(nodeId: string): Promise<ApiNodeDetail>;
  saveLayout(
    slug: string,
    update: ApiDiagramLayoutUpdate,
  ): Promise<DiagramLayoutFile>;
  /**
   * Open a repo-root-relative file or directory in the host editor. Only implemented when the
   * viewer runs inside an editor (e.g. the VS Code extension); undefined in the browser, where the
   * UI links to the repo host instead.
   */
  openInEditor?(path: string): void;
  /**
   * Report an anonymous usage event for a real user action (navigating to a
   * diagram, opening a node). Fire-and-forget. Carries only a C4 level — never
   * slugs, names, or content. Optional; the viewer works fine without it.
   */
  reportUsage?(event: string, props?: { level?: number }): void;
}

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

/**
 * HTTP data source for the viewer.
 *
 * `baseUrl` is prefixed to every request path, so the same UI can talk to a
 * server mounted under any prefix. Defaults to `""`, which preserves the
 * original behaviour (absolute `/api/...` paths) for the CLI server and the
 * VS Code webview. Pass e.g. `"/open/<user>/<project>/api"` to point the
 * viewer at a per-repo endpoint namespace. A trailing slash is trimmed.
 */
export function createHttpDataSource(baseUrl = ""): WebDataSource {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    loadSummary: () =>
      fetchJson<ApiArchitectureSummary>(`${base}/api/architecture`),
    loadDiagram: (slug) =>
      fetchJson<ApiDiagram>(
        `${base}/api/architecture/diagrams/${encodeURIComponent(slug)}`,
      ),
    loadLayout: async (slug) => {
      try {
        return await fetchJson<DiagramLayoutFile>(
          `${base}/api/architecture/diagrams/${encodeURIComponent(slug)}/layout`,
        );
      } catch {
        return emptyLayout(slug);
      }
    },
    loadNodeDetail: (nodeId) =>
      fetchJson<ApiNodeDetail>(
        `${base}/api/architecture/nodes/${encodeURIComponent(nodeId)}`,
      ),
    reportUsage: (event, props) => {
      // Fire-and-forget; never block the UI or throw on a dead endpoint.
      void fetch(`${base}/api/telemetry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, level: props?.level }),
      }).catch(() => {});
    },
    saveLayout: async (slug, update) => {
      const res = await fetch(
        `${base}/api/architecture/diagrams/${encodeURIComponent(slug)}/layout`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? `HTTP ${res.status} saving layout`);
      }
      return (await res.json()) as DiagramLayoutFile;
    },
  };
}
