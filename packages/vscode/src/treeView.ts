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
  private readonly items = new Map<string, DiagramTreeItem>();

  constructor(private source: ArchitectureDataSource) {}

  setSource(source: ArchitectureDataSource): void {
    this.source = source;
    this.refresh();
  }

  refresh(): void {
    this.cached = undefined;
    this.items.clear();
    this.emitter.fire(undefined);
  }

  getTreeItem(element: DiagramTreeItem): vscode.TreeItem {
    return element;
  }

  // Required so VS Code can resolve elements for TreeView.reveal(). The tree is
  // flat, so every item is a root and has no parent.
  getParent(): vscode.ProviderResult<DiagramTreeItem> {
    return undefined;
  }

  async getChildren(): Promise<DiagramTreeItem[]> {
    try {
      if (!this.cached) {
        this.cached = await buildArchitectureSummary(this.source);
      }
      this.items.clear();
      return this.cached.diagrams.map((d) => {
        const item = new DiagramTreeItem(d);
        this.items.set(d.slug, item);
        return item;
      });
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

  getItem(slug: string): DiagramTreeItem | undefined {
    return this.items.get(slug);
  }

  async ensureLoaded(): Promise<void> {
    if (this.items.size === 0) await this.getChildren();
  }
}
