export { createApp, type CreateAppOptions } from "./server.js";
export {
  architectureErrorHandler,
  createArchitectureRouter,
  type ArchitectureRouterOptions,
  type DriftLoader,
  type DriftResolver,
  type LayoutStoreResolver,
  type SourceResolver,
} from "./routes/architecture.js";
export {
  type ArchitectureDataSource,
  type LayoutStore,
  DescriptionNotFoundError,
  DiagramNotFoundError,
  LayoutInvalidError,
  NodeNotFoundError,
  SLUG_RE,
  buildArchitectureSummary,
  emptyLayout,
  findNode,
  isFiniteNumber,
  isValidLayoutEntry,
  normalizeLayoutUpdate,
} from "./source/types.js";
export { FsArchitectureDataSource, FsDriftReader, FsLayoutStore, safeJoin } from "./source/fs.js";
export * from "@tecture/shared";
