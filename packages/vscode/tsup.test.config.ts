import { defineConfig } from "tsup";
import { globSync } from "node:fs";
import { resolve } from "node:path";

const testFiles = globSync("test/suite/*.test.ts").reduce<
  Record<string, string>
>((acc, file) => {
  // globSync returns backslash paths on Windows; normalise so the prefix strip
  // works and output lands in dist-test/suite/ where .vscode-test.mjs looks.
  const name = file
    .replace(/\\/g, "/")
    .replace(/^test\//, "")
    .replace(/\.ts$/, "");
  acc[name] = resolve(file);
  return acc;
}, {});

export default defineConfig({
  entry: testFiles,
  outDir: "dist-test",
  format: ["cjs"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  bundle: true,
  splitting: false,
  dts: false,
  shims: false,
  external: ["vscode", "mocha"],
  noExternal: ["@tecture/shared"],
});
