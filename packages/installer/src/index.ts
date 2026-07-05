// Library entry for @tecture/skill — lets wrappers (e.g. @tecture/install)
// reuse the skill install/check/remove logic instead of duplicating it.
// The CLI entry stays ./cli.js; importing this module has no side effects.

export {
  compareVersions,
  runCheck,
  runRemove,
  runSync,
  type SyncHooks,
  type SyncOptions,
} from "./install.js";
export { AGENTS, findAgent, type AgentDef, type Scope } from "./agents.js";
export { confirm, multiSelect, selectScope } from "./prompt.js";
export { createTelemetry } from "./telemetry.js";
