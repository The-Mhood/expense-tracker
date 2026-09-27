"use client";

import { CATEGORIES, CATEGORY_META, ExpenseFilter } from "@/types";

interface FilterBarProps {
  filter: ExpenseFilter;
  showAddButton: boolean;
  onFilterChange: (filter: ExpenseFilter) => void;
  onAddClick: () => void;
}

export default function FilterBar({
  filter,
  showAddButton,
  onFilterChange,
  onAddClick,
}: FilterBarProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:w-56">
        <label htmlFor="filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as ExpenseFilter)}
          className="block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </div>

      {showAddButton && (
        <button
          onClick={onAddClick}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <span className="text-lg leading-none">+</span> Add expense
        </button>
      )}
    </div>
  );
}
