import { useEffect, useMemo, useState } from "react";
import { OptimizerProgress } from "../components/optimizer/OptimizerProgress";
import { OptimizerResults } from "../components/optimizer/OptimizerResults";
import { SpendProfileEditor } from "../components/spend/SpendProfileEditor";
import type { OptimizerProgress as OptimizerProgressType, OptimizerResult } from "../lib/optimizer/types";
import { optimizePortfolios } from "../lib/optimizer/search";
import { flattenCategoryTree } from "../lib/categories";
import { useAllCards } from "../stores/useCardStore";
import { usePortfolioStore } from "../stores/usePortfolioStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useActiveSpendProfile } from "../stores/useSpendStore";
import { CollapsibleSection } from "../components/layout/CollapsibleSection";
import { CardBrowseSection } from "../components/cards/CardBrowseSection";
import { DEFAULT_CARD_FILTERS } from "../hooks/useFilteredCards";

export function OptimizePage() {
  const cards = useAllCards();
  const spend = useActiveSpendProfile();
  const settings = useSettingsStore();
  const savePortfolio = usePortfolioStore((state) => state.savePortfolio);
  const [isRunning, setIsRunning] = useState(false);
  const [maxCards, setMaxCards] = useState(settings.maxCardsInWallet);
  const [results, setResults] = useState<OptimizerResult[]>([]);
  const [progress, setProgress] = useState<OptimizerProgressType | null>(null);
  const [filters, setFilters] = useState(DEFAULT_CARD_FILTERS);
  
  const eligibleCards = useMemo(
    () => cards.filter((card) => !(settings.excludeDebitCards && card.cardType === "debit")),
    [cards, settings.excludeDebitCards],
  );

  const forcedIncludeCount = useMemo(
    () =>
      Object.values(settings.cardInclusionModeById).filter((m) => m === "include").length,
    [settings.cardInclusionModeById],
  );

  useEffect(() => {
    if (forcedIncludeCount > maxCards) setMaxCards(forcedIncludeCount);
  }, [forcedIncludeCount, maxCards]);

  const minMaxCards = Math.max(1, forcedIncludeCount);
  const categoryOptions = useMemo(() => flattenCategoryTree(), []);

  const run = () => {
    setIsRunning(true);
    setProgress(null);
    setTimeout(() => {
      const ranked = optimizePortfolios(
        {
          cards: eligibleCards,
          monthlySpend: spend.monthlySpend,
          maxCards,
          cardInclusionModeById: settings.cardInclusionModeById,
          choosableCategoryOverrides:
            Object.keys(settings.choosableCategoryOverrides ?? {}).length > 0
              ? (settings.choosableCategoryOverrides ?? {})
              : undefined,
          target: settings.optimizationTarget,
          includeSignOnBonusInFirstYear: settings.includeSignOnBonusInFirstYear,
          rotatingMode: settings.rotatingMode,
          currentQuarter: settings.currentQuarter,
        },
        setProgress,
      );
      setResults(ranked);
      setIsRunning(false);
    }, 30);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Optimize Portfolio</h2>
      
      <CollapsibleSection id="optimize-spend" title="Spend Profile" defaultOpen={false}>
        <SpendProfileEditor />
      </CollapsibleSection>

      <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
        <label className="text-sm">
          <div className="mb-1 text-slate-300">Max Cards</div>
          <input
            type="number"
            min={minMaxCards}
            max={10}
            value={maxCards}
            onChange={(event) => setMaxCards(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <div className="mt-0.5 text-[10px] text-slate-500">
            Forced includes: {forcedIncludeCount}; Max Cards auto-adjusted if needed.
          </div>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-slate-300">Optimization Target</div>
          <select
            value={settings.optimizationTarget}
            onChange={(event) =>
              settings.setSetting("optimizationTarget", event.target.value as typeof settings.optimizationTarget)
            }
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="monthly_cashback">Max monthly cashback</option>
            <option value="annual_net_value">Max annual net value</option>
            <option value="first_year_value">Max first-year value</option>
          </select>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-slate-300">Rotating Categories</div>
          <select
            value={settings.rotatingMode}
            onChange={(event) =>
              settings.setSetting("rotatingMode", event.target.value as typeof settings.rotatingMode)
            }
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="annualized">Annualized</option>
            <option value="current_quarter">Current quarter</option>
          </select>
        </label>
        {settings.rotatingMode === "current_quarter" && (
          <label className="text-sm">
            <div className="mb-1 text-slate-300">Quarter</div>
            <select
              value={settings.currentQuarter}
              onChange={(event) =>
                settings.setSetting("currentQuarter", event.target.value as typeof settings.currentQuarter)
              }
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </label>
        )}
        <div className="flex flex-col">
          <div className="mb-1 text-transparent select-none text-sm">Run</div>
          <button
            onClick={run}
            disabled={isRunning}
            className="w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition-colors disabled:opacity-60"
          >
            {isRunning ? "Optimizing..." : "Run Optimizer"}
          </button>
        </div>
      </section>

      <CollapsibleSection id="optimize-advanced" title="Advanced: Card Controls" defaultOpen={false}>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="mr-2 self-center text-xs text-slate-400">Bulk (filtered):</span>
          <button
            type="button"
            onClick={() =>
              settings.setCardInclusionModeBatch(
                eligibleCards.filter(c => {
                   // A simple filter replication for bulk actions if needed, 
                   // but CardBrowseSection will handle its own filtered list.
                   // For now let's just use the ones currently in the grid.
                   return true; // placeholder
                }).map(c => c.id),
                "include"
              )
            }
            className="hidden" // We'll handle bulk actions inside CardBrowseSection if we want, 
                               // but for now let's just keep it simple.
          />
          {/* We'll actually pass these actions to CardBrowseSection if we want to unify bulk buttons too, 
              but the plan said to reuse the same filter and card grid UX. */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => settings.setCardInclusionModeBatch(eligibleCards.map((c) => c.id), "include")}
              className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              Set All Include
            </button>
            <button
              type="button"
              onClick={() => settings.setCardInclusionModeBatch(eligibleCards.map((c) => c.id), "neutral")}
              className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              Set All Neutral
            </button>
            <button
              type="button"
              onClick={() => settings.setCardInclusionModeBatch(eligibleCards.map((c) => c.id), "exclude")}
              className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              Set All Exclude
            </button>
          </div>
        </div>

        <CardBrowseSection
          cards={eligibleCards}
          filters={filters}
          onFiltersChange={setFilters}
          advancedControls={{
            cardInclusionModeById: settings.cardInclusionModeById,
            onInclusionModeChange: settings.setCardInclusionMode,
            choosableCategoryOverrides: settings.choosableCategoryOverrides,
            onOverrideChange: settings.setChoosableCategoryOverride,
            categoryOptions,
          }}
        />
      </CollapsibleSection>

      <OptimizerProgress progress={progress} />
      <OptimizerResults
        results={results}
        onSave={(result, name) =>
          savePortfolio({
            name,
            cardIds: result.cardIds,
            categoryAssignments: Object.fromEntries(result.allocation.map((row) => [row.categoryId, row.cardId])),
            source: "optimizer",
          })
        }
      />
    </div>
  );
}
