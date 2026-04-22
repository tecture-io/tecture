import { createContext } from "react";

export interface LayoutPersistenceContextValue {
  notifyLayoutChanged: () => void;
}

export const LayoutPersistenceContext =
  createContext<LayoutPersistenceContextValue | null>(null);
