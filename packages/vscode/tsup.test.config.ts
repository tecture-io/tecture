import { defineConfig } from "tsup";
import { globSync } from "node:fs";
import { resolve } from "node:path";

const testFiles = globSync("test/suite/*.test.ts").reduce<
  Record<string, string>
>((acc, file) => {
  const name = file.replace(/^test\//, "").replace(/\.ts$/, "");
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
