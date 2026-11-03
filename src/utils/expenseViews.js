import { RiPieChartLine, RiFileListLine, RiWalletLine } from "react-icons/ri";

export const EXPENSE_VIEWS = [
  {
    key: "summary",
    label: "Summary",
    description:
      "See income, expenses, and balance for the selected period — with category breakdowns at a glance.",
    icon: RiPieChartLine,
  },
  {
    key: "transactions",
    label: "Transactions",
    description:
      "Review, search, and manage every income and expense entry in your ledger.",
    icon: RiFileListLine,
  },
  {
    key: "cash",
    label: "Cash in hand",
    description:
      "Track cash movements, running balance, and what’s available right now.",
    icon: RiWalletLine,
  },
];

export const DEFAULT_EXPENSE_VIEW = "summary";

export function normalizeExpenseView(value) {
  const key = String(value || "").toLowerCase();
  return EXPENSE_VIEWS.some((view) => view.key === key) ? key : DEFAULT_EXPENSE_VIEW;
}

export function expenseViewPath(viewKey) {
  const view = normalizeExpenseView(viewKey);
  if (view === "transactions") return "/transactions";
  if (view === "cash") return "/cash";
  return "/";
}

export function expenseViewFromPath(pathname) {
  const path = String(pathname || "/").replace(/\/$/, "") || "/";
  if (path === "/transactions") return "transactions";
  if (path === "/cash") return "cash";
  return DEFAULT_EXPENSE_VIEW;
}
