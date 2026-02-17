import { useState } from "react";
import { formatCalcLimit, formatOriginalLimit } from "../../lib/cardUtils";
import type { Card, CategoryBonus } from "../../types/card";

export interface CardTilePortfolioSelection {
  selected: boolean;
  onToggle: (cardId: string) => void;
}

export interface CardTileAdvancedControls {
  inclusionMode: "include" | "neutral" | "exclude";
  onInclusionModeChange: (cardId: string, mode: "include" | "neutral" | "exclude") => void;
  choosableBonus: CategoryBonus | undefined;
  categoryOptions: { id: string; label: string; depth: number }[];
  currentOverrides: string[];
  onOverrideChange: (cardId: string, categoryIds: string[]) => void;
}

interface CardTileProps {
  card: Card;
  /** Selection: show checkbox and highlighted border if selected */
  portfolioSelection?: CardTilePortfolioSelection;
  /** Advanced (optimizer): show include/neutral/exclude + category override */
  advancedControls?: CardTileAdvancedControls;
}

export function CardTile({
  card,
  portfolioSelection,
  advancedControls,
}: CardTileProps) {
  const topBonuses = [...card.categoryBonuses]
    .sort((a, b) => b.cashbackPercent - a.cashbackPercent)
    .slice(0, 3);

  const showPortfolioCheckbox = portfolioSelection != null;
  const showAdvancedControls = advancedControls != null;
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{card.name}</h3>
          <p className="text-sm text-slate-300">
            {card.issuer} · {card.network} · {card.cardType}
          </p>
        </div>
        {showPortfolioCheckbox && (
          <input
            type="checkbox"
            checked={portfolioSelection!.selected}
            onChange={() => portfolioSelection!.onToggle(card.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
        )}
        {showAdvancedControls && (
          <div className="inline-flex rounded-md border border-slate-700 bg-slate-950 p-0.5 shadow-inner" onClick={e => e.preventDefault()}>
            {(["include", "neutral", "exclude"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  advancedControls!.onInclusionModeChange(card.id, m);
                }}
                className={`rounded border-none px-2 py-1 text-[10px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-950 ${
                  advancedControls!.inclusionMode === m
                    ? m === "include"
                      ? "bg-emerald-600/90 text-white shadow"
                      : m === "exclude"
                        ? "bg-rose-600/90 text-white shadow"
                        : "bg-slate-600 text-slate-100 shadow"
                    : "bg-transparent text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
      <ul className="mt-3 space-y-1 text-sm text-slate-200">
        {topBonuses.map((bonus) => (
          <li key={`${card.id}-${bonus.categoryId}`}>
            {bonus.cashbackPercent}% on {bonus.categoryId}
            {bonus.spendLimit.amount ? (
              <span className="ml-1 text-slate-400">
                ({formatOriginalLimit(bonus.spendLimit)}; {formatCalcLimit(bonus.spendLimit)})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-slate-300">
        <span>Base cashback: {card.baseCashbackPercent}%</span>
        <span>Annual fee: ${card.annualFee}</span>
        <span>FTF: {card.foreignTransactionFeePercent}%</span>
      </div>

      {showAdvancedControls && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-700 pt-3">
          {advancedControls.choosableBonus && (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setManualOverrideOpen((o) => !o);
                }}
                className="flex items-center justify-between text-left text-[10px] font-medium uppercase tracking-wide text-slate-400 hover:text-slate-300"
              >
                <span>Manual Override (max {advancedControls.choosableBonus.maxChoosableSlots ?? 1})</span>
                <span className="text-slate-500">{manualOverrideOpen ? "▼" : "▶"}</span>
              </button>
              {manualOverrideOpen && (
                <select
                  multiple
                  value={advancedControls.currentOverrides}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const chosen = Array.from(e.target.selectedOptions, (opt) => opt.value).slice(
                      0,
                      advancedControls.choosableBonus?.maxChoosableSlots ?? 1,
                    );
                    advancedControls.onOverrideChange(card.id, chosen);
                  }}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 p-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  size={Math.min(5, advancedControls.categoryOptions.length)}
                >
                  {advancedControls.categoryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {"  ".repeat(opt.depth)}{opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  if (portfolioSelection) {
    return (
      <label
        className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
          portfolioSelection.selected
            ? "border-indigo-500/50 bg-indigo-900/40"
            : "border-slate-800 bg-slate-900 hover:border-slate-600"
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={portfolioSelection.selected}
          onChange={() => portfolioSelection.onToggle(card.id)}
        />
        {content}
      </label>
    );
  }

  return (
    <div
      className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700"
    >
      {content}
    </div>
  );
}
