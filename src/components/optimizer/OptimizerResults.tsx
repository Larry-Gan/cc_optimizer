import { useState } from "react";
import type { OptimizerResult } from "../../lib/optimizer/types";

interface OptimizerResultsProps {
  results: OptimizerResult[];
  onSave?: (result: OptimizerResult, name: string) => void;
}

export function OptimizerResults({ results, onSave }: OptimizerResultsProps) {
  return (
    <div className="space-y-3">
      {results.map((result, idx) => (
        <OptimizerResultItem
          key={result.cardIds.join("-")}
          result={result}
          rank={idx + 1}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

function OptimizerResultItem({
  result,
  rank,
  onSave,
}: {
  result: OptimizerResult;
  rank: number;
  onSave?: (result: OptimizerResult, name: string) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(`Optimizer Result #${rank}`);

  const handleSave = () => {
    if (result.cardIds.length === 0) return;
    if (isEditingName) {
      onSave?.(result, name);
      setIsEditingName(false);
    } else {
      setIsEditingName(true);
    }
  };

  const saveDisabled = result.cardIds.length === 0;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-4">
          {isEditingName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
            />
          ) : (
            <>
              <h4 className="text-base font-semibold text-white">#{rank} Portfolio</h4>
              <p className="mt-1 text-sm text-slate-300">
                {result.cardIds.length > 0 
                  ? result.cards.map((card) => card.name).join(" · ")
                  : "No cards found"}
              </p>
            </>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saveDisabled}
          className="rounded-md bg-indigo-500 px-3 py-1 text-sm text-white hover:bg-indigo-400 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditingName ? "Confirm Save" : "Save"}
        </button>
      </div>
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
        <Metric label="Monthly Cashback" value={`$${result.score.monthlyCashback.toFixed(2)}`} />
        <Metric label="Net Annual Value" value={`$${result.score.netAnnualValue.toFixed(2)}`} />
        <Metric label="First Year Value" value={`$${result.score.firstYearValue.toFixed(2)}`} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-800/80 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}
