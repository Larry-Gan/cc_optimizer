import { useState } from "react";
import { categoryTree } from "../../lib/categories";
import type { CategoryNode } from "../../types/category";
import { useActiveSpendProfile, useSpendStore } from "../../stores/useSpendStore";

interface VisibleRow {
  id: string;
  label: string;
  depth: number;
  hasChildren: boolean;
  parentLabel: string | null;
  pathLabels: string[];
}

function getVisibleRows(
  nodes: CategoryNode[],
  depth: number,
  expandedIds: Set<string>,
  parentLabel: string | null = null,
  pathLabels: string[] = [],
): VisibleRow[] {
  return nodes.flatMap((node) => {
    const row: VisibleRow = {
      id: node.id,
      label: node.label,
      depth,
      hasChildren: node.children.length > 0,
      parentLabel,
      pathLabels,
    };
    const children =
      expandedIds.has(node.id) && node.children.length > 0
        ? getVisibleRows(node.children, depth + 1, expandedIds, node.label, [...pathLabels, node.label])
        : [];
    return [row, ...children];
  });
}

export function SpendProfileEditor() {
  const profile = useActiveSpendProfile();
  const update = useSpendStore((s) => s.updateCategorySpend);
  const reset = useSpendStore((s) => s.resetToDefault);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const total = Object.values(profile.monthlySpend).reduce((sum, value) => sum + value, 0);
  const unusuallyHigh = total > 15000;
  const unusuallyLow = total < 500;

  const rows = getVisibleRows(categoryTree, 0, expandedIds);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Top-level (L1) categories shown. Expand any row to edit subcategories.
        </p>
        <button
          onClick={reset}
          className="shrink-0 rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
        >
          Reset to Defaults
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 ${
              row.depth > 0 ? "bg-slate-800/40" : "bg-slate-800/70"
            }`}
          >
            <div
              className={`flex min-w-0 flex-1 items-center gap-1 ${
                row.hasChildren ? "cursor-pointer select-none" : ""
              }`}
              style={{ marginLeft: row.depth * 14 }}
              onClick={() => row.hasChildren && toggleExpanded(row.id)}
            >
              {row.hasChildren ? (
                <span
                  className="shrink-0 text-slate-400"
                  aria-label={expandedIds.has(row.id) ? "Collapse" : "Expand"}
                >
                  {expandedIds.has(row.id) ? "▼" : "▶"}
                </span>
              ) : (
                <span className="w-4 shrink-0" aria-hidden />
              )}
              <div className="flex min-w-0 flex-col">
                {row.depth > 0 && row.parentLabel && (
                  <span className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {row.pathLabels.join(" › ")}
                  </span>
                )}
                <span
                  className={`truncate text-sm ${
                    row.depth > 0 ? "text-slate-300" : "text-slate-100 font-medium"
                  }`}
                >
                  {row.label}
                </span>
              </div>
            </div>
            <input
              type="number"
              min={0}
              step={10}
              value={profile.monthlySpend[row.id] ?? 0}
              onChange={(event) => update(row.id, Number(event.target.value))}
              className="w-28 shrink-0 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-right text-sm text-slate-100"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-slate-300">
        Monthly total: <span className="font-semibold text-white">${total.toLocaleString()}</span>
      </div>
      {(unusuallyHigh || unusuallyLow) && (
        <p className="mt-2 text-sm text-amber-300">
          {unusuallyHigh
            ? "This total is unusually high. Double-check values to avoid overestimating rewards."
            : "This total is unusually low. Ensure categories with regular spending are filled in."}
        </p>
      )}
    </div>
  );
}
