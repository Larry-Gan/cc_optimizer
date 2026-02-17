import { useState, useMemo, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Portfolio, PortfolioScore } from "../../types/portfolio";
import type { Card } from "../../types/card";
import { scorePortfolio } from "../../lib/calculations";
import { CardTile } from "../cards/CardTile";

interface ComparerTableProps {
  portfolios: Portfolio[];
  allCards: Card[];
  monthlySpend: Record<string, number>;
  rotatingMode: "annualized" | "current_quarter";
  currentQuarter: "Q1" | "Q2" | "Q3" | "Q4";
}

type SortMetric = keyof PortfolioScore | "cards_count";
interface SortState {
  metric: SortMetric;
  direction: "asc" | "desc";
}

const availableMetrics: { id: SortMetric; label: string; defaultDir: "asc" | "desc" }[] = [
  { id: "monthlyCashback", label: "Monthly Cashback", defaultDir: "desc" },
  { id: "netAnnualValue", label: "Net Annual Value", defaultDir: "desc" },
  { id: "firstYearValue", label: "Year 1 w/ SUB", defaultDir: "desc" },
  { id: "annualFees", label: "Annual Fees", defaultDir: "asc" },
  { id: "annualPerks", label: "Perk Value", defaultDir: "desc" },
  { id: "cards_count", label: "Cards Count", defaultDir: "desc" },
];

