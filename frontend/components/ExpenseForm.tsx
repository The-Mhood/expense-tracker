"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_META, Category } from "@/types";
import { todayIso } from "@/lib/formatters";
import { ExpenseInput } from "@/lib/api";

interface ExpenseFormProps {
  initialValues?: {
    amount: string;
    category: Category;
    incurred_date: string;
    description: string | null;
  };
  formTitle?: string;
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit: (data: ExpenseInput) => Promise<void>;
  onCancel: () => void;
}

export default function ExpenseForm({
  initialValues,
  formTitle = "Add a new expense",
  submitLabel = "Add expense",
  submittingLabel = "Saving…",
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [category, setCategory] = useState<string>(initialValues?.category ?? "food");
  const [date, setDate] = useState(initialValues?.incurred_date ?? todayIso());
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        amount: parsed.toFixed(2),
        category,
        incurred_date: date,
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-slate-900">{formTitle}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
            Amount
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              $
            </span>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <input
            id="description"
            type="text"
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
