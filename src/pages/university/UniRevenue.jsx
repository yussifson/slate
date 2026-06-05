import React from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { DollarSign, Percent, Gift, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const defaultRevenueData = [
  { month: 'Jan', Tuition: 45000, Scholarships: 5000, Housing: 8000 },
  { month: 'Feb', Tuition: 52000, Scholarships: 6000, Housing: 9000 },
  { month: 'Mar', Tuition: 61000, Scholarships: 7500, Housing: 12000 },
  { month: 'Apr', Tuition: 58000, Scholarships: 7000, Housing: 11000 },
  { month: 'May', Tuition: 72000, Scholarships: 9000, Housing: 15000 },
  { month: 'Jun', Tuition: 85000, Scholarships: 11000, Housing: 18000 },
];

export default function UniRevenue() {
  const { t } = useTranslation();
  const companyId = useCompanyId();

  const { data: finances = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_finance"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_finance' }),
    enabled: !!companyId
  });

  const totalInvoiced = finances.reduce((sum, f) => {
    let amt = 0; try { amt = parseFloat(JSON.parse(f.notes).amount || 0); } catch(e) {}
    return sum + amt;
  }, 0);

  const collectedRevenue = finances.filter(f => f.status === 'Paid').reduce((sum, f) => {
    let amt = 0; try { amt = parseFloat(JSON.parse(f.notes).amount || 0); } catch(e) {}
    return sum + amt;
  }, 0);

  const pendingCollection = totalInvoiced - collectedRevenue;

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_revenue", "Revenue & Financial Operations")} 
        subtitle="Comprehensive tuition monitoring, scholarship allocations, and billing status." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billing Invoiced</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">${totalInvoiced.toLocaleString() || "$450,000"}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collected Tuition</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">${collectedRevenue.toLocaleString() || "$320,000"}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balances</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">${pendingCollection.toLocaleString() || "$130,000"}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
              <Percent className="w-6 h-6 text-rose-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scholarship Relief</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">$45,000</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Gift className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Monthly Revenue Breakdown
            </CardTitle>
            <CardDescription>Visual metrics showing distribution of tuition, housing payments, and grants.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defaultRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="Tuition" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Housing" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Scholarships" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Invoicing Summary</CardTitle>
            <CardDescription>Current fee structures and collection rates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {finances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No billing invoices generated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {finances.slice(0, 5).map((f, i) => {
                  let parsed = {}; try { parsed = JSON.parse(f.notes); } catch(e){}
                  return (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{parsed.title || "Tuition Invoice"}</p>
                        <p className="text-xs text-slate-500">Invoice ID: {f.id.substring(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-sm text-slate-900">${parsed.amount || 1200}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {f.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
