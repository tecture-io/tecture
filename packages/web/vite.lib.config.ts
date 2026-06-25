import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";

/**
 * Library build for publishing @tecture/web to npm (output: dist-lib).
 *
 * This is separate from the default `vite.config.ts` app build (output: dist),
 * which @tecture/core copies as a bundled SPA. Here we emit thin ESM modules
 * plus type declarations, externalizing every bare import so the consumer's
 * bundler resolves React and the diagram libraries (declared as
 * peer/regular dependencies). The Tailwind stylesheet is compiled to a plain
 * CSS asset (`@tecture/web/styles.css`).
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      outDir: "dist-lib",
      include: ["src"],
      exclude: ["src/main.tsx", "**/*.test.ts", "**/*.test.tsx"],
      // The package tsconfig sets noEmit; vite-plugin-dts runs its own program.
      compilerOptions: { noEmit: false, declaration: true, emitDeclarationOnly: true },
    }),
  ],
  build: {
    outDir: "dist-lib",
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: {
        App: "src/App.tsx",
        "architecture/dataSource": "src/architecture/dataSource.ts",
        styles: "src/styleEntry.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize all bare specifiers (react, the diagram libs, @tecture/shared).
      // Relative/absolute imports stay bundled.
      external: (id) => !id.startsWith(".") && !id.startsWith("/"),
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
