import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Calendar as CalendarIcon, FileSpreadsheet, Download, TrendingUp, DollarSign, Filter} from 'lucide-react';
import { Badge} from '@/components/ui/badge';

export default function SHSFinancialReports() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [loading, setLoading] = useState(true);
 const [payments, setPayments] = useState([]);
 const [invoices, setInvoices] = useState([]);
 
 const [startDate, setStartDate] = useState(() => {
 const d = new Date();
 d.setDate(d.getDate() - 30);
 return d.toISOString().split('T')[0];
});
 const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

 useEffect(() => {
 const fetchFinancials = async () => {
 setLoading(true);
 try {
 const [paymentRecords, invoiceRecords] = await Promise.all([
 base44.getEntities('shs_payment', user?.company_id),
 base44.getEntities('shs_invoice', user?.company_id)
 ]);

 // Filter payments by date range
 const pFiltered = paymentRecords.filter(r => r.data?.date >= startDate && r.data?.date <= endDate);
 setPayments(pFiltered);
 
 // We might want to see all invoices for the current term, but let's just use all for the ledger overview
 setInvoices(invoiceRecords);
} catch (error) {
 console.error('Failed to fetch financial reports:', error);
} finally {
 setLoading(false);
}
};

 if (user?.company_id && startDate && endDate) {
 fetchFinancials();
}
}, [startDate, endDate, user]);

 const totalCollected = payments.reduce((sum, p) => sum + (parseFloat(p.data?.amountPaid) || 0), 0);
 const totalBilled = invoices.reduce((sum, i) => sum + (parseFloat(i.data?.amount) || 0), 0);
 const totalOutstanding = invoices.reduce((sum, i) => {
 const amt = parseFloat(i.data?.amount) || 0;
 const paid = parseFloat(i.data?.amountPaid) || 0;
 return sum + Math.max(0, amt - paid);
}, 0);

 // Group by payment method
 const methodStats = {};
 payments.forEach(p => {
 const m = p.data?.paymentMethod || 'Unknown';
 if (!methodStats[m]) methodStats[m] = 0;
 methodStats[m] += parseFloat(p.data?.amountPaid) || 0;
});

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Financial Reports
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Revenue collection summaries and outstanding balances.
 </p>
 </div>
 <Button className="h-9 gap-2 rounded-xl bg-white dark:bg-card/40 dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 text-slate-700 dark:text-foreground dark:text-foreground hover:bg-slate-50 dark:bg-secondary/50 dark:bg-secondary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <FileSpreadsheet className="w-4 h-4 text-primary" /> Export CSV
 </Button>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/50 dark:bg-secondary/50 p-6">
 <div className="flex flex-col sm:flex-row gap-6 items-end">
 <div className="space-y-2 flex-1 max-w-xs">
 <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <CalendarIcon className="w-4 h-4 text-primary dark:text-primary/70" /> Start Date
 </label>
 <Input 
 type="date"
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-foreground dark:text-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 />
 </div>
 <div className="space-y-2 flex-1 max-w-xs">
 <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <CalendarIcon className="w-4 h-4 text-primary dark:text-primary/70" /> End Date
 </label>
 <Input 
 type="date"
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-foreground dark:text-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 />
 </div>
 <Button className="h-11 px-6 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold">
 <Filter className="w-4 h-4 mr-2" /> Apply Filter
 </Button>
 </div>
 </CardHeader>
 
 <CardContent className="p-8">
 {loading ? (
 <div className="py-20 text-center text-slate-400 dark:text-slate-500 dark:text-muted-foreground">Compiling financial data...</div>
 ) : (
 <div className="space-y-8">
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="p-6 rounded-3xl bg-slate-50 dark:bg-secondary/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col justify-center text-left">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary mb-4">
 <TrendingUp className="w-6 h-6" />
 </div>
 <p className="text-sm font-semibold text-primary/70 uppercase tracking-wider mb-1 tracking-[0.04em]">Total Collected</p>
 <p className="text-4xl font-black text-primary/90 tracking-[-0.02em]">${totalCollected.toFixed(2)}</p>
 <p className="text-xs text-primary/80 mt-2 font-medium tracking-[0.04em]">Within selected date range</p>
 </div>
 
 <div className="p-6 rounded-3xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 flex flex-col justify-center text-left">
 <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-foreground mb-4">
 <DollarSign className="w-6 h-6" />
 </div>
 <p className="text-sm font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wider mb-1 tracking-[0.04em]">Total Billed</p>
 <p className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">${totalBilled.toFixed(2)}</p>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground mt-2 font-medium tracking-[0.04em]">All generated invoices</p>
 </div>

 <div className="p-6 rounded-3xl bg-rose-50 border-[0.5px] border-black/9 dark:border-white/8 border-rose-100 flex flex-col justify-center text-left">
 <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
 <Filter className="w-6 h-6" />
 </div>
 <p className="text-sm font-semibold text-rose-600/70 uppercase tracking-wider mb-1 tracking-[0.04em]">Total Arrears</p>
 <p className="text-4xl font-black text-rose-700 tracking-[-0.02em]">${totalOutstanding.toFixed(2)}</p>
 <p className="text-xs text-rose-600/80 mt-2 font-medium tracking-[0.04em]">Outstanding student balances</p>
 </div>
 </div>

 <div className="h-px bg-slate-100 dark:bg-secondary w-full my-4"></div>
 
 <div>
 <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Collection by Payment Method</h3>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {Object.keys(methodStats).length === 0 ? (
 <div className="col-span-4 p-8 text-center text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground bg-slate-50 dark:bg-secondary/50 dark:bg-secondary rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40">
 No payments found in this period.
 </div>
 ) : (
 Object.entries(methodStats).map(([method, amount]) => (
 <div key={method} className="p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card hover:border-primary dark:border-primary/30 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wider mb-1 tracking-[0.04em]">{method}</p>
 <p className="text-2xl font-black text-slate-700 dark:text-foreground dark:text-foreground tracking-[-0.02em]">${amount.toFixed(2)}</p>
 </div>
 ))
 )}
 </div>
 </div>

 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
