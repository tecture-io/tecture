import { useCallback, useState } from "react";

export interface Onboarding {
  /** Whether the wizard should currently be shown. */
  open: boolean;
  /** Manually (re)open the tour, e.g. from the help button. */
  openWizard: () => void;
  /** Dismiss the tour for the current view. */
  closeWizard: () => void;
}

/**
 * Onboarding tour state. The wizard opens on every architecture load (this hook
 * mounts only once the bundle is ready, so "open on mount" = right after the
 * initial load), and `openWizard` lets the help button replay it on demand.
 */
export function useOnboarding(): Onboarding {
  const [open, setOpen] = useState(true);
  const openWizard = useCallback(() => setOpen(true), []);
  const closeWizard = useCallback(() => setOpen(false), []);
  return { open, openWizard, closeWizard };
}
