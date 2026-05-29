The sidebar diagram list — `TectureTreeDataProvider`, a `vscode.TreeDataProvider` that populates the Tecture activity-bar view with one entry per diagram. The editor-native navigator that has no equivalent in the browser viewer.

## Responsibilities
- Build the diagram list from `buildArchitectureSummary(source)`, showing each diagram's name plus its node/edge counts.
- Make each tree item run `tecture.open` with its slug, so clicking it opens (or focuses) the webview on that diagram.
- Expose `reveal`/selection so the host can follow the webview's active diagram in the tree as the user drills in (deduped to avoid a selection loop).
- Refresh its cache when the architecture files change or the data source is swapped.

## Tech Stack
- TypeScript, VS Code `TreeDataProvider` / `TreeItem` / `EventEmitter`
- `@tecture/shared` `buildArchitectureSummary` + summary types
