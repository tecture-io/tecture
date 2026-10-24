import { useCallback, useMemo } from "react";
import { useOnboardingSession } from "./ArchitectureBundleContext";

export interface Onboarding {
  /** Whether the wizard should currently be shown. */
  open: boolean;
  /** Manually (re)open the tour, e.g. from the help button. */
  openWizard: () => void;
  /** Close the tour; it stays closed across reloads until reopened. */
  closeWizard: () => void;
  /**
   * Close the tour and persist "Don't show again" for this project. Undefined
   * when the data source can't persist it, which hides the button.
   */
  dismissPermanently?: () => void;
}

/**
 * Onboarding tour state. The tour opens when the viewer loads unless the data
 * source reports it dismissed. ArchitectureBundleProvider keeps the user's
 * open/close choice, so a reload never reopens a tour the user closed, and
 * `openWizard` lets the help button replay it on demand.
 */
export function useOnboarding(): Onboarding {
  const { open, setOpen, dismiss } = useOnboardingSession();
  const openWizard = useCallback(() => setOpen(true), [setOpen]);
  const closeWizard = useCallback(() => setOpen(false), [setOpen]);
  const dismissPermanently = useMemo(
    () =>
      dismiss &&
      (() => {
        dismiss();
        setOpen(false);
      }),
    [dismiss, setOpen],
  );
  return { open, openWizard, closeWizard, dismissPermanently };
}
