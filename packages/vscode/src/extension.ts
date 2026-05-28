import * as vscode from "vscode";
import {
  VscodeFsArchitectureDataSource,
  VscodeFsLayoutStore,
  getArchitecturePath,
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
  const treeView = vscode.window.createTreeView("tectureDiagrams", {
    treeDataProvider: treeProvider,
  });
  context.subscriptions.push(treeView);

  const fireRefresh = () => {
    treeProvider.refresh();
    TecturePanel.current?.postEvent({ type: "refresh" });
  };

  // Follow the active diagram in the sidebar tree. Only sync when the view is
  // already visible (never force it open), and no-op when the slug is already
  // selected — together with the webview-side dedupe this prevents any loop.
  const revealDiagram = async (slug: string) => {
    if (!treeView.visible) return;
    if (treeView.selection[0]?.id === slug) return;
    await treeProvider.ensureLoaded();
    const item = treeProvider.getItem(slug);
    if (item) await treeView.reveal(item, { select: true, focus: false });
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tecture.open",
      async (slug?: unknown) => {
        if (!activeDeps) return;
        const panel = await TecturePanel.createOrShow(
          context.extensionUri,
          activeDeps,
          (changedSlug) => void revealDiagram(changedSlug),
        );
        if (typeof slug === "string" && slug.length > 0) {
          panel.postEvent({ type: "selectDiagram", slug });
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("tecture.refresh", fireRefresh),
  );

  // File watchers track the configured architecture folder plus its layout
  // store (architecture/.tecture); rebuilt whenever the configured path changes.
  let watchers: vscode.Disposable[] = [];
  const disposeWatchers = () => {
    for (const w of watchers) w.dispose();
    watchers = [];
  };
  const createWatchers = (target: vscode.WorkspaceFolder) => {
    const archPath = getArchitecturePath(target);
    for (const glob of [`${archPath}/**`, `${archPath}/.tecture/**`]) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(target, glob),
      );
      watcher.onDidChange(fireRefresh);
      watcher.onDidCreate(fireRefresh);
      watcher.onDidDelete(fireRefresh);
      watchers.push(watcher);
    }
  };
  createWatchers(folder);
  context.subscriptions.push({ dispose: disposeWatchers });

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("tecture.architecturePath")) return;
      const target = getWorkspaceFolder();
      if (!target) return;
      activeDeps = buildDeps(target);
      treeProvider.setSource(activeDeps.source);
      TecturePanel.current?.setDeps(activeDeps);
      disposeWatchers();
      createWatchers(target);
      fireRefresh();
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const next = getWorkspaceFolder();
      if (!next) {
        activeDeps = undefined;
        disposeWatchers();
        return;
      }
      activeDeps = buildDeps(next);
      treeProvider.setSource(activeDeps.source);
      TecturePanel.current?.setDeps(activeDeps);
      disposeWatchers();
      createWatchers(next);
      fireRefresh();
    }),
  );
}

export function deactivate(): void {
  TecturePanel.current?.dispose();
  activeDeps = undefined;
}
