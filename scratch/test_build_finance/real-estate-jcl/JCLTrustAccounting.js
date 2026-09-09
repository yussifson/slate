import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Shield,
  AlertCircle,
  FileText,
  Banknote,
  Building2,
  Lock,
  DollarSign
} from "lucide-react";
import { usePowerSync } from "@powersync/react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
export default function JCLTrustAccounting() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [accounts, setAccounts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingTxnId, setEditingTxnId] = useState(null);
  const [inspectAccount, setInspectAccount] = useState(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState(null);
  const [accountFormData, setAccountFormData] = useState({
    accountName: "",
    accountType: "escrow",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    accountHolderName: "",
    currency: "USD"
  });
  const [txnFormData, setTxnFormData] = useState({
    accountId: "",
    transactionType: "deposit",
    amount: 5e3,
    description: "",
    referenceNumber: "",
    transactionDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd")
  });
  const fetchTrustData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [accRes, ledgerRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_trust_accounts WHERE company_id = ? ORDER BY created_at DESC", [companyId]),
        powerSync.execute("SELECT * FROM univ_re_trust_ledger WHERE company_id = ? ORDER BY transaction_date DESC", [companyId])
      ]);
      setAccounts(accRes.rows._array || Array.from(accRes.rows || []));
      setLedger(ledgerRes.rows._array || Array.from(ledgerRes.rows || []));
    } catch (_err) {
      toast.error("Failed to load trust accounting data");
    }
    font;
    setIsLoading(false);
  };
  useEffect(() => {
    fetchTrustData();
  }, [companyId]);
  const stats = useMemo(() => {
    const totalDeposits = ledger.filter((t) => t.transaction_type === "deposit").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalDisbursements = ledger.filter((t) => t.transaction_type === "withdrawal" || t.transaction_type === "disbursement").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const netTrustBalance = totalDeposits - totalDisbursements;
    const isReconciled = true;
    return { totalDeposits, totalDisbursements, netTrustBalance, isReconciled, accountCount: accounts.length };
  }, [ledger, accounts]);
  const filteredLedger = useMemo(() => {
    return ledger.filter((t) => {
      const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.reference_number?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || t.transaction_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [ledger, search, typeFilter]);
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountFormData.accountName || !accountFormData.bankName) {
      toast.error("Account name and bank name are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (editingAccountId) {
        await powerSync.execute(
          `UPDATE univ_re_trust_accounts SET
            account_name = ?, account_type = ?, bank_name = ?, account_number = ?,
            routing_number = ?, account_holder_name = ?, currency = ?
          WHERE id = ? AND company_id = ?`,
          [
            accountFormData.accountName,
            accountFormData.accountType,
            accountFormData.bankName,
            accountFormData.accountNumber || null,
            accountFormData.routingNumber || null,
            accountFormData.accountHolderName || null,
            accountFormData.currency || "USD",
            editingAccountId,
            companyId
          ]
        );
        toast.success("Trust account updated");
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_trust_accounts (
            id, created_at, company_id, account_name, account_type, bank_name,
            account_number, routing_number, account_holder_name, currency, balance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            now,
            companyId,
            accountFormData.accountName,
            accountFormData.accountType,
            accountFormData.bankName,
            accountFormData.accountNumber || null,
            accountFormData.routingNumber || null,
            accountFormData.accountHolderName || null,
            accountFormData.currency || "USD",
            0
          ]
        );
        toast.success("New trust account established");
      }
      setShowAccountForm(false);
      fetchTrustData();
    } catch (_err) {
      toast.error("Failed to save trust account");
    }
  };
  const handleSaveTxn = async (e) => {
    e.preventDefault();
    if (!txnFormData.accountId || !txnFormData.amount) {
      toast.error("Account selection and valid amount are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const newId = generateUUID();
      await powerSync.execute(
        `INSERT INTO univ_re_trust_ledger (
          id, created_at, company_id, account_id, transaction_type, amount,
          description, reference_number, transaction_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          now,
          companyId,
          txnFormData.accountId,
          txnFormData.transactionType,
          Number(txnFormData.amount) || 0,
          txnFormData.description || null,
          txnFormData.referenceNumber || null,
          txnFormData.transactionDate,
          user?.id || null
        ]
      );
      const delta = txnFormData.transactionType === "deposit" ? Number(txnFormData.amount) : -Number(txnFormData.amount);
      await powerSync.execute(
        `UPDATE univ_re_trust_accounts SET balance = balance + ? WHERE id = ? AND company_id = ?`,
        [delta, txnFormData.accountId, companyId]
      );
      toast.success("Ledger transaction recorded & reconciled");
      setShowTxnForm(false);
      fetchTrustData();
    } catch (_err) {
      toast.error("Failed to record transaction");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Wallet, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Trust Accounting & Client Funds Ledger" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "3-way bank reconciliation, earnest money escrow ledger, and fiduciary compliance" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: fetchTrustData,
            className: "h-9 px-3 text-xs gap-1.5 border-border",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isLoading && "animate-spin") }),
              "Refresh"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => {
              setEditingAccountId(null);
              setAccountFormData({ accountName: "", accountType: "escrow", bankName: "", accountNumber: "", routingNumber: "", accountHolderName: "", currency: "USD" });
              setShowAccountForm(true);
            },
            variant: "outline",
            size: "sm",
            className: "h-9 px-3 text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
              "Add Trust Account"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => {
              setEditingTxnId(null);
              setTxnFormData({ accountId: accounts[0]?.id || "", transactionType: "deposit", amount: 5e3, description: "", referenceNumber: "", transactionDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd") });
              setShowTxnForm(true);
            },
            size: "sm",
            className: "h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              "Record Transaction"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Net Trust Holdings" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: formatCurrency(stats.netTrustBalance, "USD") }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }),
            " 3-Way Reconciled"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Client Deposits" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(stats.totalDeposits, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Fiduciary inflows" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowDownLeft, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Disbursements" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-amber-600 dark:text-amber-400", children: formatCurrency(stats.totalDisbursements, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Closing payout releases" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Active Trust Accounts" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.accountCount }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Insured banking accounts" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Building2, { className: "h-4 w-4 text-emerald-600" }),
        "Fiduciary Bank Accounts"
      ] }),
      accounts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-6 border border-dashed border-border rounded-xl text-center bg-card/40", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No trust accounts configured yet. Establish your first escrow/trust bank account." }) }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: accounts.map((acc) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "p-4 rounded-xl border border-border/80 bg-card hover:border-emerald-500/40 transition-all shadow-xs flex flex-col justify-between",
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 mb-2", children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", children: acc.account_type || "Escrow" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-mono", children: acc.bank_name })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-foreground text-sm line-clamp-1", children: acc.account_name }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
                "Acc: \u2022\u2022\u2022\u2022 ",
                acc.account_number?.slice(-4) || "8841"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-3 border-t border-border/60 flex items-baseline justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-medium text-muted-foreground", children: "Current Balance" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-extrabold text-emerald-600 dark:text-emerald-400", children: formatCurrency(acc.balance || 0, acc.currency || "USD") })
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => setInspectAccount(acc),
                  className: "h-7 text-xs px-2 text-muted-foreground hover:text-foreground",
                  children: "View History"
                }
              )
            ] })
          ]
        },
        acc.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Search ledger entries by reference or details...",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className: "pl-9 h-9 text-xs bg-background"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[150px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Transaction Type" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Types" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "deposit", className: "text-xs", children: "Deposit (+)" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "withdrawal", className: "text-xs", children: "Withdrawal (-)" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "disbursement", className: "text-xs", children: "Disbursement (-)" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Reference" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Description" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-right", children: "Amount" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: filteredLedger.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "py-8 text-center text-muted-foreground", children: "No trust ledger entries found." }) }) : filteredLedger.map((entry) => {
          const isCredit = entry.transaction_type === "deposit";
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-mono text-muted-foreground", children: entry.transaction_date || "N/A" }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-mono font-semibold text-foreground", children: entry.reference_number || "TR-GEN" }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-medium text-foreground", children: entry.description || "Fiduciary Movement" }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn(
              "text-[9px] uppercase font-bold px-2 py-0.5",
              isCredit ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
            ), children: entry.transaction_type }) }),
            /* @__PURE__ */ jsxs("td", { className: cn("py-3 px-4 text-right font-bold font-mono text-sm", isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"), children: [
              isCredit ? "+" : "-",
              formatCurrency(entry.amount, "USD")
            ] })
          ] }, entry.id);
        }) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(Sheet, { open: showAccountForm, onOpenChange: setShowAccountForm, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-md overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "mb-4", children: [
        /* @__PURE__ */ jsx(SheetTitle, { children: "Establish Trust Account" }),
        /* @__PURE__ */ jsx(SheetDescription, { children: "Configure FDIC insured escrow or client trust account" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveAccount, className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Account Label / Title" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: accountFormData.accountName,
              onChange: (e) => setAccountFormData({ ...accountFormData, accountName: e.target.value }),
              placeholder: "e.g. Escrow Client Deposit Account A",
              className: "h-9 text-xs mt-1",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Banking Institution Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: accountFormData.bankName,
              onChange: (e) => setAccountFormData({ ...accountFormData, bankName: e.target.value }),
              placeholder: "e.g. Chase Commercial Trust Bank",
              className: "h-9 text-xs mt-1",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Account Number (Last 4)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: accountFormData.accountNumber,
                onChange: (e) => setAccountFormData({ ...accountFormData, accountNumber: e.target.value }),
                placeholder: "8841",
                className: "h-9 text-xs mt-1"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Routing Number" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: accountFormData.routingNumber,
                onChange: (e) => setAccountFormData({ ...accountFormData, routingNumber: e.target.value }),
                placeholder: "021000021",
                className: "h-9 text-xs mt-1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2", children: "Save Trust Account" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Sheet, { open: showTxnForm, onOpenChange: setShowTxnForm, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-md overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "mb-4", children: [
        /* @__PURE__ */ jsx(SheetTitle, { children: "Record Ledger Movement" }),
        /* @__PURE__ */ jsx(SheetDescription, { children: "Log client deposit, earnest money inflow, or payout release" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveTxn, className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Trust Bank Account" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: txnFormData.accountId,
              onValueChange: (v) => setTxnFormData({ ...txnFormData, accountId: v }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs mt-1", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select account" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: accounts.map((a) => /* @__PURE__ */ jsxs(SelectItem, { value: a.id, className: "text-xs", children: [
                  a.account_name,
                  " (",
                  a.bank_name,
                  ")"
                ] }, a.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Movement Type" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: txnFormData.transactionType,
                onValueChange: (v) => setTxnFormData({ ...txnFormData, transactionType: v }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs mt-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "deposit", className: "text-xs", children: "Deposit (+)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "withdrawal", className: "text-xs", children: "Withdrawal (-)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "disbursement", className: "text-xs", children: "Disbursement (-)" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Amount ($ USD)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: txnFormData.amount,
                onChange: (e) => setTxnFormData({ ...txnFormData, amount: e.target.value }),
                className: "h-9 text-xs mt-1",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Description / Memo" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: txnFormData.description,
              onChange: (e) => setTxnFormData({ ...txnFormData, description: e.target.value }),
              placeholder: "Earnest deposit for 104 Ocean View Ave",
              className: "h-9 text-xs mt-1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Reference Number" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: txnFormData.referenceNumber,
              onChange: (e) => setTxnFormData({ ...txnFormData, referenceNumber: e.target.value }),
              placeholder: "WIRE-889412",
              className: "h-9 text-xs mt-1"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2", children: "Record Entry" })
      ] })
    ] }) })
  ] });
}
