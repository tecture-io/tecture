import {
  buildArchitectureSummary,
  findNode,
  type ApiDiagram,
  type ApiNodeDetail,
  type ArchitectureDataSource,
  type DescriptionNotFoundError,
  type LayoutStore,
  type TectureRequest,
  type TectureResponse,
} from "@tecture/shared";

export interface MessageDeps {
  source: ArchitectureDataSource;
  layouts: LayoutStore;
  /** Open a repo-root-relative file or directory in the editor. */
  openFile?: (path: string) => Promise<void>;
}

export async function handleRequest(
  req: TectureRequest,
  deps: MessageDeps,
): Promise<TectureResponse> {
  try {
    switch (req.type) {
      case "loadSummary": {
        const data = await buildArchitectureSummary(deps.source);
        return { id: req.id, ok: true, data };
      }
      case "loadDiagram": {
        const diagram = await deps.source.loadDiagram(req.slug);
        const result: ApiDiagram = {
          ...diagram,
          slug: req.slug,
          edges: diagram.edges ?? [],
        };
        return { id: req.id, ok: true, data: result };
      }
      case "loadLayout": {
        const data = await deps.layouts.loadLayout(req.slug);
        return { id: req.id, ok: true, data };
      }
      case "loadNodeDetail": {
        const { node, diagramId } = await findNode(deps.source, req.nodeId);
        let description = "";
        try {
          description = await deps.source.loadDescription(req.nodeId);
        } catch (err) {
          if (!isDescriptionNotFound(err)) throw err;
        }
        const result: ApiNodeDetail = {
          ...node,
          diagramId,
          description,
        };
        return { id: req.id, ok: true, data: result };
      }
      case "saveLayout": {
        const data = await deps.layouts.saveLayout(req.slug, req.update);
        return { id: req.id, ok: true, data };
      }
      case "openFile": {
        if (!deps.openFile) {
          return {
            id: req.id,
            ok: false,
            error: "Opening files is not supported in this context",
          };
        }
        await deps.openFile(req.path);
        return { id: req.id, ok: true, data: null };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: req.id, ok: false, error: message };
  }
}

function isDescriptionNotFound(
  err: unknown,
): err is DescriptionNotFoundError {
  return err instanceof Error && err.name === "DescriptionNotFoundError";
}
