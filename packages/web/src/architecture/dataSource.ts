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

export function createHttpDataSource(): WebDataSource {
  return {
    loadSummary: () => fetchJson<ApiArchitectureSummary>("/api/architecture"),
    loadDiagram: (slug) =>
      fetchJson<ApiDiagram>(
        `/api/architecture/diagrams/${encodeURIComponent(slug)}`,
      ),
    loadLayout: async (slug) => {
      try {
        return await fetchJson<DiagramLayoutFile>(
          `/api/architecture/diagrams/${encodeURIComponent(slug)}/layout`,
        );
      } catch {
        return emptyLayout(slug);
      }
    },
    loadNodeDetail: (nodeId) =>
      fetchJson<ApiNodeDetail>(
        `/api/architecture/nodes/${encodeURIComponent(nodeId)}`,
      ),
    saveLayout: async (slug, update) => {
      const res = await fetch(
        `/api/architecture/diagrams/${encodeURIComponent(slug)}/layout`,
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
