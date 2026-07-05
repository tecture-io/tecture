import { Router, type Request, type Response, type NextFunction } from "express";
import type {
  ApiArchitectureError,
  ApiDiagram,
  ApiDiagramEdges,
  ApiDiagramLayout,
  ApiDiagramLayoutUpdate,
  ApiDiagramNodes,
  ApiNodeDetail,
  ManifestFile,
} from "@tecture/shared";
import {
  type ArchitectureDataSource,
  DescriptionNotFoundError,
  DiagramNotFoundError,
  type DriftReport,
  type LayoutStore,
  LayoutInvalidError,
  NodeNotFoundError,
  SLUG_RE,
  buildArchitectureSummary,
  emptyLayout,
  findNode,
} from "../source/types.js";

export type SourceResolver = (
  req: Request,
) => ArchitectureDataSource | Promise<ArchitectureDataSource>;

export type LayoutStoreResolver = (
  req: Request,
) => LayoutStore | null | Promise<LayoutStore | null>;

/** Anything that can produce the current drift report (e.g. FsDriftReader). */
export interface DriftLoader {
  load(): Promise<DriftReport | null>;
}

export type DriftResolver = (
  req: Request,
) => DriftLoader | null | Promise<DriftLoader | null>;

export interface ArchitectureRouterOptions {
  resolveSource: SourceResolver;
  resolveLayoutStore?: LayoutStoreResolver;
  resolveDrift?: DriftResolver;
}

function send501(res: Response, body: ApiArchitectureError): void {
  res.status(501).json(body);
}

function send404(res: Response, body: ApiArchitectureError): void {
  res.status(404).json(body);
}

function send400(res: Response, body: ApiArchitectureError): void {
  res.status(400).json(body);
}

