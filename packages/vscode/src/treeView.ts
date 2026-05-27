import * as vscode from "vscode";
import {
  buildArchitectureSummary,
  type ApiArchitectureSummary,
  type ApiDiagramSummary,
  type ArchitectureDataSource,
} from "@tecture/shared";

export class DiagramTreeItem extends vscode.TreeItem {
  constructor(public readonly diagram: ApiDiagramSummary) {
    super(diagram.name, vscode.TreeItemCollapsibleState.None);
    this.id = diagram.slug;
    this.description = `${diagram.nodeCount}n · ${diagram.edgeCount}e`;
    this.tooltip = `${diagram.name} (${diagram.slug})`;
    this.contextValue = "diagram";
    this.iconPath = new vscode.ThemeIcon("symbol-class");
    this.command = {
      command: "tecture.open",
      title: "Open",
      arguments: [diagram.slug],
    };
  }
}

export class TectureTreeDataProvider
  implements vscode.TreeDataProvider<DiagramTreeItem>
{
  private readonly emitter = new vscode.EventEmitter<
    DiagramTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this.emitter.event;

  private cached: ApiArchitectureSummary | undefined;

  constructor(private source: ArchitectureDataSource) {}

  setSource(source: ArchitectureDataSource): void {
    this.source = source;
    this.refresh();
  }

  refresh(): void {
    this.cached = undefined;
    this.emitter.fire(undefined);
  }

  getTreeItem(element: DiagramTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<DiagramTreeItem[]> {
    try {
      if (!this.cached) {
        this.cached = await buildArchitectureSummary(this.source);
      }
      return this.cached.diagrams.map((d) => new DiagramTreeItem(d));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const placeholder = new vscode.TreeItem(
        `No architecture: ${message}`,
        vscode.TreeItemCollapsibleState.None,
      );
      placeholder.iconPath = new vscode.ThemeIcon("warning");
      return [placeholder as DiagramTreeItem];
    }
  }
}
