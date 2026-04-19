import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  dts: false,
  shims: false,
  banner: { js: "#!/usr/bin/env node" },
  noExternal: ["@tecture/shared"],
});
