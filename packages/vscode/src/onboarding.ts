import type * as vscode from "vscode";

// Per-workspace "Don't show again" flag for the webview's onboarding tour.
const DISMISSED_KEY = "tecture.onboardingDismissed";

export function isOnboardingDismissed(state: vscode.Memento): boolean {
  return state.get<boolean>(DISMISSED_KEY, false);
}

export async function dismissOnboarding(state: vscode.Memento): Promise<void> {
  await state.update(DISMISSED_KEY, true);
}

export async function resetOnboarding(state: vscode.Memento): Promise<void> {
  await state.update(DISMISSED_KEY, undefined);
}
