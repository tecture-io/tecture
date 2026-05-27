import { defineConfig } from "@vscode/test-cli";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  files: "dist-test/test/suite/**/*.test.js",
  extensionDevelopmentPath: here,
  workspaceFolder: resolve(here, "test/fixtures/sample-workspace"),
  mocha: {
    ui: "tdd",
    timeout: 30000,
  },
});
