import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { cli: "src/cli.ts" },
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
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "node20",
    platform: "node",
    clean: false,
    sourcemap: true,
    minify: false,
    splitting: false,
    dts: true,
    shims: false,
    noExternal: ["@tecture/shared"],
  },
]);