export function createArchitectureRouter(
  opts: ArchitectureRouterOptions,
): Router {
  const router = Router();
  const { resolveSource, resolveLayoutStore, resolveDrift } = opts;

  router.get("/", async (req, res, next) => {
    try {
      const source = await resolveSource(req);
      const summary = await buildArchitectureSummary(source);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.get("/manifest", async (req, res, next) => {
    try {
      const source = await resolveSource(req);
      const manifest: ManifestFile = await source.loadManifest();
      res.json(manifest);
    } catch (err) {
      next(err);
    }
  });

  // Drift is optional viewer state: absent file, malformed file, or an
  // unconfigured loader are all the same normal condition — 200 with a null
  // body (never 404, so clients stay branch-free).
  router.get("/drift", async (req, res, next) => {
    try {
      const loader = resolveDrift ? await resolveDrift(req) : null;
      const report = loader ? await loader.load() : null;
      res.json(report);
    } catch (err) {
      next(err);
    }
  });

  router.get("/diagrams", async (req, res, next) => {
    try {
      const source = await resolveSource(req);
      const summary = await buildArchitectureSummary(source);
      res.json(summary.diagrams);
    } catch (err) {
      next(err);
    }
  });

  router.get("/diagrams/:diagramId", async (req, res, next) => {
    const { diagramId } = req.params;
    if (!SLUG_RE.test(diagramId)) {
      return send404(res, { error: "diagram_not_found", slug: diagramId });
    }
    try {
      const source = await resolveSource(req);
      const diagram = await source.loadDiagram(diagramId);
      const body: ApiDiagram = {
        slug: diagramId,
        name: diagram.name,
        level: diagram.level,
        meta: diagram.meta,
        nodes: diagram.nodes,
        edges: diagram.edges ?? [],
      };
      res.json(body);
    } catch (err) {
      if (err instanceof DiagramNotFoundError) {
        return send404(res, { error: "diagram_not_found", slug: err.slug });
      }
      next(err);
    }
  });

  router.get("/diagrams/:diagramId/nodes", async (req, res, next) => {
    const { diagramId } = req.params;
    if (!SLUG_RE.test(diagramId)) {
      return send404(res, { error: "diagram_not_found", slug: diagramId });
    }
    try {
      const source = await resolveSource(req);
      const diagram = await source.loadDiagram(diagramId);
      const body: ApiDiagramNodes = { diagramId, nodes: diagram.nodes };
      res.json(body);
    } catch (err) {
      if (err instanceof DiagramNotFoundError) {
        return send404(res, { error: "diagram_not_found", slug: err.slug });
      }
      next(err);
    }
  });

  router.get("/diagrams/:diagramId/edges", async (req, res, next) => {
    const { diagramId } = req.params;
    if (!SLUG_RE.test(diagramId)) {
      return send404(res, { error: "diagram_not_found", slug: diagramId });
    }
    try {
      const source = await resolveSource(req);
      const diagram = await source.loadDiagram(diagramId);
      const body: ApiDiagramEdges = { diagramId, edges: diagram.edges ?? [] };
      res.json(body);
    } catch (err) {
      if (err instanceof DiagramNotFoundError) {
        return send404(res, { error: "diagram_not_found", slug: err.slug });
      }
      next(err);
    }
  });

  router.get("/diagrams/:diagramId/layout", async (req, res, next) => {
    const { diagramId } = req.params;
    if (!SLUG_RE.test(diagramId)) {
      return send404(res, { error: "diagram_not_found", slug: diagramId });
    }
    try {
      const source = await resolveSource(req);
      await source.loadDiagram(diagramId);
      const store = resolveLayoutStore ? await resolveLayoutStore(req) : null;
      const layout: ApiDiagramLayout = store
        ? await store.loadLayout(diagramId)
        : emptyLayout(diagramId);
      res.json(layout);
    } catch (err) {
      if (err instanceof DiagramNotFoundError) {
        return send404(res, { error: "diagram_not_found", slug: err.slug });
      }
      next(err);
    }
  });

  router.put("/diagrams/:diagramId/layout", async (req, res, next) => {
    const { diagramId } = req.params;
    if (!SLUG_RE.test(diagramId)) {
      return send404(res, { error: "diagram_not_found", slug: diagramId });
    }
    try {
      const source = await resolveSource(req);
      await source.loadDiagram(diagramId);
      const store = resolveLayoutStore ? await resolveLayoutStore(req) : null;
      if (!store) {
        return send501(res, {
          error: "layout_not_supported",
          message: "Layout persistence is not configured for this data source",
        });
      }
      const update = req.body as ApiDiagramLayoutUpdate;
      const saved = await store.saveLayout(diagramId, update);
      res.json(saved);
    } catch (err) {
      if (err instanceof DiagramNotFoundError) {
        return send404(res, { error: "diagram_not_found", slug: err.slug });
      }
      if (err instanceof LayoutInvalidError) {
        return send400(res, { error: "layout_invalid", message: err.message });
      }
      next(err);
    }
  });

  router.get("/nodes/:nodeId", async (req, res, next) => {
    const { nodeId } = req.params;
    if (!SLUG_RE.test(nodeId)) {
      return send404(res, { error: "node_not_found", id: nodeId });
    }
    try {
      const source = await resolveSource(req);
      const { node, diagramId } = await findNode(source, nodeId);
      const description = await source.loadDescription(nodeId);
      const body: ApiNodeDetail = { ...node, diagramId, description };
      res.json(body);
    } catch (err) {
      if (err instanceof NodeNotFoundError) {
        return send404(res, { error: "node_not_found", id: err.id });
      }
      if (err instanceof DescriptionNotFoundError) {
        return send404(res, { error: "description_not_found", id: err.id });
      }
      next(err);
    }
  });

  router.get("/nodes/:nodeId/description", async (req, res, next) => {
    const { nodeId } = req.params;
    if (!SLUG_RE.test(nodeId)) {
      return send404(res, { error: "description_not_found", id: nodeId });
    }
    try {
      const source = await resolveSource(req);
      await findNode(source, nodeId);
      const markdown = await source.loadDescription(nodeId);
      res.type("text/markdown; charset=utf-8").send(markdown);
    } catch (err) {
      if (err instanceof NodeNotFoundError) {
        return send404(res, { error: "node_not_found", id: err.id });
      }
      if (err instanceof DescriptionNotFoundError) {
        return send404(res, { error: "description_not_found", id: err.id });
      }
      next(err);
    }
  });

  return router;
}

export function architectureErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) return next(err);
  const message = err instanceof Error ? err.message : String(err);
  const body: ApiArchitectureError = {
    error: "architecture_unreadable",
    message,
  };
  res.status(500).json(body);
}
