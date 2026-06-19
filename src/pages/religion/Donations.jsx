import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { DollarSign, Search, Plus, Trash2, Download} from 'lucide-react';
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

export default function Donations() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { processPayment, isProcessing} = usePayment();
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('donation');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const donations = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Active',
 ...r.data
}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [viewRecord, setViewRecord] = useState(null);
 const [editRecord, setEditRecord] = useState(null);

 // Form State
 const [formData, setFormData] = useState({
 member: '',
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
 if (!formData.member.trim() || formData.amount <= 0) {
 return toast.error("Please enter a donor name and positive amount");
}

 try {
 const paymentResult = await processPayment({
 amount: parseFloat(formData.amount),
 currency: 'USD',
 description: `${formData.type} from ${formData.member}`,
 customerName: formData.member
});

 if (paymentResult.success) {
 const trxId = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
 const payload = {
 trxId,
 member: formData.member,
 type: formData.type,
 amount: parseFloat(formData.amount) || 0,
 method: formData.method,
 date: new Date().toISOString().split('T')[0]
};

 mutateRecord.mutate({
 ...(editRecord ? { id: editRecord.id} : {}),
 recordType: 'donation',
 payload,
 status: 'active',
 searchText: `${trxId} ${formData.member} ${formData.type}`
}, {
 onSuccess: () => {
 toast.success('Giving transaction logged successfully!');
 setShowModal(false);
 setEditRecord(null);
 setFormData({ member: '', type: 'Donation', amount: 100, method: 'Mobile Money'});
},
 onError: (err) => {
 toast.error('Failed to log giving: ' + err.message);
}
});
}
} catch (err) {
 toast.error('Payment processing failed: ' + err.message);
}
};

 const handleDeleteDonation = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'donation'}, {
 onSuccess: () => {
 toast.success('Giving record retracted successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to retract record: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const filtered = donations.filter(item =>
 item.member?.toLowerCase().includes(search.toLowerCase()) ||
 item.trxId?.toLowerCase().includes(search.toLowerCase()) ||
 item.type?.toLowerCase().includes(search.toLowerCase())
 );

 const totalDonations = donations.filter(item => item.type === 'Donation').reduce((acc, c) => acc + (c.amount || 0), 0);
 const totalOfferings = donations.filter(item => item.type === 'Offering').reduce((acc, c) => acc + (c.amount || 0), 0);
 const totalOthers = donations.filter(item => item.type !== 'Donation' && item.type !== 'Offering').reduce((acc, c) => acc + (c.amount || 0), 0);

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("donations_offerings", "Donations & Offerings")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_religion_financial_contri", "Manage religion financial contributions")}</p>
 </div>
 <div className="flex gap-3">
 <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
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
 <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-500 flex items-center justify-center text-primary dark:text-primary/70">
 <DollarSign className="w-4 h-4" />
 </div>
 <h3 className="font-semibold text-foreground text-sm">{t("special_building_funds", "Special/Building Funds")}</h3>
 </div>
 <p className="text-3xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${totalOthers.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("donor_member_name", "Donor/Member Name")}</label>
 <Input
 value={formData.member}
 onChange={e => setFormData({ ...formData, member: e.target.value})}
 className="mt-1"
 placeholder="e.g. John Doe or Anonymous"
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
