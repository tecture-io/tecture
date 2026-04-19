import { Router, type Request, type Response, type NextFunction } from "express";
import type {
  ApiArchitectureError,
  ApiDiagram,
  ApiDiagramEdges,
  ApiDiagramNodes,
  ApiDiagramSummary,
  ApiNodeDetail,
  ManifestFile,
} from "@tecture/shared";
import {
  DescriptionNotFoundError,
  DiagramNotFoundError,
  NodeNotFoundError,
  SLUG_RE,
  buildArchitectureSummary,
  findNode,
  loadDescription,
  loadDiagram,
  loadManifest,
} from "../architecture/loader.js";

function send404(res: Response, body: ApiArchitectureError): void {
  res.status(404).json(body);
}

export function createArchitectureRouter(root: string): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const summary = await buildArchitectureSummary(root);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.get("/manifest", async (_req, res, next) => {
    try {
      const manifest: ManifestFile = await loadManifest(root);
      res.json(manifest);
    } catch (err) {
      next(err);
    }
  });

  router.get("/diagrams", async (_req, res, next) => {
    try {
      const summary = await buildArchitectureSummary(root);
      const diagrams: ApiDiagramSummary[] = summary.diagrams;
      res.json(diagrams);
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
      const diagram = await loadDiagram(root, diagramId);
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
      const diagram = await loadDiagram(root, diagramId);
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
      const diagram = await loadDiagram(root, diagramId);
      const body: ApiDiagramEdges = { diagramId, edges: diagram.edges ?? [] };
      res.json(body);
    } catch (err) {
      if (err instanceof DiagramNotFoundError) {
        return send404(res, { error: "diagram_not_found", slug: err.slug });
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
      const { node, diagramId } = await findNode(root, nodeId);
      const description = await loadDescription(root, nodeId);
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
      await findNode(root, nodeId);
      const markdown = await loadDescription(root, nodeId);
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
