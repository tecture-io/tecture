The pair of handlers registered in `createApp()` that turn the Express process into a full web server for the bundled React UI. Only active when `dist/public/` exists next to the executable — in development, Vite serves the UI separately on port 5173 and proxies `/api/*` to this process.

## Responsibilities
- Serve hashed Vite assets (JS, CSS, fonts, icons, SVG sprites) from `dist/public/` via `express.static`.
- For any unmatched `GET` that does not start with `/api/`, return `dist/public/index.html` so the client-side hash router can take over — this is what makes deep links like `#/diagram/containers` work on a page refresh.

## Tech Stack
- `express.static` and a catch-all `app.get("*", ...)` handler.
- `node:url.fileURLToPath` and `node:fs.existsSync` to locate the `public/` directory next to the bundled ESM entry.
