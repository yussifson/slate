import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function RevenueChart({ invoices, currency }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const revenue = invoices
      .filter(inv => inv.status === "paid" && inv.paid_date)
      .filter(inv => {
        const d = new Date(inv.paid_date);
        return d >= start && d <= end;
      })
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    return { month: format(date, "MMM"), revenue };
  });

  const symbol = currency === "NGN" ? "₦" : currency === "SLL" ? "Le" : currency === "USD" ? "$" : "GH₵";

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold mb-4">Revenue Trend (6 Months)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={months} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${symbol}${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
            formatter={v => [`${symbol}${v.toLocaleString()}`, "Revenue"]}
          />
          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}