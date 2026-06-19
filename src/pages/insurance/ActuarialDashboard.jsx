import { useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, ShieldAlert, TrendingUp, DollarSign } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';

export default function ActuarialDashboard() {
  const { t } = useTranslation();
  const { data: claimsDb = [] } = useIndustryRecords('claim');
  const { data: policiesDb = [] } = useIndustryRecords('policy');

  const claims = claimsDb.map(r => r.data);
  const policies = policiesDb.map(r => r.data);

  // Calculate metrics
  const totalPremiums = policies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
  const totalClaimsPaid = claims.filter(c => c.status === 'Approved').reduce((sum, c) => sum + (Number(c.claimAmount) || 0), 0);
  const lossRatio = totalPremiums > 0 ? ((totalClaimsPaid / totalPremiums) * 100).toFixed(1) : 0;

  // Mock historical data for charts since we don't have enough DB data yet
  const trendData = [
    { month: 'Jan', lossRatio: 65, premiums: 120000, claims: 78000 },
    { month: 'Feb', lossRatio: 68, premiums: 125000, claims: 85000 },
    { month: 'Mar', lossRatio: 62, premiums: 140000, claims: 86800 },
    { month: 'Apr', lossRatio: 75, premiums: 138000, claims: 103500 },
    { month: 'May', lossRatio: 71, premiums: 150000, claims: 106500 },
    { month: 'Jun', lossRatio: lossRatio > 0 ? Number(lossRatio) : 69, premiums: totalPremiums || 160000, claims: totalClaimsPaid || 110400 },
  ];

  const productRiskData = [
    { name: 'Auto', frequency: 14, severity: 8500 },
    { name: 'Home', frequency: 5, severity: 25000 },
    { name: 'Life', frequency: 1, severity: 250000 },
    { name: 'Health', frequency: 45, severity: 1200 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("actuarial_dashboard", "Actuarial Dashboard")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("loss_ratio_and_predictive_mode", "Loss ratio and predictive modeling insights")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("current_loss_ratio", "Current Loss Ratio")}</h3>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-semibold mt-2">{lossRatio}%</p>
          <p className="text-xs text-[#71717a] mt-1">{t("target", "Target: < 70%")}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("earned_premiums", "Earned Premiums")}</h3>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-semibold mt-2">${totalPremiums.toLocaleString()}</p>
          <p className="text-xs text-[#71717a] mt-1">{t("mtd", "Month to Date")}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-red-500">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("incurred_claims", "Incurred Claims")}</h3>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-semibold mt-2">${totalClaimsPaid.toLocaleString()}</p>
          <p className="text-xs text-[#71717a] mt-1">{t("paid_reserved", "Paid + Reserved")}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-green-500">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("combined_ratio", "Combined Ratio")}</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-semibold mt-2">{(Number(lossRatio) + 25).toFixed(1)}%</p>
          <p className="text-xs text-[#71717a] mt-1">{t("includes_25_expense", "Includes 25% Expense Ratio")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-6">
          <h3 className="text-lg font-semibold mb-6">{t("loss_ratio_trend", "Loss Ratio Trend (YTD)")}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="lossRatio" name="Loss Ratio %" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-6">
          <h3 className="text-lg font-semibold mb-6">{t("claims_frequency_vs_severity", "Claims Frequency vs Severity by Product")}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productRiskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="frequency" name="Frequency (Count)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="severity" name="Avg Severity ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
