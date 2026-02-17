import type { PortfolioScore } from "../../types/portfolio";

interface PortfolioSummaryProps {
  score: PortfolioScore;
}

export function PortfolioSummary({ score }: PortfolioSummaryProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Stat label="Monthly Cashback" value={`$${score.monthlyCashback.toFixed(2)}`} />
      <Stat label="Annual Cashback" value={`$${score.annualCashback.toFixed(2)}`} />
      <Stat label="Annual Fees" value={`$${score.annualFees.toFixed(2)}`} />
      <Stat label="Perk Value" value={`$${score.annualPerks.toFixed(2)}`} />
      <Stat label="Net Annual Value" value={`$${score.netAnnualValue.toFixed(2)}`} />
      <Stat label="First Year (w/ SUB)" value={`$${score.firstYearValue.toFixed(2)}`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
