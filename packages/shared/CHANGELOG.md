# @tecture/shared

## Unreleased

- Added the graph appearance model: the `GraphAppearance` type,
  `DEFAULT_APPEARANCE`, `mergeAppearance()` (merges untrusted overrides key by
  key and drops invalid values), `isCssColor()`, `isEdgeAnimated()`, the
  `GridVariant` / `ContainerBorderStyle` / `EdgeAnimationMode` constants,
  `NODE_TYPE_KEYS` / `EDGE_TYPE_KEYS`, and the `CSS_COLOR_PATTERN` /
  `DASH_PATTERN` JSON-schema patterns.
- Added an `appearance` event to the `TectureEvent` webview protocol.

## 0.2.0

- Added the drift-report contract: `DriftReport`, `DriftFinding`, `DriftFindingKind`,
  `DriftSeverity`, `DriftEdgeRef`, and `DriftEvidence` types plus the tolerant
  `parseDriftReport` guard and the `driftForNode` selector. Drift reports are produced
  by the architecture-docs skill's evidence script (which verifies the architecture
  against the repo's CodeGraph index) and rendered by the viewers.
- Added a `loadDrift` request to the `TectureRequest` webview protocol.

## 0.1.0

- First public release. Exposes the Tecture API/data types (`ApiArchitectureSummary`,
  `ApiDiagram`, `ApiNodeDetail`, `DiagramLayoutFile`, `ManifestFile`, …) plus the runtime
  helpers (`buildArchitectureSummary`, `findNode`, `emptyLayout`, `normalizeLayoutUpdate`,
  `buildSourceUrl`) and the `ArchitectureDataSource` / `LayoutStore` interfaces, so external
  hosts can implement the Tecture data contract over any transport.
