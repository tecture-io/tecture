import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type Express, type Request } from "express";
import { healthRouter } from "./routes/health.js";
import {
  architectureErrorHandler,
  createArchitectureRouter,
  type LayoutStoreResolver,
  type SourceResolver,
} from "./routes/architecture.js";
import type {
  ArchitectureDataSource,
  LayoutStore,
} from "./source/types.js";
import type { Reporter } from "./telemetry.js";

export interface CreateAppOptions {
  source: ArchitectureDataSource | SourceResolver;
  layoutStore?: LayoutStore | LayoutStoreResolver | null;
  /** Optional anonymous usage reporter (standalone viewer only). */
  report?: Reporter;
}

function toSourceResolver(
  value: ArchitectureDataSource | SourceResolver,
): SourceResolver {
  if (typeof value === "function") return value as SourceResolver;
  return () => value;
}

function toLayoutStoreResolver(
  value: LayoutStore | LayoutStoreResolver | null | undefined,
): LayoutStoreResolver | undefined {
  if (value == null) return undefined;
  if (typeof value === "function") return value as LayoutStoreResolver;
  return () => value;
}

export function createApp(options: CreateAppOptions): Express {
  const app = express();

  app.use(express.json({ limit: "256kb" }));
  app.use("/api/health", healthRouter);
  app.use(
    "/api/architecture",
    createArchitectureRouter({
      resolveSource: toSourceResolver(options.source),
      resolveLayoutStore: toLayoutStoreResolver(options.layoutStore),
    }),
  );
  app.use("/api/architecture", architectureErrorHandler);

  // Anonymous usage signal from the viewer UI, fired on real user actions
  // (navigating to a diagram, opening a node). Whitelisted event names; only a
  // numeric C4 level is forwarded — never slugs, names, or content.
  const USAGE_EVENTS = new Set(["diagram.viewed", "node.inspected"]);
  app.post("/api/telemetry", (req, res) => {
    const body = (req.body ?? {}) as { event?: unknown; level?: unknown };
    if (typeof body.event === "string" && USAGE_EVENTS.has(body.event)) {
      options.report?.capture(
        body.event,
        typeof body.level === "number" ? { level: body.level } : {},
      );
    }
    res.status(204).end();
  });

  const publicDir = fileURLToPath(new URL("./public", import.meta.url));

  if (existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get("*", (req: Request, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(fileURLToPath(new URL("./public/index.html", import.meta.url)));
    });
  }

  return app;
}
