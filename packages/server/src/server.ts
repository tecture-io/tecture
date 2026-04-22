import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import { healthRouter } from "./routes/health.js";
import {
  architectureErrorHandler,
  createArchitectureRouter,
} from "./routes/architecture.js";

export interface CreateAppOptions {
  architecturePath: string;
}

export function createApp(options: CreateAppOptions): Express {
  const app = express();

  app.use(express.json({ limit: "256kb" }));
  app.use("/api/health", healthRouter);
  app.use("/api/architecture", createArchitectureRouter(options.architecturePath));
  app.use("/api/architecture", architectureErrorHandler);

  const publicDir = fileURLToPath(new URL("./public", import.meta.url));

  if (existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(fileURLToPath(new URL("./public/index.html", import.meta.url)));
    });
  }

  return app;
}
