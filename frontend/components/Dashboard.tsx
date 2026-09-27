"use client";

import { useCallback, useMemo, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import FilterBar from "@/components/FilterBar";
import TotalCard from "@/components/TotalCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Expense, ExpenseFilter } from "@/types";
import {
  ExpenseInput,
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";

interface DashboardProps {
  initialExpenses: Expense[];
  initialTotal: number;
  initialError: string | null;
  pageLimit: number;
}

export default function Dashboard({
  initialExpenses,
  initialTotal,
  initialError,
  pageLimit,
}: DashboardProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<ExpenseFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const canAdd = !showForm;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExpenses({ limit: pageLimit, offset: 0 });
      setExpenses(result.expenses);
      setTotal(result.total);
    } catch (e) {
      setExpenses([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : "Couldn't load expenses.");
    } finally {
      setLoading(false);
    }
  }, [pageLimit]);

  async function handleCreate(input: ExpenseInput) {
    setSubmitting(true);
    try {
      await createExpense(input);
      setShowForm(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  function handleAddClick() {
    setEditingId(null);
    setShowForm(true);
  }

  function handleEditClick(expense: Expense) {
    setShowForm(false);
    setEditingId(expense.id);
  }

  function handleEditCancel() {
    setEditingId(null);
  }

  async function handleEditSubmit(id: number, input: ExpenseInput) {
    setSubmitting(true);
    try {
      await updateExpense(id, input);
      setEditingId(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteClick(expense: Expense) {
    setPendingDelete(expense);
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteExpense(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete expense.");
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleFilterChange(next: ExpenseFilter) {
    setFilter(next);
  }

  const filtered = useMemo(
    () => (filter === "all" ? expenses : expenses.filter((e) => e.category === filter)),
    [expenses, filter]
  );

  // Sum of amounts of expenses visible with the current filter applied.
  const visibleTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [filtered]
  );

  // Sum of amounts of all expenses currently loaded on the first page.
  // This is the authoritative grand total for MVP (< pageLimit rows); once
  // proper page-by-page loading is added we'll ask the API for a SUM().
  const pageGrandTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [expenses]
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Expenses
          </h1>
        </div>

        <TotalCard
          filter={filter}
          grandTotal={pageGrandTotal}
          filteredTotal={visibleTotal}
          totalRowCount={total}
          pageLimit={pageLimit}
        />

        <FilterBar
          filter={filter}
          showAddButton={canAdd}
          onFilterChange={handleFilterChange}
          onAddClick={handleAddClick}
        />

        {showForm && (
          <div className="mt-4">
            <ExpenseForm
              onSubmit={handleCreate}
              onCancel={() => !submitting && setShowForm(false)}
            />
          </div>
        )}

        <ExpenseList
          loading={loading}
          error={error}
          expenses={filtered}
          filter={filter}
          editingId={editingId}
          showAddButton={canAdd}
          onRetry={load}
          onAddClick={handleAddClick}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onEditSubmit={handleEditSubmit}
          onEditCancel={handleEditCancel}
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete expense?"
        message={
          pendingDelete
            ? `This will permanently delete "${pendingDelete.description || "this expense"}" (${formatCurrency(pendingDelete.amount)}).`
            : ""
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        cancelLabel="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </main>
  );
}
