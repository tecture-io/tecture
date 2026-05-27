import * as vscode from "vscode";
import {
  VscodeFsArchitectureDataSource,
  VscodeFsLayoutStore,
  resolveArchitectureRoot,
  resolveLayoutsRoot,
} from "./dataSource";
import { TecturePanel } from "./panel";
import { TectureTreeDataProvider } from "./treeView";
import type { MessageDeps } from "./messaging";

let activeDeps: MessageDeps | undefined;

function buildDeps(folder: vscode.WorkspaceFolder): MessageDeps {
  return {
    source: new VscodeFsArchitectureDataSource(resolveArchitectureRoot(folder)),
    layouts: new VscodeFsLayoutStore(resolveLayoutsRoot(folder)),
  };
}

function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length > 0 ? folders[0] : undefined;
}

export function activate(context: vscode.ExtensionContext): void {
  const folder = getWorkspaceFolder();
  if (!folder) {
    void vscode.window.showWarningMessage(
      "Tecture: open a workspace folder to view architecture diagrams.",
    );
    return;
  }

  activeDeps = buildDeps(folder);

  const treeProvider = new TectureTreeDataProvider(activeDeps.source);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("tectureDiagrams", treeProvider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tecture.open",
      async (slug?: unknown) => {
        if (!activeDeps) return;
        const panel = await TecturePanel.createOrShow(
          context.extensionUri,
          activeDeps,
        );
        if (typeof slug === "string" && slug.length > 0) {
          panel.postEvent({ type: "selectDiagram", slug });
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("tecture.refresh", () => {
      treeProvider.refresh();
      TecturePanel.current?.postEvent({ type: "refresh" });
    }),
  );

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(folder, "{architecture,.tecture}/**"),
  );
  const fireRefresh = () => {
    treeProvider.refresh();
    TecturePanel.current?.postEvent({ type: "refresh" });
  };
  watcher.onDidChange(fireRefresh);
  watcher.onDidCreate(fireRefresh);
  watcher.onDidDelete(fireRefresh);
  context.subscriptions.push(watcher);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const next = getWorkspaceFolder();
      if (!next) {
        activeDeps = undefined;
        return;
      }
      activeDeps = buildDeps(next);
      treeProvider.setSource(activeDeps.source);
    }),
  );
}

export function deactivate(): void {
  TecturePanel.current?.dispose();
  activeDeps = undefined;
}
