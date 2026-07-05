import { defineConfig } from "tsup";

export default defineConfig({
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
  // Inline @tecture/skill (a devDependency) so the published package is
  // self-contained with zero runtime deps — the same pattern @tecture/core
  // uses for @tecture/shared and @tecture/web.
  noExternal: ["@tecture/skill"],
});
