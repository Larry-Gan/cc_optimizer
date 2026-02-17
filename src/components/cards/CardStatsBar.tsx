import type { Card } from "../../types/card";

interface CardStatsBarProps {
  cards: Card[];
  totalCount?: number;
}

export function CardStatsBar({ cards, totalCount }: CardStatsBarProps) {
  const feeRange =
    cards.length === 0
      ? "$0 - $0"
      : `$${Math.min(...cards.map((c) => c.annualFee))} - $${Math.max(...cards.map((c) => c.annualFee))}`;

  const avgSignOn =
    cards.length === 0
      ? 0
      : cards.reduce((sum, card) => sum + (card.signOnBonus?.bonusAmount ?? 0), 0) / cards.length;

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
        Matching cards: <span className="font-semibold text-white">{cards.length}</span>
      </div>
      {totalCount !== undefined && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
          Total cards available: <span className="font-semibold text-white">{totalCount}</span>
        </div>
      )}
      <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
        Annual fee range: <span className="font-semibold text-white">{feeRange}</span>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
        Avg sign-on bonus: <span className="font-semibold text-white">${avgSignOn.toFixed(0)}</span>
      </div>
    </div>
  );
}
