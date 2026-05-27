import { defineConfig } from "tsup";

export default defineConfig({
  entry: { extension: "src/extension.ts" },
  format: ["cjs"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: false,
  minify: false,
  splitting: false,
  dts: false,
  shims: false,
  external: ["vscode"],
  noExternal: ["@tecture/shared"],
});
