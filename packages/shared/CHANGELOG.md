# @tecture/shared

## 0.1.0

- First public release. Exposes the Tecture API/data types (`ApiArchitectureSummary`,
  `ApiDiagram`, `ApiNodeDetail`, `DiagramLayoutFile`, `ManifestFile`, …) plus the runtime
  helpers (`buildArchitectureSummary`, `findNode`, `emptyLayout`, `normalizeLayoutUpdate`,
  `buildSourceUrl`) and the `ArchitectureDataSource` / `LayoutStore` interfaces, so external
  hosts can implement the Tecture data contract over any transport.
