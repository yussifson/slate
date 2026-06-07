import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, TrendingUp, DollarSign, Activity, PieChart as PieChartIcon } from 'lucide-react';

export default function SHSFinancialAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchFinancials = async () => {
      setLoading(true);
      try {
        const [paymentRecords, invoiceRecords] = await Promise.all([
          base44.getEntities('shs_payment', user?.company_id),
          base44.getEntities('shs_invoice', user?.company_id)
        ]);
        setPayments(paymentRecords);
        setInvoices(invoiceRecords);
      } catch (error) {
        console.error('Failed to fetch financial analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id) {
      fetchFinancials();
    }
  }, [user]);

  // Aggregate Metrics
  const totalBilled = invoices.reduce((sum, i) => sum + (parseFloat(i.data?.amount) || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (parseFloat(p.data?.amountPaid) || 0), 0);
  const totalArrears = Math.max(0, totalBilled - totalCollected);
  
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
            Financial Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            High-level dashboard measuring revenue health and collection rates.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
          <CardContent className="p-20 text-center text-slate-400 dark:text-slate-500">Loading analytics dashboard...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Collection Rate</p>
                  </div>
                </div>
                <h3 className={`text-4xl font-black ${collectionRate >= 80 ? 'text-emerald-500' : collectionRate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {collectionRate}%
                </h3>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className={`h-full ${collectionRate >= 80 ? 'bg-emerald-500' : collectionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                    style={{ width: `${collectionRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900/20 flex items-center justify-center text-white">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-200 dark:text-emerald-800 uppercase tracking-wider">Collected YTD</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-white">${totalCollected.toFixed(2)}</h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Billed</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100">${totalBilled.toFixed(2)}</h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-rose-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                    <PieChartIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-600/70 uppercase tracking-wider">Arrears</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-rose-700">${totalArrears.toFixed(2)}</h3>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 p-6">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Cash Flow Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-16 flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center border border-slate-100 dark:border-slate-800">
                  <BarChart className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Interactive charts are enabled when connecting to a Charting provider.</p>
                <div className="flex gap-4 justify-center items-end h-32 mt-8 opacity-40">
                  <div className="w-12 bg-emerald-200 dark:bg-slate-700 rounded-t-lg h-1/4"></div>
                  <div className="w-12 bg-emerald-600 dark:bg-emerald-500 rounded-t-lg h-3/4 shadow-lg shadow-emerald-500/50"></div>
                  <div className="w-12 bg-emerald-200 dark:bg-slate-700 rounded-t-lg h-2/4"></div>
                  <div className="w-12 bg-emerald-600 dark:bg-emerald-500 rounded-t-lg h-full shadow-lg shadow-emerald-500/50"></div>
                  <div className="w-12 bg-emerald-200 dark:bg-slate-700 rounded-t-lg h-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
