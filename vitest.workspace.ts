import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/shared/vitest.config.ts",
  "packages/server/vitest.config.ts",
  "packages/web/vitest.config.ts",
  "packages/installer/vitest.config.ts",
  "packages/install/vitest.config.ts",
]);
