import { useMemo } from "react";
import type { Card, CategoryBonus } from "../../types/card";
import { type CardFilterState, DEFAULT_CARD_FILTERS, useFilteredCards } from "../../hooks/useFilteredCards";
import { CardFilters } from "./CardFilters";
import { CardStatsBar } from "./CardStatsBar";
import { CardTile } from "./CardTile";

interface CardBrowseSectionProps {
  cards: Card[];
  selectedCardIds?: string[];
  onToggleCard?: (cardId: string) => void;
  onSetCards?: (cardIds: string[]) => void;
  filters: CardFilterState;
  onFiltersChange: (filters: CardFilterState) => void;
  
  // Optional features
  advancedControls?: {
    cardInclusionModeById: Record<string, "include" | "neutral" | "exclude">;
    onInclusionModeChange: (cardId: string, mode: "include" | "neutral" | "exclude") => void;
    choosableCategoryOverrides: Record<string, string[]>;
    onOverrideChange: (cardId: string, categoryIds: string[]) => void;
    categoryOptions: { id: string; label: string; depth: number }[];
  };
  
  showSavePortfolio?: boolean;
  portfolioName?: string;
  onPortfolioNameChange?: (name: string) => void;
  onSavePortfolio?: () => void;
  saveDisabled?: boolean;
  
  syncButton?: {
    label: string;
    onClick: () => void;
  };
}

export function CardBrowseSection({
  cards,
  selectedCardIds,
  onToggleCard,
  onSetCards,
  filters,
  onFiltersChange,
  advancedControls,
  showSavePortfolio,
  portfolioName,
  onPortfolioNameChange,
  onSavePortfolio,
  saveDisabled,
  syncButton,
}: CardBrowseSectionProps) {
  const filtered = useFilteredCards(cards, filters);
  const filteredIds = useMemo(() => new Set(filtered.map((c) => c.id)), [filtered]);

  const selectAllFiltered = () =>
    onSetCards?.([...new Set([...(selectedCardIds || []), ...filtered.map((c) => c.id)])]);
  
  const deselectAllFiltered = () =>
    onSetCards?.((selectedCardIds || []).filter((id) => !filteredIds.has(id)));
  
  const selectAll = () => {
    onFiltersChange(DEFAULT_CARD_FILTERS);
    onSetCards?.(cards.map((c) => c.id));
  };
  
  const deselectAll = () => onSetCards?.([]);

  const showBulkActions = onSetCards != null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <CardFilters cards={cards} value={filters} onChange={onFiltersChange} />
        </div>
        {syncButton && (
          <div className="pt-4 sm:pt-[17px]">
            <button
              onClick={syncButton.onClick}
              className="shrink-0 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 h-[38px] flex items-center"
            >
              {syncButton.label}
            </button>
          </div>
        )}
      </div>

      {showBulkActions && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={selectAllFiltered}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Select all (filtered)
          </button>
          <button
            type="button"
            onClick={deselectAllFiltered}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Deselect all (filtered)
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Select all (all cards)
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Deselect all (all cards)
          </button>
        </div>
      )}

      <CardStatsBar cards={filtered} totalCount={cards.length} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((card) => {
          let tileAdvanced;
          if (advancedControls) {
            const choosableBonus = card.categoryBonuses.find((b) => b.isUserChoosable);
            tileAdvanced = {
              inclusionMode: advancedControls.cardInclusionModeById[card.id] ?? "neutral",
              onInclusionModeChange: advancedControls.onInclusionModeChange,
              choosableBonus,
              categoryOptions: advancedControls.categoryOptions,
              currentOverrides: advancedControls.choosableCategoryOverrides[card.id] ?? [],
              onOverrideChange: advancedControls.onOverrideChange,
            };
          }

          const portfolioSelection = (selectedCardIds && onToggleCard) ? {
            selected: selectedCardIds.includes(card.id),
            onToggle: onToggleCard,
          } : undefined;

          return (
            <CardTile
              key={card.id}
              card={card}
              portfolioSelection={portfolioSelection}
              advancedControls={tileAdvanced}
            />
          );
        })}
      </div>

      {showSavePortfolio && (
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
          <input
            value={portfolioName}
            onChange={(e) => onPortfolioNameChange?.(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="Portfolio name"
          />
          <button
            type="button"
            onClick={onSavePortfolio}
            disabled={saveDisabled}
            className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Portfolio
          </button>
        </div>
      )}
    </div>
  );
}
