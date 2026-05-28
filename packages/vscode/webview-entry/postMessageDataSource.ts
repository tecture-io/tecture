import type { WebDataSource } from "@tecture/web/architecture/dataSource";
import type {
  ApiArchitectureSummary,
  ApiDiagram,
  ApiDiagramLayoutUpdate,
  ApiNodeDetail,
  DiagramLayoutFile,
  TectureRequest,
  TectureResponse,
} from "@tecture/shared";

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState<T = unknown>(): T | undefined;
  setState<T>(state: T): void;
}

declare global {
  interface Window {
    acquireVsCodeApi: () => VsCodeApi;
  }
}

export const vscode: VsCodeApi = window.acquireVsCodeApi();

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

const pending = new Map<string, Pending>();

window.addEventListener("message", (event: MessageEvent) => {
  const msg = event.data as TectureResponse | undefined;
  if (!msg || typeof msg !== "object" || typeof msg.id !== "string") return;
  const handler = pending.get(msg.id);
  if (!handler) return;
  pending.delete(msg.id);
  if (msg.ok) handler.resolve(msg.data);
  else handler.reject(new Error(msg.error));
});

let nextId = 0;
function send<T>(req: Omit<TectureRequest, "id">): Promise<T> {
  const id = `r${nextId++}`;
  const message = { ...req, id } as TectureRequest;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (v) => resolve(v as T),
      reject,
    });
    vscode.postMessage(message);
  });
}

export function createPostMessageDataSource(): WebDataSource {
  return {
    loadSummary: () => send<ApiArchitectureSummary>({ type: "loadSummary" }),
    loadDiagram: (slug) => send<ApiDiagram>({ type: "loadDiagram", slug }),
    loadLayout: (slug) => send<DiagramLayoutFile>({ type: "loadLayout", slug }),
    loadNodeDetail: (nodeId) =>
      send<ApiNodeDetail>({ type: "loadNodeDetail", nodeId }),
    saveLayout: (slug, update: ApiDiagramLayoutUpdate) =>
      send<DiagramLayoutFile>({ type: "saveLayout", slug, update }),
    openInEditor: (path) => {
      void send<void>({ type: "openFile", path });
    },
  };
}
