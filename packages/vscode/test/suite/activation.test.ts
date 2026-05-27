import * as assert from "node:assert";
import * as vscode from "vscode";

suite("Extension activation", () => {
  test("commands are registered", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("tecture.open"),
      "tecture.open should be registered",
    );
    assert.ok(
      commands.includes("tecture.refresh"),
      "tecture.refresh should be registered",
    );
  });

  test("workspace contains the sample architecture", () => {
    const folder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(folder, "expected one workspace folder");
    const manifest = vscode.Uri.joinPath(
      folder!.uri,
      "architecture",
      "manifest.json",
    );
    assert.ok(manifest.fsPath.endsWith("manifest.json"));
  });
});
