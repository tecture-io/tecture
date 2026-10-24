import * as assert from "node:assert";
import type * as vscode from "vscode";
import {
  dismissOnboarding,
  isOnboardingDismissed,
  resetOnboarding,
} from "../../src/onboarding";

// In-memory stand-in for ExtensionContext.workspaceState.
function memento(): vscode.Memento {
  const store = new Map<string, unknown>();
  return {
    keys: () => [...store.keys()],
    get: <T>(key: string, defaultValue?: T) =>
      (store.has(key) ? store.get(key) : defaultValue) as T,
    update: async (key: string, value: unknown) => {
      if (value === undefined) store.delete(key);
      else store.set(key, value);
    },
  };
}

suite("onboarding workspace state", () => {
  test("Don't show again persists until reset", async () => {
    const state = memento();
    assert.strictEqual(isOnboardingDismissed(state), false);

    await dismissOnboarding(state);
    assert.strictEqual(isOnboardingDismissed(state), true);

    await resetOnboarding(state);
    assert.strictEqual(isOnboardingDismissed(state), false);
  });
});