function SortableSortPill({
  sort,
  idx,
  isFirst,
  isLast,
  isOnly,
  onToggleDir,
  onMoveToFirst,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  sort: SortState;
  idx: number;
  isFirst: boolean;
  isLast: boolean;
  isOnly: boolean;
  onToggleDir: (metric: SortMetric) => void;
  onMoveToFirst: (metric: SortMetric) => void;
  onRemove: (metric: SortMetric) => void;
  onMoveUp: (metric: SortMetric) => void;
  onMoveDown: (metric: SortMetric) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sort.metric,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const metricDef = availableMetrics.find((m) => m.id === sort.metric);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        idx === 0
          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200"
          : "bg-slate-800/40 border-slate-700 text-slate-400"
      }`}
    >
      <button
        type="button"
        className="mr-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="flex items-center cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <span className={`mr-1 ${idx === 0 ? "text-indigo-500" : "text-slate-600"}`}>#{idx + 1}</span>
        <span>{metricDef?.label}</span>
      </div>
      <div className="flex items-center ml-1 pl-1 border-l border-white/10 gap-0.5">
        <button
          onClick={() => onToggleDir(sort.metric)}
          className="p-1 hover:text-white transition-colors"
          title={`Sort ${sort.direction === "desc" ? "Descending" : "Ascending"} (Click to toggle)`}
        >
          {sort.direction === "desc" ? "↓" : "↑"}
        </button>
        
        <div className="flex flex-col -gap-1">
          <button
            onClick={() => onMoveUp(sort.metric)}
            disabled={isFirst}
            className={`px-1 text-[8px] transition-colors ${
              isFirst ? "text-slate-700 cursor-not-allowed" : "text-slate-400 hover:text-white"
            }`}
            title="Move up"
          >
            ▲
          </button>
          <button
            onClick={() => onMoveDown(sort.metric)}
            disabled={isLast}
            className={`px-1 text-[8px] transition-colors ${
              isLast ? "text-slate-700 cursor-not-allowed" : "text-slate-400 hover:text-white"
            }`}
            title="Move down"
          >
            ▼
          </button>
        </div>

        {!isFirst && (
          <button
            onClick={() => onMoveToFirst(sort.metric)}
            className="p-1 hover:text-indigo-400 transition-colors text-[10px]"
            title="Make primary"
          >
            🔝
          </button>
        )}
        {!isOnly && (
          <button
            onClick={() => onRemove(sort.metric)}
            className="p-1 hover:text-rose-400 transition-colors"
            title="Remove sort"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export function ComparerTable({
  portfolios,
  allCards,
  monthlySpend,
  rotatingMode,
  currentQuarter,
}: ComparerTableProps) {
  const [sorts, setSorts] = useState<SortState[]>([
    { metric: "monthlyCashback", direction: "desc" },
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const rows = useMemo(() => {
    return portfolios.map((portfolio) => {
      const cards = portfolio.cardIds
        .map((id) => allCards.find((card) => card.id === id))
        .filter((card): card is Card => Boolean(card));
      const score = scorePortfolio(cards, monthlySpend, true, {
        rotatingMode,
        currentQuarter,
      }).score;
      return { portfolio, score, cards };
    });
  }, [portfolios, allCards, monthlySpend, rotatingMode, currentQuarter]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      for (const sort of sorts) {
        let valA: number;
        let valB: number;

        if (sort.metric === "cards_count") {
          valA = a.portfolio.cardIds.length;
          valB = b.portfolio.cardIds.length;
        } else {
          valA = a.score[sort.metric as keyof PortfolioScore];
          valB = b.score[sort.metric as keyof PortfolioScore];
        }

        if (valA !== valB) {
          const res = valA > valB ? 1 : -1;
          return sort.direction === "desc" ? -res : res;
        }
      }
      return 0;
    });
  }, [rows, sorts]);

  if (portfolios.length < 2) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <p className="text-slate-400">Select at least 2 portfolios to compare.</p>
      </div>
    );
  }

  const bestPerMetric = {
    monthlyCashback: Math.max(...rows.map(r => r.score.monthlyCashback)),
    annualFees: Math.min(...rows.map(r => r.score.annualFees)),
    annualPerks: Math.max(...rows.map(r => r.score.annualPerks)),
    netAnnualValue: Math.max(...rows.map(r => r.score.netAnnualValue)),
    firstYearValue: Math.max(...rows.map(r => r.score.firstYearValue)),
    cardsCount: Math.max(...rows.map(r => r.portfolio.cardIds.length)),
  };

  const addSort = (metric: SortMetric) => {
    setSorts((prev) => {
      if (prev.find((s) => s.metric === metric)) return prev;
      const metricDef = availableMetrics.find((m) => m.id === metric);
      return [...prev, { metric, direction: metricDef?.defaultDir || "desc" }];
    });
    setIsDropdownOpen(false);
  };

  const removeSort = (metric: SortMetric) => {
    setSorts((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((s) => s.metric !== metric);
    });
  };

  const moveSortToFirst = (metric: SortMetric) => {
    setSorts((prev) => {
      const target = prev.find((s) => s.metric === metric);
      if (!target) return prev;
      return [target, ...prev.filter((s) => s.metric !== metric)];
    });
  };

  const moveSortUp = (metric: SortMetric) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.metric === metric);
      if (idx <= 0) return prev;
      return arrayMove(prev, idx, idx - 1);
    });
  };

  const moveSortDown = (metric: SortMetric) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.metric === metric);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      return arrayMove(prev, idx, idx + 1);
    });
  };

  const toggleSortDir = (metric: SortMetric) => {
    setSorts((prev) =>
      prev.map((s) => (s.metric === metric ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" } : s)),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSorts((items) => {
        const oldIndex = items.findIndex((i) => i.metric === active.id);
        const newIndex = items.findIndex((i) => i.metric === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="sticky top-16 z-20 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sort Priority:</span>
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20"
            >
              <span>+ Add Tiebreaker</span>
              <span className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 min-w-[180px] rounded-md border border-slate-700 bg-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                {availableMetrics
                  .filter((m) => !sorts.find((s) => s.metric === m.id))
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addSort(m.id)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      {m.label}
                    </button>
                  ))}
                {availableMetrics.filter((m) => !sorts.find((s) => s.metric === m.id)).length === 0 && (
                  <div className="px-3 py-2 text-[10px] text-slate-500 italic">All metrics added</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorts.map((s) => s.metric)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-2">
              {sorts.map((sort, idx) => (
                <SortableSortPill
                  key={sort.metric}
                  sort={sort}
                  idx={idx}
                  isFirst={idx === 0}
                  isLast={idx === sorts.length - 1}
                  isOnly={sorts.length === 1}
                  onToggleDir={toggleSortDir}
                  onMoveToFirst={moveSortToFirst}
                  onRemove={removeSort}
                  onMoveUp={moveSortUp}
                  onMoveDown={moveSortDown}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 min-w-max">
          {sortedRows.map(({ portfolio, score, cards }) => (
            <div
              key={portfolio.id}
              className="w-80 shrink-0 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col"
            >
              <div className="bg-slate-800/50 p-4 border-b border-slate-800">
                <h4 className="text-lg font-bold text-white truncate" title={portfolio.name}>
                  {portfolio.name}
                </h4>
                <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">
                  {portfolio.source} Portfolio
                </div>
              </div>

              {/* Metrics Section */}
              <div className="p-4 space-y-3 bg-slate-900/50">
                <MetricDisplay
                  label="Cards"
                  value={`${portfolio.cardIds.length}`}
                  isBest={portfolio.cardIds.length === bestPerMetric.cardsCount}
                />
                <MetricDisplay
                  label="Monthly Cashback"
                  value={`$${score.monthlyCashback.toFixed(2)}`}
                  isBest={score.monthlyCashback === bestPerMetric.monthlyCashback}
                />
                <MetricDisplay
                  label="Annual Fees"
                  value={`$${score.annualFees.toFixed(2)}`}
                  isBest={score.annualFees === bestPerMetric.annualFees}
                  inverse
                />
                <MetricDisplay
                  label="Perk Value"
                  value={`$${score.annualPerks.toFixed(2)}`}
                  isBest={score.annualPerks === bestPerMetric.annualPerks}
                />
                <MetricDisplay
                  label="Net Annual Value"
                  value={`$${score.netAnnualValue.toFixed(2)}`}
                  isBest={score.netAnnualValue === bestPerMetric.netAnnualValue}
                />
                <MetricDisplay
                  label="Year 1 w/ SUB"
                  value={`$${score.firstYearValue.toFixed(2)}`}
                  isBest={score.firstYearValue === bestPerMetric.firstYearValue}
                />
              </div>

              <div className="border-t border-slate-800 p-3 bg-slate-800/20">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Cards in Portfolio
                </h5>
                <div className="space-y-3">
                  {cards.map((card) => (
                    <div key={card.id} className="scale-90 origin-top -mb-4 last:mb-0">
                      <CardTile card={card} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricDisplay({ label, value, isBest, inverse }: { label: string; value: string; isBest: boolean; inverse?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${isBest ? (inverse ? "text-emerald-400" : "text-emerald-400") : "text-slate-200"}`}>
        {value} {isBest && <span className="text-[10px] ml-1">★</span>}
      </span>
    </div>
  );
}
