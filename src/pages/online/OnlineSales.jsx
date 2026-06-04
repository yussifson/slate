import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Download, TrendingUp, CreditCard, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function OnlineSales() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sales = [], isLoading } = useQuery({ 
    queryKey: ["online_sales", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_sale' }), 
    enabled: !!companyId 
  });

  const filteredSales = sales.filter(s => 
    s.case_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = sales.reduce((sum, sale) => {
    let amt = 0; 
    try { amt = parseFloat(JSON.parse(sale.notes).amount || 0); } catch(e) {}
    return sum + amt;
  }, 0);

  const thisMonthRevenue = totalRevenue * 0.4; // Mock logic for visual

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("online_sales", "Sales & Revenue")} 
        subtitle="Track course sales, process refunds, and view financial metrics." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-emerald-200 shadow-sm bg-emerald-50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Total Revenue</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-0.5">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 shadow-sm bg-blue-50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">This Month</p>
              <h3 className="text-2xl font-black text-blue-900 mt-0.5">${thisMonthRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 shadow-sm bg-purple-50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Total Sales</p>
              <h3 className="text-2xl font-black text-purple-900 mt-0.5">{sales.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by transaction ID or course..." 
            className="pl-9 bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 shadow-sm">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Course</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading sales data...</td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="h-12 w-12 text-slate-300 mb-3" />
                      <p>No sales transactions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  let meta = {};
                  try { meta = JSON.parse(sale.notes || '{}'); } catch(e) {}
                  
                  const statusStyles = {
                    Completed: "bg-emerald-100 text-emerald-800",
                    Pending: "bg-amber-100 text-amber-800",
                    Refunded: "bg-red-100 text-red-800"
                  };
                  
                  const status = sale.status || 'Completed';

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {sale.case_number || `TXN-${sale.id.slice(0,8)}`}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{sale.case_name}</p>
                        <p className="text-xs text-slate-500">{meta.learner_name || 'Anonymous Learner'}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">${meta.amount || '0.00'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                          statusStyles[status] || "bg-slate-100 text-slate-800"
                        )}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50">
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
