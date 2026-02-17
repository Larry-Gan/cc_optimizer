import { useMemo, useState } from "react";
import { useAllCards } from "../stores/useCardStore";
import { usePortfolioStore } from "../stores/usePortfolioStore";
import { useActiveSpendProfile } from "../stores/useSpendStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { scorePortfolio } from "../lib/calculations";
import { CollapsibleSection } from "../components/layout/CollapsibleSection";
import { CardBrowseSection } from "../components/cards/CardBrowseSection";

export function BrowsePage() {
  const cards = useAllCards();
  const toggleBrowseCard = usePortfolioStore((state) => state.toggleBrowseCard);
  const browseCardIds = usePortfolioStore((state) => state.browseCardIds);
  const setBrowseCards = usePortfolioStore((state) => state.setBrowseCards);
  const browseFilters = usePortfolioStore((state) => state.browseFilters);
  const setBrowseFilters = usePortfolioStore((state) => state.setBrowseFilters);
  const syncPortfolioToBrowse = usePortfolioStore((state) => state.syncPortfolioToBrowse);
  const savePortfolio = usePortfolioStore((state) => state.savePortfolio);
  
  const spend = useActiveSpendProfile();
  const includeSub = useSettingsStore((state) => state.includeSignOnBonusInFirstYear);
  const rotatingMode = useSettingsStore((state) => state.rotatingMode);
  const currentQuarter = useSettingsStore((state) => state.currentQuarter);
  const [portfolioName, setPortfolioName] = useState("My Portfolio");

  const sortedCards = useMemo(() => [...cards].sort((a, b) => a.name.localeCompare(b.name)), [cards]);
  const selectedCards = useMemo(
    () => cards.filter((c) => browseCardIds.includes(c.id)),
    [cards, browseCardIds],
  );

  const handleSavePortfolio = () => {
    if (selectedCards.length === 0) return;
    const scored = scorePortfolio(selectedCards, spend.monthlySpend, includeSub, {
      rotatingMode,
      currentQuarter,
    });
    savePortfolio({
      name: portfolioName,
      cardIds: selectedCards.map((c) => c.id),
      categoryAssignments: Object.fromEntries(
        scored.allocation.map((row) => [row.categoryId, row.cardId]),
      ),
      source: "manual",
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Browse</h2>
      <CollapsibleSection id="browse-cards" title="Browse Cards">
        <CardBrowseSection
          cards={sortedCards}
          selectedCardIds={browseCardIds}
          onToggleCard={toggleBrowseCard}
          onSetCards={setBrowseCards}
          filters={browseFilters}
          onFiltersChange={setBrowseFilters}
          showSavePortfolio
          portfolioName={portfolioName}
          onPortfolioNameChange={setPortfolioName}
          onSavePortfolio={handleSavePortfolio}
          saveDisabled={browseCardIds.length === 0}
          syncButton={{
            label: "Sync from Portfolio",
            onClick: syncPortfolioToBrowse,
          }}
        />
      </CollapsibleSection>
    </div>
  );
}
