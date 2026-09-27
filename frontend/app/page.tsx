import { DEFAULT_PAGE_LIMIT, getExpenses } from "@/lib/api";
import Dashboard from "@/components/Dashboard";
import { Expense } from "@/types";

// Force dynamic rendering so the server always fetches fresh data on each request.
export const dynamic = "force-dynamic";

async function getInitialData(): Promise<{
  expenses: Expense[];
  total: number;
  error: string | null;
}> {
  try {
    const result = await getExpenses({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
    return { expenses: result.expenses, total: result.total, error: null };
  } catch (e) {
    return { expenses: [], total: 0, error: e instanceof Error ? e.message : "Couldn't load expenses." };
  }
}

export default async function DashboardPage() {
  const { expenses, total, error } = await getInitialData();
  return (
    <Dashboard
      initialExpenses={expenses}
      initialTotal={total}
      initialError={error}
      pageLimit={DEFAULT_PAGE_LIMIT}
    />
  );
}
