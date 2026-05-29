`handleRequest` — the pure function that maps an incoming `TectureRequest` to the right data-source call and returns a `TectureResponse`. The extension's analogue of the server's route handlers, minus HTTP: same contract, different transport.

## Responsibilities
- Switch on the request type — `loadSummary`, `loadDiagram`, `loadLayout`, `loadNodeDetail`, `saveLayout`, `openFile` — and call the matching method on the injected `MessageDeps` (data source, layout store, `openFile`).
- Compose the shared helpers (`buildArchitectureSummary`, `findNode`) so summary and node-detail responses are byte-identical to the server's.
- Catch typed errors thrown by the data source and turn them into `{ ok: false, error }` responses keyed by request id.

## Tech Stack
- TypeScript, no VS Code or DOM dependency (testable in isolation)
- `@tecture/shared` data-source interfaces, helpers, errors, and message types
