import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../lib/defaults";
import type { Portfolio } from "../types/portfolio";
import { type CardFilterState, DEFAULT_CARD_FILTERS } from "../hooks/useFilteredCards";

interface PortfolioState {
  browseCardIds: string[];
  portfolioCardIds: string[];
  browseFilters: CardFilterState;
  portfolioFilters: CardFilterState;
  savedPortfolios: Portfolio[];
  compareSelectedPortfolioIds: string[];

  setBrowseCards: (cardIds: string[]) => void;
  toggleBrowseCard: (cardId: string) => void;
  setBrowseFilters: (filters: CardFilterState) => void;

  setPortfolioCards: (cardIds: string[]) => void;
  togglePortfolioCard: (cardId: string) => void;
  setPortfolioFilters: (filters: CardFilterState) => void;

  syncBrowseToPortfolio: () => void;
  syncPortfolioToBrowse: () => void;

  savePortfolio: (portfolio: Omit<Portfolio, "id" | "createdAt">) => void;
  renamePortfolio: (portfolioId: string, newName: string) => void;
  removePortfolio: (portfolioId: string) => void;
  setCompareSelectedPortfolioIds: (ids: string[]) => void;
  toggleCompareSelectedPortfolioId: (id: string) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      browseCardIds: [],
      portfolioCardIds: [],
      browseFilters: DEFAULT_CARD_FILTERS,
      portfolioFilters: DEFAULT_CARD_FILTERS,
      savedPortfolios: [],
      compareSelectedPortfolioIds: [],

      setBrowseCards: (cardIds) => set({ browseCardIds: cardIds }),
      toggleBrowseCard: (cardId) =>
        set((state) => ({
          browseCardIds: state.browseCardIds.includes(cardId)
            ? state.browseCardIds.filter((id) => id !== cardId)
            : [...state.browseCardIds, cardId],
        })),
      setBrowseFilters: (filters) => set({ browseFilters: filters }),

      setPortfolioCards: (cardIds) => set({ portfolioCardIds: cardIds }),
      togglePortfolioCard: (cardId) =>
        set((state) => ({
          portfolioCardIds: state.portfolioCardIds.includes(cardId)
            ? state.portfolioCardIds.filter((id) => id !== cardId)
            : [...state.portfolioCardIds, cardId],
        })),
      setPortfolioFilters: (filters) => set({ portfolioFilters: filters }),

      syncBrowseToPortfolio: () =>
        set((state) => ({ 
          portfolioCardIds: [...state.browseCardIds],
          portfolioFilters: { ...state.browseFilters }
        })),
      syncPortfolioToBrowse: () =>
        set((state) => ({ 
          browseCardIds: [...state.portfolioCardIds],
          browseFilters: { ...state.portfolioFilters }
        })),

      savePortfolio: (portfolio) =>
        set((state) => {
          let name = portfolio.name || "My Portfolio";
          const existingNames = state.savedPortfolios.map((p) => p.name);

          // If the name is already taken, or if it's the default "My Portfolio", make it unique
          if (existingNames.includes(name) || name === "My Portfolio") {
            let count = 1;
            const baseName = name === "My Portfolio" ? "My Portfolio" : name;
            while (existingNames.includes(`${baseName} #${count}`)) {
              count++;
            }
            name = `${baseName} #${count}`;
          }

          return {
            savedPortfolios: [
              ...state.savedPortfolios,
              {
                ...portfolio,
                name,
                id: `portfolio-${crypto.randomUUID()}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),
      renamePortfolio: (portfolioId, newName) =>
        set((state) => ({
          savedPortfolios: state.savedPortfolios.map((p) =>
            p.id === portfolioId ? { ...p, name: newName } : p
          ),
        })),
      removePortfolio: (portfolioId) =>
        set((state) => ({
          savedPortfolios: state.savedPortfolios.filter((p) => p.id !== portfolioId),
          compareSelectedPortfolioIds: state.compareSelectedPortfolioIds.filter(
            (id) => id !== portfolioId
          ),
        })),
      setCompareSelectedPortfolioIds: (ids) => set({ compareSelectedPortfolioIds: ids }),
      toggleCompareSelectedPortfolioId: (id) =>
        set((state) => ({
          compareSelectedPortfolioIds: state.compareSelectedPortfolioIds.includes(id)
            ? state.compareSelectedPortfolioIds.filter((i) => i !== id)
            : [...state.compareSelectedPortfolioIds, id],
        })),
    }),
    {
      name: STORAGE_KEYS.portfolio,
      // Migration: map old workingCardIds to both new states
      migrate: (persistedState: any, version: number) => {
        if (persistedState && persistedState.workingCardIds) {
          return {
            ...persistedState,
            browseCardIds: persistedState.workingCardIds,
            portfolioCardIds: persistedState.workingCardIds,
            browseFilters: DEFAULT_CARD_FILTERS,
            portfolioFilters: DEFAULT_CARD_FILTERS,
          };
        }
        return persistedState;
      },
    }
  )
);
