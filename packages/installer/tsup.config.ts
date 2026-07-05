import { defineConfig } from "tsup";

export default defineConfig({
  // index.ts is the library entry (wrappers like @tecture/install bundle it);
  // the shebang banner lands on it too, which is harmless — hashbangs are
  // valid JS comments.
  entry: { cli: "src/cli.ts", index: "src/index.ts" },
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  dts: { entry: { index: "src/index.ts" } },
  shims: false,
  banner: { js: "#!/usr/bin/env node" },
});
