import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, CreditCard, Layers, Tag} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';

export default function SHSFees() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [feeStructures, setFeeStructures] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newFee, setNewFee] = useState({
 title: '',
 category: 'Tuition', // Tuition, Boarding, PTA, Examination, Other
 amount: '',
 targetGroup: 'All Students', // All, Boarders Only, Form 1 Only, etc.
 academicYear: new Date().getFullYear().toString(),
 term: 'Term 1'
});

 const fetchFees = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_fee_structure', user?.company_id);
 setFeeStructures(records);
} catch (error) {
 console.error('Failed to fetch fee structures:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchFees();
}
}, [user]);

 const handleCreateFee = async () => {
 try {
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_fee_structure',
 title: newFee.title,
 case_number: `FEE-${Math.floor(Math.random() * 10000)}`,
 status: 'Active',
 data: {
 ...newFee,
 amount: parseFloat(newFee.amount) || 0
}
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewFee({
 title: '', category: 'Tuition', amount: '', targetGroup: 'All Students', academicYear: new Date().getFullYear().toString(), term: 'Term 1'
});
 fetchFees();
} catch (error) {
 console.error('Failed to create fee structure:', error);
}
};

 const filteredFees = feeStructures.filter(f => 
 f.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 f.data?.category?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Fee Structures
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Define billing structures for tuition, boarding, and miscellaneous items.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Create Fee Item
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-primary/10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Layers className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Active Fee Items</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{feeStructures.filter(f => f.status === 'Active').length}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Fee Items Library</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search fees..." 
 className="pl-9 h-9 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading fees...</div>
 ) : filteredFees.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <CreditCard className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">No fee items found</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Create fee structures to apply to student bills.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Fee Title</th>
 <th className="px-6 py-4">Category</th>
 <th className="px-6 py-4">Target Group</th>
 <th className="px-6 py-4">Amount</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredFees.map((fee) => (
 <tr key={fee.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-slate-800 dark:text-slate-100">{fee.title}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-[0.04em]">{fee.data?.academicYear} • {fee.data?.term}</p>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <span className="font-medium text-slate-700 dark:text-slate-300 dark:text-slate-200">{fee.data?.category}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none">
 {fee.data?.targetGroup}
 </Badge>
 </td>
 <td className="px-6 py-4">
 <span className="font-black text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-primary/90">
 ${parseFloat(fee.data?.amount).toFixed(2)}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <Badge variant="outline" className={
 fee.status === 'Active' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' : 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-primary/40 dark:border-primary/40'
}>
 {fee.status}
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

 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black tracking-[-0.02em]">Create Fee Item</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Define a new billing charge for students.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Fee Title</label>
 <Input 
 placeholder="e.g. Term 1 Tuition Fee"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newFee.title}
 onChange={e => setNewFee({...newFee, title: e.target.value})}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Category</label>
 <select 
 className="w-full h-10 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newFee.category}
 onChange={e => setNewFee({...newFee, category: e.target.value})}
 >
 <option value="Tuition">Tuition</option>
 <option value="Boarding">Boarding</option>
 <option value="PTA">PTA Dues</option>
 <option value="Examination">Examination</option>
 <option value="Other">Other</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Amount ($)</label>
 <Input 
 type="number"
 min="0"
 step="0.01"
 placeholder="0.00"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl font-semibold hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newFee.amount}
 onChange={e => setNewFee({...newFee, amount: e.target.value})}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Target Group</label>
 <select 
 className="w-full h-10 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newFee.targetGroup}
 onChange={e => setNewFee({...newFee, targetGroup: e.target.value})}
 >
 <option value="All Students">All Students</option>
 <option value="Boarders Only">Boarders Only</option>
 <option value="Day Students Only">Day Students Only</option>
 <option value="Form 1 Only">Form 1 Only</option>
 <option value="Form 3 Candidates">Form 3 Candidates</option>
 </select>
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Academic Year</label>
 <Input 
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newFee.academicYear}
 onChange={e => setNewFee({...newFee, academicYear: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Term</label>
 <select 
 className="w-full h-10 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newFee.term}
 onChange={e => setNewFee({...newFee, term: e.target.value})}
 >
 <option value="Term 1">Term 1</option>
 <option value="Term 2">Term 2</option>
 <option value="Term 3">Term 3</option>
 <option value="Annual">Annual (All Terms)</option>
 </select>
 </div>
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-card/40 dark:bg-card border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleCreateFee} 
 disabled={!newFee.title || !newFee.amount}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold"
 >
 Save Fee Item
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
