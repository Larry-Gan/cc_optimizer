import type { CategoryAllocation } from "../../lib/calculations";

interface PortfolioBreakdownProps {
  rows: CategoryAllocation[];
}

export function PortfolioBreakdown({ rows }: PortfolioBreakdownProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-800 text-left text-slate-200">
          <tr>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Spend</th>
            <th className="px-3 py-2">Card</th>
            <th className="px-3 py-2">Rate</th>
            <th className="px-3 py-2">Cashback</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.categoryId} className="border-t border-slate-800">
              <td className="px-3 py-2 text-slate-200">{row.categoryId}</td>
              <td className="px-3 py-2 text-slate-300">${row.spend.toFixed(0)}</td>
              <td className="px-3 py-2 text-slate-300">{row.cardName}</td>
              <td className="px-3 py-2 text-slate-300">{row.ratePercent.toFixed(2)}%</td>
              <td className="px-3 py-2 font-medium text-emerald-300">${row.cashback.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
