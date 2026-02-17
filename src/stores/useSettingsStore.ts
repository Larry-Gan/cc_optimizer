import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../lib/defaults";
import type { OptimizationTarget } from "../types/portfolio";

interface SettingsState {
  annualizeRotatingCategories: boolean;
  rotatingMode: "annualized" | "current_quarter";
  currentQuarter: "Q1" | "Q2" | "Q3" | "Q4";
  includeSignOnBonusInFirstYear: boolean;
  maxCardsInWallet: number;
  excludeDebitCards: boolean;
  preferredNetwork: string | null;
  showAdvancedOptions: boolean;
  optimizationTarget: OptimizationTarget;
  forcedIncludeCardIds: string[];
  forcedExcludeCardIds: string[];
  cardInclusionModeById: Record<string, "include" | "neutral" | "exclude">;
  choosableCategoryOverrides: Record<string, string[]>;
  optimizeAdvancedOpen: boolean;
  skipDeletePortfolioConfirmation: boolean;
  setSetting: <K extends keyof Omit<SettingsState, "setSetting" | "setForcedIncludeCardIds" | "setForcedExcludeCardIds" | "setChoosableCategoryOverride" | "setCardInclusionMode" | "setCardInclusionModeBatch">>(
    key: K,
    value: SettingsState[K],
  ) => void;
  setForcedIncludeCardIds: (ids: string[]) => void;
  setForcedExcludeCardIds: (ids: string[]) => void;
  setCardInclusionMode: (cardId: string, mode: "include" | "neutral" | "exclude") => void;
  setCardInclusionModeBatch: (cardIds: string[], mode: "include" | "neutral" | "exclude") => void;
  setChoosableCategoryOverride: (cardId: string, categoryIds: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      optimizationTarget: "monthly_cashback",
      setSetting: (key, value) => set(() => ({ [key]: value })),
      setForcedIncludeCardIds: (ids) => set(() => ({ forcedIncludeCardIds: ids })),
      setForcedExcludeCardIds: (ids) => set(() => ({ forcedExcludeCardIds: ids })),
      setCardInclusionMode: (cardId, mode) =>
        set((state) => ({
          cardInclusionModeById: {
            ...state.cardInclusionModeById,
            [cardId]: mode,
          },
        })),
      setCardInclusionModeBatch: (cardIds, mode) =>
        set((state) => {
          const next = { ...state.cardInclusionModeById };
          for (const id of cardIds) next[id] = mode;
          return { cardInclusionModeById: next };
        }),
      setChoosableCategoryOverride: (cardId, categoryIds) =>
        set((state) => {
          const next = { ...state.choosableCategoryOverrides };
          if (categoryIds.length > 0) next[cardId] = categoryIds;
          else delete next[cardId];
          return { choosableCategoryOverrides: next };
        }),
    }),
    {
      name: STORAGE_KEYS.settings,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<SettingsState>;

        // Migration from old forcedInclude/Exclude arrays
        const cardInclusionModeById = { ...persisted.cardInclusionModeById };

        if (persisted.forcedIncludeCardIds) {
          persisted.forcedIncludeCardIds.forEach((id) => {
            if (!cardInclusionModeById[id]) cardInclusionModeById[id] = "include";
          });
        }
        if (persisted.forcedExcludeCardIds) {
          persisted.forcedExcludeCardIds.forEach((id) => {
            if (!cardInclusionModeById[id]) cardInclusionModeById[id] = "exclude";
          });
        }

        return {
          ...currentState,
          ...persisted,
          cardInclusionModeById,
        };
      },
    },
  ),
);
