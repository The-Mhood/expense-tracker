export type Category = "food" | "transport" | "bills" | "entertainment" | "other";

export interface Expense {
  id: number;
  amount: string;
  category: Category;
  incurred_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES: Category[] = ["food", "transport", "bills", "entertainment", "other"];

export interface CategoryMeta {
  label: string;
  dot: string;
  pillBg: string;
  pillText: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  food:          { label: "Food",          dot: "bg-orange-500",  pillBg: "bg-orange-50",  pillText: "text-orange-700"  },
  transport:     { label: "Transport",     dot: "bg-blue-500",    pillBg: "bg-blue-50",    pillText: "text-blue-700"    },
  bills:         { label: "Bills",         dot: "bg-red-500",     pillBg: "bg-red-50",     pillText: "text-red-700"     },
  entertainment: { label: "Entertainment", dot: "bg-purple-500",  pillBg: "bg-purple-50",  pillText: "text-purple-700"  },
  other:         { label: "Other",         dot: "bg-slate-400",   pillBg: "bg-slate-100",  pillText: "text-slate-700"   },
};

export type ExpenseFilter = "all" | Category;
