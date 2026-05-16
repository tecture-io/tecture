The source-agnostic core at [packages/server/src/source/types.ts](packages/server/src/source/types.ts). Defines the contract every backend must satisfy — `ArchitectureDataSource` (loadManifest / loadDiagram / loadDescription) and the optional `LayoutStore` (loadLayout / saveLayout). Exported from the package's library entry so downstream projects (e.g. a GitHub-API-backed viewer) can implement their own backend without forking the server or routes.

## Responsibilities
- Declare the two interfaces that the route handlers consume.
- Own the typed not-found / invalid errors (`DiagramNotFoundError`, `NodeNotFoundError`, `DescriptionNotFoundError`, `LayoutInvalidError`) — route handlers map these to 404/400 responses regardless of which backend threw them.
- Centralize source-independent validation: the `SLUG_RE` regex, the `isValidLayoutEntry` numeric check, and `normalizeLayoutUpdate` (the body validator shared by every `LayoutStore` impl).
- Provide the composed helpers `buildArchitectureSummary(source)` and `findNode(source, nodeId)` so every backend benefits without rewriting the cross-diagram traversal.

## Tech Stack
- TypeScript interfaces; zero runtime dependencies
- `@tecture/shared` file/API types
