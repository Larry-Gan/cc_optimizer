import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Card } from "../types/card";
import { STORAGE_KEYS } from "../lib/defaults";

function isValidCard(candidate: unknown): candidate is Card {
  if (!candidate || typeof candidate !== "object") return false;
  const card = candidate as Partial<Card>;

  return (
    typeof card.id === "string" &&
    typeof card.name === "string" &&
    typeof card.issuer === "string" &&
    typeof card.network === "string" &&
    typeof card.cardType === "string" &&
    typeof card.annualFee === "number" &&
    typeof card.foreignTransactionFeePercent === "number" &&
    typeof card.isActive === "boolean" &&
    typeof card.baseCashbackPercent === "number" &&
    typeof card.notes === "string" &&
    typeof card.lastUpdated === "string" &&
    (card.url === null || typeof card.url === "string") &&
    Array.isArray(card.categoryBonuses) &&
    Array.isArray(card.perks) &&
    Array.isArray(card.exclusivityRules) &&
    Array.isArray(card.conditionalBonuses) &&
    Array.isArray(card.paymentMethodBonuses) &&
    Array.isArray(card.merchantCategoryOverrides) &&
    (card.signOnBonus === null || typeof card.signOnBonus === "object") &&
    !!card.pointsSystem &&
    typeof card.pointsSystem === "object"
  );
}

function sanitizeCards(value: unknown): Card[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isValidCard);
}

function sanitizeOwnedCardIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string");
}

interface CardState {
  builtinCards: Card[];
  customCards: Card[];
  ownedCardIds: string[];
  isLoaded: boolean;
  loadBuiltinCards: () => Promise<void>;
  addCustomCard: (card: Card) => void;
  updateCustomCard: (card: Card) => void;
  toggleOwnedCard: (cardId: string) => void;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      builtinCards: [],
      customCards: [],
      ownedCardIds: [],
      isLoaded: false,
      loadBuiltinCards: async () => {
        if (get().isLoaded) return;
        const response = await fetch(`${import.meta.env.BASE_URL}data/cards.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch cards: ${response.status} ${response.statusText}`);
        }
        const cards = sanitizeCards(await response.json());
        set({ builtinCards: cards, isLoaded: true });
      },
      addCustomCard: (card) => set((state) => ({ customCards: [...state.customCards, card] })),
      updateCustomCard: (card) =>
        set((state) => ({
          customCards: state.customCards.map((c) => (c.id === card.id ? card : c)),
        })),
      toggleOwnedCard: (cardId) =>
        set((state) => {
          const next = state.ownedCardIds.includes(cardId)
            ? state.ownedCardIds.filter((id) => id !== cardId)
            : [...state.ownedCardIds, cardId];
          return { ownedCardIds: next };
        }),
    }),
    {
      name: STORAGE_KEYS.cards,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<CardState>;
        return {
          ...currentState,
          customCards: sanitizeCards(persisted.customCards),
          ownedCardIds: sanitizeOwnedCardIds(persisted.ownedCardIds),
        };
      },
      partialize: (state) => ({
        customCards: state.customCards,
        ownedCardIds: state.ownedCardIds,
      }),
    },
  ),
);

export function useAllCards(): Card[] {
  const builtinCards = useCardStore((state) => state.builtinCards);
  const customCards = useCardStore((state) => state.customCards);
  return useMemo(() => [...builtinCards, ...customCards], [builtinCards, customCards]);
}
