"use client";

import { CATEGORY_META, ExpenseFilter } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface TotalCardProps {
  filter: ExpenseFilter;
  grandTotal: number;
  filteredTotal: number;
  totalRowCount: number;
  pageLimit: number;
}

export default function TotalCard({
  filter,
  grandTotal,
  filteredTotal,
  totalRowCount,
  pageLimit,
}: TotalCardProps) {
  const label =
    filter === "all" ? "Total spending" : `Total: ${CATEGORY_META[filter].label}`;
  const displayTotal = filter === "all" ? grandTotal : filteredTotal;
  const showGrandTotalSubtext = filter !== "all";
  const showTruncationHint = totalRowCount > pageLimit && filter === "all";

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-emerald-600 p-6 shadow-lg shadow-emerald-600/10">
      <p className="text-sm font-medium text-emerald-100">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white sm:text-4xl">
        {formatCurrency(displayTotal)}
      </p>
      {showGrandTotalSubtext && (
        <p className="mt-1 text-xs text-emerald-100/80">
          Grand total: {formatCurrency(grandTotal)}
        </p>
      )}
      {showTruncationHint && (
        <p className="mt-2 text-xs text-emerald-100/70">
          Showing the most recent {pageLimit} of {totalRowCount} expenses.
        </p>
      )}
    </div>
  );
}
