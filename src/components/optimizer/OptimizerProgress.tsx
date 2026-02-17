import type { OptimizerProgress as OptimizerProgressType } from "../../lib/optimizer/types";

interface OptimizerProgressProps {
  progress: OptimizerProgressType | null;
}

export function OptimizerProgress({ progress }: OptimizerProgressProps) {
  if (!progress) return null;
  const percent =
    progress.totalEstimate > 0
      ? Math.min(100, (progress.evaluated / progress.totalEstimate) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-2 flex justify-between text-sm text-slate-300">
        <span>Evaluated: {progress.evaluated.toLocaleString()}</span>
        <span>{percent.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
