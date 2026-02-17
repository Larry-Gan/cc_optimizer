import { useMemo, useState } from "react";
import { SpendProfileEditor } from "../components/spend/SpendProfileEditor";
import { PortfolioBreakdown } from "../components/portfolio/PortfolioBreakdown";
import { PortfolioSummary } from "../components/portfolio/PortfolioSummary";
import { scorePortfolio } from "../lib/calculations";
import { useAllCards } from "../stores/useCardStore";
import { usePortfolioStore } from "../stores/usePortfolioStore";
import { useActiveSpendProfile } from "../stores/useSpendStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { CollapsibleSection } from "../components/layout/CollapsibleSection";
import { CardBrowseSection } from "../components/cards/CardBrowseSection";

export function PortfolioPage() {
  const [name, setName] = useState("My Portfolio");
  const cards = useAllCards();
  const spend = useActiveSpendProfile();
  const includeSub = useSettingsStore((state) => state.includeSignOnBonusInFirstYear);
  const rotatingMode = useSettingsStore((state) => state.rotatingMode);
  const currentQuarter = useSettingsStore((state) => state.currentQuarter);
  
  const portfolioCardIds = usePortfolioStore((state) => state.portfolioCardIds);
  const setPortfolioCards = usePortfolioStore((state) => state.setPortfolioCards);
  const togglePortfolioCard = usePortfolioStore((state) => state.togglePortfolioCard);
  const portfolioFilters = usePortfolioStore((state) => state.portfolioFilters);
  const setPortfolioFilters = usePortfolioStore((state) => state.setPortfolioFilters);
  const syncBrowseToPortfolio = usePortfolioStore((state) => state.syncBrowseToPortfolio);
  const savePortfolio = usePortfolioStore((state) => state.savePortfolio);

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.name.localeCompare(b.name)),
    [cards],
  );

  const selectedCards = useMemo(
    () => cards.filter((card) => portfolioCardIds.includes(card.id)),
    [cards, portfolioCardIds],
  );

  const scored = scorePortfolio(selectedCards, spend.monthlySpend, includeSub, {
    rotatingMode,
    currentQuarter,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">My Portfolio</h2>
      
      <CollapsibleSection id="portfolio-spend" title="Spend Profile" defaultOpen={false}>
        <SpendProfileEditor />
      </CollapsibleSection>

      <CollapsibleSection id="portfolio-cards" title="Cards in Working Portfolio">
        <CardBrowseSection
          cards={sortedCards}
          selectedCardIds={portfolioCardIds}
          onToggleCard={togglePortfolioCard}
          onSetCards={setPortfolioCards}
          filters={portfolioFilters}
          onFiltersChange={setPortfolioFilters}
          showSavePortfolio
          portfolioName={name}
          onPortfolioNameChange={setName}
          onSavePortfolio={() =>
            savePortfolio({
              name,
              cardIds: selectedCards.map((card) => card.id),
              categoryAssignments: Object.fromEntries(
                scored.allocation.map((row) => [row.categoryId, row.cardId]),
              ),
              source: "manual",
            })
          }
          saveDisabled={portfolioCardIds.length === 0}
          syncButton={{
            label: "Sync from Browse",
            onClick: syncBrowseToPortfolio,
          }}
        />
      </CollapsibleSection>

      <PortfolioSummary score={scored.score} />
      <PortfolioBreakdown rows={scored.allocation} />
    </div>
  );
}
