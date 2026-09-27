"use client";

import ExpenseItem from "@/components/ExpenseItem";
import { CATEGORY_META, Expense, ExpenseFilter } from "@/types";
import { ExpenseInput } from "@/lib/api";

interface ExpenseListProps {
  loading: boolean;
  error: string | null;
  expenses: Expense[];
  filter: ExpenseFilter;
  editingId: number | null;
  showAddButton: boolean;
  onRetry: () => void;
  onAddClick: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onEditSubmit: (id: number, data: ExpenseInput) => Promise<void>;
  onEditCancel: () => void;
}

function SkeletonRow() {
  return (
    <li className="h-16 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
  );
}

export default function ExpenseList({
  loading,
  error,
  expenses,
  filter,
  editingId,
  showAddButton,
  onRetry,
  onAddClick,
  onEdit,
  onDelete,
  onEditSubmit,
  onEditCancel,
}: ExpenseListProps) {
  if (error && !loading) {
    return (
      <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-red-800">Couldn't load expenses</p>
          <p className="mt-0.5 text-sm text-red-700">{error}</p>
          <p className="mt-1 text-xs text-red-600">
            Is the backend running at http://localhost:8000?
          </p>
        </div>
        <button
          onClick={onRetry}
          className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <ul className="mt-6 space-y-2">
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </ul>
    );
  }

  if (expenses.length === 0) {
    const emptyMessage =
      filter === "all"
        ? "No expenses yet"
        : `No ${CATEGORY_META[filter].label.toLowerCase()} expenses`;
    const emptyHint =
      filter === "all"
        ? "Add your first expense to get started."
        : "Try a different category or add one.";
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
        <p className="mt-1 text-sm text-slate-500">{emptyHint}</p>
        {showAddButton && filter === "all" && editingId === null && (
          <button
            onClick={onAddClick}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Add expense
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-2">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          isEditing={editingId === expense.id}
          onEdit={() => onEdit(expense)}
          onDelete={() => onDelete(expense)}
          onEditSubmit={(data) => onEditSubmit(expense.id, data)}
          onEditCancel={onEditCancel}
        />
      ))}
    </ul>
  );
}
