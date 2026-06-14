import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, DollarSign, CreditCard, CheckCircle2, History, Receipt} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';

export default function SHSPayments() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [payments, setPayments] = useState([]);
 const [invoices, setInvoices] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
 const [newPayment, setNewPayment] = useState({
 invoiceId: '',
 amountPaid: '',
 paymentMethod: 'Cash', // Cash, Bank Transfer, Mobile Money, Cheque
 referenceNo: '',
 date: new Date().toISOString().split('T')[0]
});
 const [isProcessing, setIsProcessing] = useState(false);

 const fetchData = async () => {
 setLoading(true);
 try {
 const [paymentData, invoiceData] = await Promise.all([
 base44.getEntities('shs_payment', user?.company_id),
 base44.getEntities('shs_invoice', user?.company_id)
 ]);
 setPayments(paymentData);
 setInvoices(invoiceData);
} catch (error) {
 console.error('Failed to fetch financial data:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchData();
}
}, [user]);

 const handleRecordPayment = async () => {
 setIsProcessing(true);
 try {
 const selectedInvoice = invoices.find(i => i.id === newPayment.invoiceId);
 const paymentAmount = parseFloat(newPayment.amountPaid);
 
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_payment',
 title: `Payment by ${selectedInvoice?.data?.studentName || 'Unknown'}`,
 case_number: `RCPT-${Math.floor(Math.random() * 100000)}`,
 status: 'Completed',
 data: {
 ...newPayment,
 amountPaid: paymentAmount,
 invoiceNumber: selectedInvoice?.case_number,
 studentName: selectedInvoice?.data?.studentName
}
};
 
 await base44.createEntity(payload);

 // Update Invoice Status
 if (selectedInvoice) {
 const prevPaid = parseFloat(selectedInvoice.data?.amountPaid || 0);
 const totalAmount = parseFloat(selectedInvoice.data?.amount || 0);
 const newPaidTotal = prevPaid + paymentAmount;
 
 let newStatus = 'Unpaid';
 if (newPaidTotal >= totalAmount) newStatus = 'Paid';
 else if (newPaidTotal > 0) newStatus = 'Partial';

 await base44.updateEntity(selectedInvoice.id, {
 status: newStatus,
 data: {
 ...selectedInvoice.data,
 amountPaid: newPaidTotal
}
});
}

 setIsPaymentModalOpen(false);
 setNewPayment({ invoiceId: '', amountPaid: '', paymentMethod: 'Cash', referenceNo: '', date: new Date().toISOString().split('T')[0]});
 fetchData();
} catch (error) {
 console.error('Failed to record payment:', error);
} finally {
 setIsProcessing(false);
}
};

 const filteredPayments = payments.filter(p => 
 p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 p.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.data?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const pendingInvoices = invoices.filter(i => i.status !== 'Paid');

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Payment Collection
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Record incoming fee payments and issue receipts.
 </p>
 </div>
 
 <Button onClick={() => setIsPaymentModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Record Payment
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-slate-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <DollarSign className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Total Transactions</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{payments.length}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Payment History</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search receipts..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading transactions...</div>
 ) : filteredPayments.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <History className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No payments recorded</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Record a payment to see it here.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Receipt No.</th>
 <th className="px-6 py-4">Student</th>
 <th className="px-6 py-4">Invoice Ref</th>
 <th className="px-6 py-4">Amount Paid</th>
 <th className="px-6 py-4">Method / Date</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredPayments.map((payment) => (
 <tr key={payment.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-bold text-slate-800 dark:text-slate-100">{payment.case_number}</p>
 </td>
 <td className="px-6 py-4">
 <p className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">{payment.data?.studentName || 'Unknown Student'}</p>
 </td>
 <td className="px-6 py-4">
 <span className="text-slate-600 dark:text-slate-300 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{payment.data?.invoiceNumber}</span>
 </td>
 <td className="px-6 py-4">
 <span className="font-black text-primary bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-primary/40">
 ${parseFloat(payment.data?.amountPaid || 0).toFixed(2)}
 </span>
 </td>
 <td className="px-6 py-4">
 <p className="font-medium text-slate-700 dark:text-slate-300 dark:text-slate-200 flex items-center gap-1.5 mb-1">
 <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" /> {payment.data?.paymentMethod}
 </p>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{payment.data?.date}</p>
 </td>
 <td className="px-6 py-4 text-right">
 <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20">
 {payment.status}
 </Badge>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black">Record Payment</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Log an incoming fee payment from a student/parent.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Select Invoice (Unpaid/Partial)</label>
 <select 
 className="w-full h-11 rounded-xl border border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newPayment.invoiceId}
 onChange={e => setNewPayment({...newPayment, invoiceId: e.target.value})}
 >
 <option value="">Search and select invoice...</option>
 {pendingInvoices.map(inv => {
 const amount = parseFloat(inv.data?.amount || 0);
 const paid = parseFloat(inv.data?.amountPaid || 0);
 const balance = amount - paid;
 return (
 <option key={inv.id} value={inv.id}>
 {inv.case_number} - {inv.data?.studentName} (Bal: ${balance.toFixed(2)})
 </option>
 );
})}
 </select>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Amount Paid ($)</label>
 <Input 
 type="number"
 min="0.01"
 step="0.01"
 placeholder="0.00"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl font-bold text-lg h-11"
 value={newPayment.amountPaid}
 onChange={e => setNewPayment({...newPayment, amountPaid: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Payment Method</label>
 <select 
 className="w-full h-11 rounded-xl border border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newPayment.paymentMethod}
 onChange={e => setNewPayment({...newPayment, paymentMethod: e.target.value})}
 >
 <option value="Cash">Cash</option>
 <option value="Bank Transfer">Bank Transfer</option>
 <option value="Mobile Money">Mobile Money</option>
 <option value="Cheque">Cheque</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Payment Date</label>
 <Input 
 type="date"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl h-11"
 value={newPayment.date}
 onChange={e => setNewPayment({...newPayment, date: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Reference No (Optional)</label>
 <Input 
 placeholder="Bank Teller / Momo Ref"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl h-11 text-xs"
 value={newPayment.referenceNo}
 onChange={e => setNewPayment({...newPayment, referenceNo: e.target.value})}
 />
 </div>
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3">
 <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleRecordPayment} 
 disabled={!newPayment.invoiceId || !newPayment.amountPaid || isProcessing}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold px-6"
 >
 {isProcessing ? 'Processing...' : 'Confirm Payment'}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
