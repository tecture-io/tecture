import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: resolve(__dirname, "webview-entry"),
  base: "./",
  build: {
    outDir: resolve(__dirname, "media/webview"),
    emptyOutDir: true,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@tecture/web": resolve(__dirname, "../web/src"),
    },
  },
});
