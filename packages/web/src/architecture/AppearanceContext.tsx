import { createContext, useContext } from "react";
import { DEFAULT_APPEARANCE, type GraphAppearance } from "@tecture/shared";

const AppearanceContext = createContext<GraphAppearance>(DEFAULT_APPEARANCE);

/** Supplies the resolved (already validated) graph appearance. */
export function AppearanceProvider({
  appearance,
  children,
}: {
  appearance: GraphAppearance;
  children: React.ReactNode;
}) {
  return (
    <AppearanceContext.Provider value={appearance}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): GraphAppearance {
  return useContext(AppearanceContext);
}

/** Translucent variant of any CSS colour (hex, rgb(), named…). `alpha` is 0–1. */
export function withAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 1000) / 10}%, transparent)`;
}
