import { Router } from "express";
import type { ApiHealthResponse } from "@tecture/shared";

export const healthRouter: Router = Router();

healthRouter.get("/", (_req, res) => {
  const body: ApiHealthResponse = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});
