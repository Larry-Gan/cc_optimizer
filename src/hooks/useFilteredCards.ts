import { useMemo } from "react";
import { getDescendants } from "../lib/categories";
import type { Card } from "../types/card";

export interface CardFilterState {
  query: string;
  issuer: string;
  network: string;
  type: "all" | "credit" | "debit";
  categoryId: string;
}

export const DEFAULT_CARD_FILTERS: CardFilterState = {
  query: "",
  issuer: "",
  network: "",
  type: "all",
  categoryId: "",
};

export function useFilteredCards(cards: Card[], filters: CardFilterState) {
  return useMemo(() => {
    const categoryTargets = filters.categoryId ? getDescendants(filters.categoryId) : [];
    return cards.filter((card) => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const matched =
          card.name.toLowerCase().includes(q) ||
          card.issuer.toLowerCase().includes(q) ||
          card.notes.toLowerCase().includes(q);
        if (!matched) return false;
      }
      if (filters.issuer && card.issuer !== filters.issuer) return false;
      if (filters.network && card.network !== filters.network) return false;
      if (filters.type !== "all" && card.cardType !== filters.type) return false;
      if (filters.categoryId && !card.categoryBonuses.some((bonus) => categoryTargets.includes(bonus.categoryId))) {
        return false;
      }
      return true;
    });
  }, [cards, filters]);
}
