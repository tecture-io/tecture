The extension's `activate` entry point — the wiring layer that owns the lifecycle of every other component. Runs in the VS Code extension host when a workspace contains `architecture/manifest.json`.

## Responsibilities
- Resolve the workspace folder and the configured architecture path, then build the `MessageDeps` bundle: a `VscodeFsArchitectureDataSource`, a `VscodeFsLayoutStore`, and an `openFile` callback that safely opens a repo-relative source file in the editor.
- Register the `tecture.open` and `tecture.refresh` commands, the `tectureDiagrams` tree view, and the `architecture/**` file watchers that fire a reload on disk changes.
- Re-build the dependency bundle and watchers when the `tecture.architecturePath` setting or the active workspace folder changes.
- Guard `openFile` against absolute paths and `..` escapes before revealing anything in the editor.

## Tech Stack
- TypeScript, VS Code Extension API (commands, tree views, `createFileSystemWatcher`, configuration + workspace-folder events)
