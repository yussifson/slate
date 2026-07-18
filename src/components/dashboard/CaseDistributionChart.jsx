import { useTranslation } from "react-i18next";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#8b5cf6", "#06b6d4", "#f43f5e"];

const CASE_TYPE_LABELS = {
  civil: "Civil", criminal: "Criminal", corporate: "Corporate",
  family: "Family", property: "Property", labor: "Labor", tax: "Tax", other: "Other"
};

export default function CaseDistributionChart({ cases }) {
  const { t } = useTranslation();
  const distribution = Object.entries(
    cases.reduce((acc, c) => {
      const type = c.case_type || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({ name: CASE_TYPE_LABELS[type] || type, value: count }))
    .sort((a, b) => b.value - a.value);

  if (distribution.length === 0) {
    return (
      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center justify-center h-[280px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_case_data_yet", "No case data yet")}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <h3 className="text-sm font-semibold mb-4">{t("cases_by_practice_area", "Cases by Practice Area")}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
            {distribution.map((_, i) => {
              return (<Cell key={i} fill={COLORS[i % COLORS.length]} />);
            })}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
            formatter={v => [v, "Cases"]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
