import { useMemo } from "react";
import { flattenCategoryTree } from "../../lib/categories";
import type { Card } from "../../types/card";
import { type CardFilterState, DEFAULT_CARD_FILTERS } from "../../hooks/useFilteredCards";

interface CardFiltersProps {
  cards: Card[];
  value: CardFilterState;
  onChange: (next: CardFilterState) => void;
}

export function CardFilters({ cards, value, onChange }: CardFiltersProps) {
  const issuers = useMemo(() => Array.from(new Set(cards.map((card) => card.issuer))).sort(), [cards]);
  const categories = flattenCategoryTree().filter((c) => c.depth === 0);

  const isFiltered = useMemo(() => {
    return JSON.stringify(value) !== JSON.stringify(DEFAULT_CARD_FILTERS);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-5">
        <input
          placeholder="Search cards"
          value={value.query}
          onChange={(event) => onChange({ ...value, query: event.target.value })}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <select
          value={value.issuer}
          onChange={(event) => onChange({ ...value, issuer: event.target.value })}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All issuers</option>
          {issuers.map((issuer) => (
            <option key={issuer} value={issuer}>
              {issuer}
            </option>
          ))}
        </select>
        <select
          value={value.network}
          onChange={(event) => onChange({ ...value, network: event.target.value })}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All networks</option>
          <option value="Visa">Visa</option>
          <option value="Mastercard">Mastercard</option>
          <option value="Amex">Amex</option>
          <option value="Discover">Discover</option>
        </select>
        <select
          value={value.type}
          onChange={(event) => onChange({ ...value, type: event.target.value as CardFilterState["type"] })}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="all">All card types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <select
          value={value.categoryId}
          onChange={(event) => onChange({ ...value, categoryId: event.target.value })}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">Any bonus category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      {isFiltered && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CARD_FILTERS)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
