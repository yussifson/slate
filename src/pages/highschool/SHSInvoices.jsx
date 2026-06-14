import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, FileText, Send, CheckCircle2, Download, Receipt} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';

export default function SHSInvoices() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [invoices, setInvoices] = useState([]);
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
 const [isGenerating, setIsGenerating] = useState(false);

 const fetchData = async () => {
 setLoading(true);
 try {
 const [invoiceData, studentData] = await Promise.all([
 base44.getEntities('shs_invoice', user?.company_id),
 base44.getEntities('shs_student', user?.company_id)
 ]);
 setInvoices(invoiceData);
 setStudents(studentData);
} catch (error) {
 console.error('Failed to fetch data:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchData();
}
}, [user]);

 const handleGenerateInvoices = async () => {
 setIsGenerating(true);
 try {
 // Simulate bulk generation process
 await new Promise(resolve => setTimeout(resolve, 2500));
 setIsGenerateModalOpen(false);
 fetchData();
} catch (error) {
 console.error('Failed to generate invoices:', error);
} finally {
 setIsGenerating(false);
}
};

 const filteredInvoices = invoices.filter(inv => 
 inv.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 inv.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 inv.data?.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Student Invoices
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Manage, generate, and send termly bills to parents.
 </p>
 </div>
 
 <Button onClick={() => setIsGenerateModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Receipt className="w-4 h-4" /> Generate Term Bills
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-slate-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 shrink-0">
 <FileText className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Total Invoices</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{invoices.length}</h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-rose-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
 <Receipt className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Unpaid</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {invoices.filter(i => i.status === 'Unpaid').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
 <CheckCircle2 className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Paid</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {invoices.filter(i => i.status === 'Paid').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Invoice Ledger</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search invoices..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading ledger...</div>
 ) : filteredInvoices.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <Receipt className="w-8 h-8 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No invoices generated</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Generate bills for the term to populate the ledger.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Invoice No.</th>
 <th className="px-6 py-4">Student</th>
 <th className="px-6 py-4">Term & Year</th>
 <th className="px-6 py-4">Amount</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredInvoices.map((inv) => (
 <tr key={inv.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-bold text-slate-800 dark:text-slate-100">{inv.case_number}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{inv.title}</p>
 </td>
 <td className="px-6 py-4">
 <p className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">{inv.data?.studentName || 'Unknown Student'}</p>
 </td>
 <td className="px-6 py-4">
 <span className="text-slate-600 dark:text-slate-300">{inv.data?.term} - {inv.data?.academicYear}</span>
 </td>
 <td className="px-6 py-4">
 <span className="font-black text-slate-800 dark:text-slate-100">
 ${parseFloat(inv.data?.amount || 0).toFixed(2)}
 </span>
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 inv.status === 'Paid' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' :
 inv.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
 'bg-rose-50 text-rose-700 border-rose-200'
}>
 {inv.status || 'Unpaid'}
 </Badge>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-2">
 <Button size="sm" variant="ghost" className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 <Download className="w-4 h-4" />
 </Button>
 <Button size="sm" variant="ghost" className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 <Send className="w-4 h-4" />
 </Button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black">Generate Bills</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Run the billing engine to generate term invoices.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
 <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
 This process will analyze active fee structures and generate individual invoices for all active students based on their boarding status, class, and programme.
 </p>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Academic Year</label>
 <Input 
 defaultValue={new Date().getFullYear().toString()}
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Term</label>
 <select className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary">
 <option value="Term 1">Term 1</option>
 <option value="Term 2">Term 2</option>
 <option value="Term 3">Term 3</option>
 </select>
 </div>
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end gap-3">
 <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleGenerateInvoices} 
 disabled={isGenerating}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold"
 >
 {isGenerating ? 'Processing...' : 'Run Billing Engine'}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
