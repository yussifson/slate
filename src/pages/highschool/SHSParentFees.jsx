import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { User, Receipt, DollarSign, Download, ExternalLink, AlertCircle} from 'lucide-react';
import { Badge} from '@/components/ui/badge';

export default function SHSParentFees() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [loading, setLoading] = useState(true);
 const [wards, setWards] = useState([]);
 const [selectedWardId, setSelectedWardId] = useState('');
 
 const [invoices, setInvoices] = useState([]);
 const [payments, setPayments] = useState([]);

 useEffect(() => {
 const fetchData = async () => {
 setLoading(true);
 try {
 const students = await base44.getEntities('shs_student', user?.company_id);
 const myWards = students.slice(0, 2);
 setWards(myWards);
 if (myWards.length > 0) setSelectedWardId(myWards[0].id);
 
 // Fetch financial data
 const [invData, payData] = await Promise.all([
 base44.getEntities('shs_invoice', user?.company_id),
 base44.getEntities('shs_payment', user?.company_id)
 ]);
 
 setInvoices(invData);
 setPayments(payData);

} catch (error) {
 console.error('Failed to fetch parent fee data:', error);
} finally {
 setLoading(false);
}
};

 if (user?.company_id) {
 fetchData();
}
}, [user]);

 const selectedWard = wards.find(w => w.id === selectedWardId);
 
 const wardInvoices = invoices.filter(i => i.data?.studentName === selectedWard?.title);
 const wardPayments = payments.filter(p => p.data?.studentName === selectedWard?.title);

 const totalBilled = wardInvoices.reduce((sum, i) => sum + (parseFloat(i.data?.amount) || 0), 0);
 const totalPaid = wardPayments.reduce((sum, p) => sum + (parseFloat(p.data?.amountPaid) || 0), 0);
 const currentBalance = Math.max(0, totalBilled - totalPaid);

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Fee Statements
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 View termly bills, track payments, and download receipts.
 </p>
 </div>
 </div>

 {loading ? (
 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardContent className="p-20 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading financial records...</CardContent>
 </Card>
 ) : wards.length === 0 ? (
 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardContent className="p-20 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <User className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No Wards Linked</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Contact the school administration to link your child's account.</p>
 </CardContent>
 </Card>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 
 <div className="lg:col-span-1 space-y-4">
 <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2">Select Child</h3>
 {wards.map(ward => (
 <button
 key={ward.id}
 onClick={() => setSelectedWardId(ward.id)}
 className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${
 selectedWardId === ward.id 
 ? 'bg-primary dark:bg-primary border-primary dark:border-primary text-white -emerald-500/20 scale-100' 
 : 'bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-200 hover:border-primary dark:border-slate-200 scale-95'
}`}
 >
 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
 selectedWardId === ward.id ? 'bg-white dark:bg-slate-900/40 dark:bg-slate-900/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary/70'
}`}>
 {ward.title.charAt(0)}
 </div>
 <div>
 <h4 className="font-bold">{ward.title}</h4>
 <p className={`text-xs ${selectedWardId === ward.id ? 'text-primary/20 dark:text-primary/80' : 'text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400'}`}>
 {ward.data?.classRoom || 'Form 1'}
 </p>
 </div>
 </button>
 ))}
 </div>

 <div className="lg:col-span-3 space-y-6">
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100">
 <CardContent className="p-6">
 <p className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Billed</p>
 <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">${totalBilled.toFixed(2)}</h3>
 </CardContent>
 </Card>
 <Card className="rounded-3xl border-none bg-slate-50">
 <CardContent className="p-6">
 <p className="text-sm font-bold text-primary/70 uppercase tracking-wider mb-2">Total Paid</p>
 <h3 className="text-3xl font-black text-primary/90">${totalPaid.toFixed(2)}</h3>
 </CardContent>
 </Card>
 <Card className={`rounded-3xl border-none ${currentBalance > 0 ? 'bg-rose-50' : 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800'}`}>
 <CardContent className="p-6">
 <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${currentBalance > 0 ? 'text-rose-600/70' : 'text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400'}`}>Current Arrears</p>
 <h3 className={`text-3xl font-black ${currentBalance > 0 ? 'text-rose-700' : 'text-slate-800 dark:text-slate-100'}`}>${currentBalance.toFixed(2)}</h3>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50">
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
 <Receipt className="w-5 h-5 text-primary dark:text-primary/70" /> Recent Invoices
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {wardInvoices.length === 0 ? (
 <div className="p-16 text-center text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 No invoices generated for this student.
 </div>
 ) : (
 <div className="divide-y divide-slate-100">
 {wardInvoices.map(invoice => (
 <div key={invoice.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
 <Receipt className="w-6 h-6 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 </div>
 <div>
 <h4 className="font-bold text-slate-800 dark:text-slate-100">{invoice.case_number}</h4>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{invoice.data?.term} • {invoice.data?.academicYear}</p>
 <Badge variant="outline" className={`mt-2 ${
 invoice.status === 'Paid' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' :
 invoice.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
 'bg-rose-50 text-rose-700 border-rose-200'
}`}>
 {invoice.status || 'Unpaid'}
 </Badge>
 </div>
 </div>
 <div className="text-right">
 <p className="text-2xl font-black text-slate-800 dark:text-slate-100">${parseFloat(invoice.data?.amount || 0).toFixed(2)}</p>
 <Button variant="ghost" size="sm" className="mt-2 text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 -mr-3">
 <Download className="w-4 h-4 mr-2" /> Bill PDF
 </Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50">
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
 <DollarSign className="w-5 h-5 text-primary" /> Payment History
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {wardPayments.length === 0 ? (
 <div className="p-16 text-center text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 No payments recorded for this student.
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Date</th>
 <th className="px-6 py-4">Receipt No</th>
 <th className="px-6 py-4">Invoice Ref</th>
 <th className="px-6 py-4">Amount</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {wardPayments.map((payment) => (
 <tr key={payment.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
 {new Date(payment.data?.date).toLocaleDateString()}
 </td>
 <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
 {payment.case_number}
 </td>
 <td className="px-6 py-4 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 {payment.data?.invoiceNumber}
 </td>
 <td className="px-6 py-4 font-black text-primary">
 ${parseFloat(payment.data?.amountPaid || 0).toFixed(2)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </div>

 </div>
 )}
 </div>
 );
}
