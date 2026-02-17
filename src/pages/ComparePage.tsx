import { useState } from "react";
import { ComparerTable } from "../components/comparer/ComparerTable";
import { useAllCards } from "../stores/useCardStore";
import { usePortfolioStore } from "../stores/usePortfolioStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useActiveSpendProfile } from "../stores/useSpendStore";
import { CollapsibleSection } from "../components/layout/CollapsibleSection";
import { SpendProfileEditor } from "../components/spend/SpendProfileEditor";
import { ConfirmModal } from "../components/layout/ConfirmModal";
import type { Portfolio } from "../types/portfolio";

export function ComparePage() {
  const allCards = useAllCards();
  const spend = useActiveSpendProfile();
  const settings = useSettingsStore();
  const rotatingMode = useSettingsStore((state) => state.rotatingMode);
  const currentQuarter = useSettingsStore((state) => state.currentQuarter);
  const savedPortfolios = usePortfolioStore((state) => state.savedPortfolios);
  const renamePortfolio = usePortfolioStore((state) => state.renamePortfolio);
  const removePortfolio = usePortfolioStore((state) => state.removePortfolio);
  const selectedIds = usePortfolioStore((state) => state.compareSelectedPortfolioIds);
  const setSelectedIds = usePortfolioStore((state) => state.setCompareSelectedPortfolioIds);
  const togglePortfolio = usePortfolioStore((state) => state.toggleCompareSelectedPortfolioId);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const selected = savedPortfolios.filter((portfolio) => selectedIds.includes(portfolio.id));

  const handleDeleteConfirm = (dontAskAgain: boolean) => {
    if (isDeletingSelected) {
      selectedIds.forEach((id) => removePortfolio(id));
      if (dontAskAgain) {
        settings.setSetting("skipDeletePortfolioConfirmation", true);
      }
      setIsDeletingSelected(false);
    } else if (deleteId) {
      removePortfolio(deleteId);
      if (dontAskAgain) {
        settings.setSetting("skipDeletePortfolioConfirmation", true);
      }
      setDeleteId(null);
    }
  };

  const handleDeleteSelectedClick = () => {
    if (selectedIds.length === 0) return;
    if (settings.skipDeletePortfolioConfirmation) {
      selectedIds.forEach((id) => removePortfolio(id));
    } else {
      setIsDeletingSelected(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (settings.skipDeletePortfolioConfirmation) {
      removePortfolio(id);
    } else {
      setDeleteId(id);
      setIsDeletingSelected(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(savedPortfolios.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Compare Portfolios</h2>
      
      <CollapsibleSection id="compare-spend" title="Spend Profile" defaultOpen={false}>
        <SpendProfileEditor />
      </CollapsibleSection>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Select 2 or more portfolios
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSelectAll}
              disabled={savedPortfolios.length === 0}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={selectedIds.length === 0}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              Deselect All
            </button>
            <button
              onClick={handleDeleteSelectedClick}
              disabled={selectedIds.length === 0}
              className="rounded-md border border-rose-900/50 bg-rose-950/20 px-3 py-1 text-xs text-rose-400 hover:bg-rose-900/40 disabled:opacity-50"
            >
              Delete Selected
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {savedPortfolios.map((portfolio) => (
            <PortfolioSelectorItem
              key={portfolio.id}
              portfolio={portfolio}
              allCards={allCards}
              isSelected={selectedIds.includes(portfolio.id)}
              onToggle={togglePortfolio}
              onRename={renamePortfolio}
              onDelete={handleDeleteClick}
            />
          ))}
          {savedPortfolios.length === 0 && (
            <p className="text-sm text-slate-500 py-4 col-span-2 text-center">
              No saved portfolios yet. Create some in the Browse or Optimize tabs.
            </p>
          )}
        </div>
      </section>

      <ComparerTable
        portfolios={selected}
        allCards={allCards}
        monthlySpend={spend.monthlySpend}
        rotatingMode={rotatingMode}
        currentQuarter={currentQuarter}
      />

      <ConfirmModal
        isOpen={deleteId !== null || isDeletingSelected}
        onClose={() => {
          setDeleteId(null);
          setIsDeletingSelected(false);
        }}
        onConfirm={handleDeleteConfirm}
        title={isDeletingSelected ? "Delete Selected Portfolios?" : "Delete Portfolio?"}
        message={
          isDeletingSelected
            ? `Are you sure you want to delete ${selectedIds.length} selected portfolios? This cannot be undone.`
            : `Are you sure you want to delete "${savedPortfolios.find((p) => p.id === deleteId)?.name}"? This cannot be undone.`
        }
      />
    </div>
  );
}

function PortfolioSelectorItem({
  portfolio,
  allCards,
  isSelected,
  onToggle,
  onRename,
  onDelete,
}: {
  portfolio: Portfolio;
  allCards: any[];
  isSelected: boolean;
  onToggle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(portfolio.name);

  const cardNames = portfolio.cardIds
    .map((id) => allCards.find((c) => c.id === id)?.name)
    .filter(Boolean);
  
  const handleRename = (e?: React.FormEvent) => {
    e?.preventDefault();
    onRename(portfolio.id, newName);
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => !isEditing && onToggle(portfolio.id)}
      className={`group relative flex flex-col rounded-lg border p-3 transition-colors cursor-pointer ${
        isSelected ? "border-indigo-500/50 bg-indigo-900/20" : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(portfolio.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          {isEditing ? (
            <form onSubmit={handleRename} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => handleRename()}
                className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-0.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </form>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-slate-100" title={portfolio.name}>
                  {portfolio.name}
                </span>
                <span className="shrink-0 text-[10px] text-slate-500 uppercase tracking-tighter bg-slate-800/50 px-1 rounded">
                  {portfolio.source}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Rename"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(portfolio.id);
            }}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 rounded transition-colors"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 px-1">
          {portfolio.cardIds.length} cards
        </div>
        <div className="max-h-20 overflow-y-auto custom-scrollbar px-1 py-0.5 rounded bg-black/10">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {cardNames.map((name, i) => (
              <span key={i} className="text-xs text-slate-400 whitespace-nowrap">
                {name}{i < cardNames.length - 1 ? " ·" : ""}
              </span>
            ))}
            {cardNames.length === 0 && (
              <span className="text-xs text-slate-600 italic">No cards</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
