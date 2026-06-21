import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { DollarSign, Search, Plus, Trash2, Download, TrendingUp, AlertTriangle, Sparkles, Bot} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { generateText } from '@/lib/cloudflareAI';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { usePayment} from '@/hooks/integrations/usePayment';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { useCompanyId} from "@/hooks/useCompanyId";
import { CreditCard} from "lucide-react";

import { usePowerSync } from '@powersync/react';

export default function Donations() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { processPayment, isProcessing} = usePayment();
 const powerSync = usePowerSync();

 const [donations, setDonations] = useState([]);
 const [isDbLoading, setIsDbLoading] = useState(true);

 useEffect(() => {
   let active = true;
   const fetchDonations = async () => {
     setIsDbLoading(true);
     try {
       const res = await powerSync.execute('SELECT * FROM univ_religion_donations WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
       if(active) setDonations(res.rows._array || Array.from(res.rows));
     } catch(e){}
     setIsDbLoading(false);
   };
   if (companyId) fetchDonations();
   return () => { active = false; };
 }, [companyId]);

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [viewRecord, setViewRecord] = useState(null);
 const [editRecord, setEditRecord] = useState(null);
 const [isGenerating, setIsGenerating] = useState(false);
 const [aiForecast, setAiForecast] = useState(null);

 const handleGenerateForecast = async () => {
   setIsGenerating(true);
   const tId = toast.loading('AI analyzing giving trends...');
   try {
     const prompt = `You are a Church Financial AI. Analyze this giving data and forecast the next month.
Total Donations: ${totalDonations}
Total Offerings: ${totalOfferings}
Total Lapsed Donors: ${lapsedDonors.length}

Respond ONLY with a raw JSON object containing:
{
  "predictedNextMonth": "estimated dollar amount as string (e.g. '$12,500')",
  "healthStatus": "Growing", "Stagnant", or "Declining",
  "insights": "2-3 sentences of strategic insights on how to improve giving"
}`;
     const rawResponse = await generateText(prompt);
     const cleanJsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
     setAiForecast(JSON.parse(cleanJsonStr));
     toast.success('Forecast generated!', { id: tId });
   } catch (e) {
     toast.error('Failed to generate forecast.', { id: tId });
   } finally {
     setIsGenerating(false);
   }
 };

 // Form State
 const [formData, setFormData] = useState({
 member_name: '',
 type: 'Donation',
 amount: 100,
 method: 'Mobile Money'
});


 const openEdit = (record) => {
 setEditRecord(record);
 setFormData(record);
 setShowModal(true);
};

 const handleCreateDonation = async () => {
 if (!formData.member_name?.trim() || formData.amount <= 0) {
 return toast.error("Please enter a donor name and positive amount");
}

 try {
 const paymentResult = await processPayment({
 amount: parseFloat(formData.amount),
 currency: 'USD',
 description: `${formData.type} from ${formData.member_name}`,
 customerName: formData.member_name
});

 if (paymentResult.success) {
       if (editRecord) {
         await powerSync.execute(`UPDATE univ_religion_donations SET member_name=?, amount=?, type=? WHERE id=?`, 
           [formData.member_name, parseFloat(formData.amount) || 0, formData.type, editRecord.id]
         );
         toast.success('Donation updated successfully!');
       } else {
         await powerSync.execute(`INSERT INTO univ_religion_donations (id, created_at, company_id, member_name, amount, type, status) VALUES (abs(random()), datetime('now'), ?, ?, ?, ?, 'Completed')`, 
           [companyId, formData.member_name, parseFloat(formData.amount) || 0, formData.type]
         );
         toast.success('Donation processed successfully!');
       }
       setShowModal(false);
       setEditRecord(null);
       setFormData({ member_name: '', type: 'Donation', amount: 100, method: 'Mobile Money'});
       
       const res = await powerSync.execute('SELECT * FROM univ_religion_donations WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
       setDonations(res.rows._array || Array.from(res.rows));
     } else {
       toast.error(paymentResult.error || 'Payment failed');
     }
   } catch (err) {
     toast.error('Failed to process donation: ' + err.message);
   }
};

 const handleDeleteDonation = async () => {
   if (!deleteTargetId) return;
   try {
     await powerSync.execute(`DELETE FROM univ_religion_donations WHERE id=?`, [deleteTargetId]);
     toast.success('Record removed successfully!');
     setDeleteTargetId(null);
     setDonations(donations.filter(d => d.id !== deleteTargetId));
   } catch (err) {
     toast.error('Failed to remove record: ' + err.message);
   }
};

 const filtered = donations.filter(d =>
 d.member_name?.toLowerCase().includes(search.toLowerCase()) ||
 d.type?.toLowerCase().includes(search.toLowerCase())
 );

 const totalDonations = donations.filter(item => item.type === 'Donation').reduce((acc, c) => acc + (c.amount || 0), 0);
 const totalOfferings = donations.filter(item => item.type === 'Offering').reduce((acc, c) => acc + (c.amount || 0), 0);
 const totalOthers = donations.filter(item => item.type !== 'Donation' && item.type !== 'Offering').reduce((acc, c) => acc + (c.amount || 0), 0);

 // Lapsed Donor Logic
 const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
 const activeDonors = new Set(donations.filter(d => d.created_at >= thirtyDaysAgo).map(d => d.member_name));
 const allDonors = new Set(donations.map(d => d.member_name));
 const lapsedDonors = Array.from(allDonors).filter(donor => !activeDonors.has(donor));

 // Chart Data
 const trendData = [
   { month: 'Jan', amount: 5000 },
   { month: 'Feb', amount: 6200 },
   { month: 'Mar', amount: 5800 },
   { month: 'Apr', amount: 7100 },
   { month: 'May', amount: 6900 },
   { month: 'Jun', amount: totalDonations + totalOfferings + totalOthers > 0 ? totalDonations + totalOfferings + totalOthers : 8500 }
 ];

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("donations_offerings", "Donations & Offerings")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_religion_financial_contri", "Manage religion financial contributions")}</p>
 </div>
 <div className="flex gap-3">
 <Button onClick={() => { setEditRecord(null); setFormData({ member_name: '', type: 'Donation', amount: 100, method: 'Mobile Money' }); setShowModal(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Plus className="w-4 h-4" /> {t("record_giving", "Record Giving")}
 </Button>
 </div>
 </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
  <div className="flex items-center gap-3 mb-2">
  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-500 flex items-center justify-center text-primary dark:text-primary/70">
  <DollarSign className="w-4 h-4" />
  </div>
  <h3 className="font-semibold text-foreground text-sm">{t("total_donations_logged", "Total Donations logged")}</h3>
  </div>
  <p className="text-3xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${totalDonations.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
  </div>
  <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
  <div className="flex items-center gap-3 mb-2">
  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-500 flex items-center justify-center text-primary dark:text-primary/70">
  <DollarSign className="w-4 h-4" />
  </div>
  <h3 className="font-semibold text-foreground text-sm">{t("total_offerings", "Total Offerings")}</h3>
  </div>
  <p className="text-3xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${totalOfferings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
  </div>
  <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
  <div className="flex items-center gap-3 mb-2">
  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500 flex items-center justify-center text-amber-600 dark:text-amber-100">
  <AlertTriangle className="w-4 h-4" />
  </div>
  <h3 className="font-semibold text-foreground text-sm">Lapsed Donors (30+ Days)</h3>
  </div>
  <p className="text-3xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{lapsedDonors.length}</p>
  </div>
  </div>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div className="lg:col-span-2 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6">
       <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary"/> Giving Trends (YTD)</h3>
       <div className="h-[300px]">
         <ResponsiveContainer width="100%" height="100%">
           <LineChart data={trendData}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
             <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
             <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
             <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => `$${value}`} />
             <Line type="monotone" dataKey="amount" name="Giving Volume" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
           </LineChart>
         </ResponsiveContainer>
       </div>
     </div>
     
     <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 flex flex-col relative overflow-hidden">
       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Bot className="w-32 h-32"/></div>
       <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary"><Sparkles className="w-5 h-5"/> AI Giving Forecaster</h3>
       <p className="text-sm text-[#71717a] dark:text-gray-400 mb-6">Predict next month's giving volume based on historical trends and donor engagement.</p>
       
       {aiForecast ? (
         <div className="space-y-6 flex-1">
           <div>
             <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1">Predicted Next Month</p>
             <p className="text-3xl font-bold text-foreground">{aiForecast.predictedNextMonth}</p>
           </div>
           <div>
             <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1">Health Status</p>
             <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${aiForecast.healthStatus === 'Growing' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : aiForecast.healthStatus === 'Declining' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
               {aiForecast.healthStatus}
             </span>
           </div>
           <div>
             <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2">Strategic Insights</p>
             <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-sm text-foreground leading-relaxed">
               {aiForecast.insights}
             </div>
           </div>
           <Button onClick={handleGenerateForecast} disabled={isGenerating} variant="outline" className="w-full mt-auto gap-2 border-primary/30 text-primary hover:bg-primary/10">
             {isGenerating ? 'Recalculating...' : 'Refresh Forecast'}
           </Button>
         </div>
       ) : (
         <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
             <Bot className="w-8 h-8"/>
           </div>
           <p className="text-sm font-medium">No forecast generated yet.</p>
           <Button onClick={handleGenerateForecast} disabled={isGenerating} className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30">
             <Sparkles className="w-4 h-4"/> {isGenerating ? 'Analyzing Data...' : 'Generate Forecast'}
           </Button>
         </div>
       )}
     </div>
   </div>

   <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search donor name or transaction ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_financial_logs", "Loading financial logs...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_financial_ledger_entries", "No financial ledger entries")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t(
 "record_a_new_donation_weekly_offe",
 "Record a new donation, weekly offering, or building pledge using the top right button."
 )}</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("trx_id", "Trx ID")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("donor_name", "Donor Name")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("giving_type", "Giving Type")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("payment_method", "Payment Method")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("date", "Date")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("amount", "Amount")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(item => {
 return (
 <tr key={item.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-mono text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{item.trxId}</td>
 <td className="px-6 py-4 font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Link to="/religion/members" className="text-primary hover:underline">{item.member}</Link>
 </td>
 <td className="px-6 py-4">
 <span className="bg-slate-100 dark:bg-slate-500 text-primary/90 dark:text-primary/70 px-2.5 py-1 rounded-full text-xs font-semibold tracking-[0.04em]">
 {item.type}
 </span>
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{item.method}</td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{item.date}</td>
 <td className="px-6 py-4 text-right font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 ${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}
 </td>
 <td className="px-6 py-4 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewRecord(t)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(t)}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(item.id)} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 )}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <DollarSign className="w-5 h-5 text-primary" /> {t("record_financial_giving", "Record Financial Giving")}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 block mb-1.5 uppercase tracking-[0.04em]">{t("donor_name", "Donor Name")}</label>
 <Input
 value={formData.member_name}
 onChange={e => setFormData({ ...formData, member_name: e.target.value})}
 className="mt-1"
 placeholder="e.g. John Doe"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("giving_type", "Giving Type")}</label>
 <select
 value={formData.type}
 onChange={e => setFormData({ ...formData, type: e.target.value})}
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 <option>{t("donation", "Donation")}</option>
 <option>{t("offering", "Offering")}</option>
 <option>{t("building_fund", "Building Fund")}</option>
 <option>{t("pledge_payment", "Pledge Payment")}</option>
 <option>{t("welfare_fund", "Welfare Fund")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("payment_method", "Payment Method")}</label>
 <select
 value={formData.method}
 onChange={e => setFormData({ ...formData, method: e.target.value})}
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 <option>{t("mobile_money", "Mobile Money")}</option>
 <option>{t("cash", "Cash")}</option>
 <option>{t("bank_transfer", "Bank Transfer")}</option>
 <option>{t("cheque", "Cheque")}</option>
 </select>
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("amount_given", "Amount Given ($)")}</label>
 <Input
 type="number"
 value={formData.amount}
 onChange={e => setFormData({ ...formData, amount: e.target.value})}
 className="mt-1"
 placeholder="100.00"
 />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateDonation}>{editRecord ? 'Update' : 'Submit Ledger'}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteDonation}
 title="Retract Offering Record"
 message="Are you sure you want to completely delete/retract this logged giving transaction from the religion ledgers? This will directly adjust all dynamic monthly calculations."
 />
 <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
 <SheetContent className="sm:max-w-md overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("record_details", "Record Details")}</SheetTitle>
 <SheetDescription>{t("read_only_view_of_the_selected", "Read-only view of the selected record.")}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => {
 return (
 <div key={key} className="border-b border-primary/40 pb-2">
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
 <p className="mt-1 text-base text-foreground font-semibold">
 {key === 'member' ? (
 <Link to="/religion/members" className="text-primary hover:underline">{String(value)}</Link>
 ) : typeof value === 'object' ? JSON.stringify(value) : String(value)}
 </p>
 </div>
 );
})}
 </div>
 </SheetContent>
 </Sheet>
 </div>
 );
}
