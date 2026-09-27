"use client";

import ExpenseForm from "./ExpenseForm";
import { CATEGORY_META, Expense } from "@/types";
import { ExpenseInput } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface ExpenseItemProps {
  expense: Expense;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onEditSubmit: (data: ExpenseInput) => Promise<void>;
  onEditCancel: () => void;
}

export default function ExpenseItem({
  expense,
  isEditing,
  onEdit,
  onDelete,
  onEditSubmit,
  onEditCancel,
}: ExpenseItemProps) {
  const meta = CATEGORY_META[expense.category];

  if (isEditing) {
    return (
      <li>
        <ExpenseForm
          key={expense.id}
          formTitle="Edit expense"
          submitLabel="Save changes"
          submittingLabel="Saving…"
          initialValues={{
            amount: expense.amount,
            category: expense.category,
            incurred_date: expense.incurred_date,
            description: expense.description,
          }}
          onSubmit={onEditSubmit}
          onCancel={onEditCancel}
        />
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 transition-shadow hover:shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {expense.description || "(no description)"}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.pillBg} ${meta.pillText}`}
            >
              {meta.label}
            </span>
            <span className="text-xs text-slate-500">
              {formatDate(expense.incurred_date)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <span className="mr-1 text-base font-semibold text-slate-900 tabular-nums">
          {formatCurrency(expense.amount)}
        </span>
        <button
          onClick={onEdit}
          aria-label={`Edit expense ${expense.description || expense.id}`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="m2.695 14.763-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          aria-label={`Delete expense ${expense.description || expense.id}`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </li>
  );
}
