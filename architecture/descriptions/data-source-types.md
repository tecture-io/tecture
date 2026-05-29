A re-export shim at [packages/server/src/source/types.ts](packages/server/src/source/types.ts) that surfaces the shared contract under the server's own module path. It owns no definitions anymore — every interface, error, and helper it exports comes from `@tecture/shared` (the `shared-contract` container). The server's routes import the contract from here so the package's public library entry can re-export it as part of `@tecture/core`.

## Responsibilities
- Re-export the `ArchitectureDataSource` and `LayoutStore` interfaces the route handlers consume.
- Re-export the typed not-found / invalid errors (`DiagramNotFoundError`, `NodeNotFoundError`, `DescriptionNotFoundError`, `LayoutInvalidError`) the handlers map to 404/400 responses.
- Re-export the source-independent helpers — `SLUG_RE`, `isValidLayoutEntry`, `normalizeLayoutUpdate`, `emptyLayout`, `buildArchitectureSummary`, `findNode` — so the server and the VS Code extension share one implementation.

## Tech Stack
- TypeScript re-exports; zero runtime code of its own
- All definitions sourced from `@tecture/shared`
