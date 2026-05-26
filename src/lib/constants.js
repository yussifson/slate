export const SUBSCRIPTION_PLANS = {
  free: { name: "Free", price: 0, maxUsers: 2, maxCases: 10, maxStorageGB: 1, maxClients: 20 },
  starter: { name: "Starter", price: 49, maxUsers: 3, maxCases: 50, maxStorageGB: 5, maxClients: 50 },
  professional: { name: "Professional", price: 149, maxUsers: 10, maxCases: 200, maxStorageGB: 20, maxClients: 200 },
  firm_plus: { name: "Firm Plus", price: 349, maxUsers: 30, maxCases: 500, maxStorageGB: 50, maxClients: 500 },
  enterprise: { name: "Enterprise", price: 799, maxUsers: 999, maxCases: 9999, maxStorageGB: 200, maxClients: 9999 }
};

export const CURRENCIES = {
  GHS: { symbol: "GH₵", name: "Ghanaian Cedi" },
  NGN: { symbol: "₦", name: "Nigerian Naira" },
  SLL: { symbol: "Le", name: "Sierra Leonean Leone" },
  USD: { symbol: "$", name: "US Dollar" }
};

export const CASE_STATUS_COLORS = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  pending_hearing: "bg-purple-100 text-purple-700",
  closed: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-500"
};

export const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600"
};

export const INVOICE_STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-600",
  paid: "bg-green-100 text-green-600",
  overdue: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-500"
};

export const TASK_STATUS_COLORS = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-600",
  completed: "bg-green-100 text-green-600",
  cancelled: "bg-gray-100 text-gray-500"
};

export const isSuperAdmin = (user) => user?.role === "super_admin";
export const isCompanyAdmin = (user) => user?.role === "company_admin";
export const isAdmin = (user) => ["super_admin", "company_admin"].includes(user?.role);
export const isLawyer = (user) => ["lawyer", "paralegal"].includes(user?.role);

export const formatCurrency = (amount, currency = "GHS") => {
  const curr = CURRENCIES[currency] || CURRENCIES.GHS;
  return `${curr.symbol}${(amount || 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};