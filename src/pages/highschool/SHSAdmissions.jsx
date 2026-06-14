import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Filter, Users, UserPlus, CheckCircle, XCircle} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSAdmissions() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [applicants, setApplicants] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newApplicant, setNewApplicant] = useState({
 firstName: '',
 lastName: '',
 dob: '',
 gender: 'Male',
 jhsAttended: '',
 beceAggregate: '',
 programChoice1: '',
 programChoice2: '',
 status: 'Pending'
});

 const fetchApplicants = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_applicant', user?.company_id);
 setApplicants(records);
} catch (error) {
 console.error('Failed to fetch applicants:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchApplicants();
}
}, [user]);

 const handleAddApplicant = async () => {
 try {
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_applicant',
 title: `${newApplicant.firstName} ${newApplicant.lastName}`,
 case_number: `APP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
 status: newApplicant.status,
 data: newApplicant
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewApplicant({
 firstName: '', lastName: '', dob: '', gender: 'Male', jhsAttended: '', beceAggregate: '', programChoice1: '', programChoice2: '', status: 'Pending'
});
 fetchApplicants();
} catch (error) {
 console.error('Failed to add applicant:', error);
}
};

 const filteredApplicants = applicants.filter(a => 
 a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 a.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Admissions Hub
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Manage incoming student applications, review BECE aggregates, and process admissions.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> New Application
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Users className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Total Applicants</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{applicants.length}</h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-amber-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
 <UserPlus className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Pending Review</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {applicants.filter(a => a.status === 'Pending').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
 <CheckCircle className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Admitted</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {applicants.filter(a => a.status === 'Admitted').length}
 </h3>
 </div>
 </CardContent>
 </Card>

 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-rose-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
 <XCircle className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Rejected</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {applicants.filter(a => a.status === 'Rejected').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Applications List</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search name or ID..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading applicants...</div>
 ) : filteredApplicants.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <Users className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No applications found</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Register a new applicant to get started.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Applicant Name</th>
 <th className="px-6 py-4">App ID</th>
 <th className="px-6 py-4">BECE Agg.</th>
 <th className="px-6 py-4">First Choice</th>
 <th className="px-6 py-4">JHS Attended</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredApplicants.map((applicant) => (
 <tr key={applicant.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
 {applicant.title}
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
 {applicant.case_number}
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-200 font-bold">
 {applicant.data?.beceAggregate}
 </Badge>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300 dark:text-slate-200">
 {applicant.data?.programChoice1}
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
 {applicant.data?.jhsAttended}
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 applicant.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
 applicant.status === 'Admitted' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' :
 'bg-rose-50 text-rose-700 border-rose-200'
}>
 {applicant.status}
 </Badge>
 </td>
 <td className="px-6 py-4 text-right">
 <Button variant="ghost" size="sm" className="text-primary dark:text-primary/70 hover:text-primary/70 dark:text-primary/10 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 rounded-lg">
 Review
 </Button>
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
 <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black">Register New Applicant</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Enter details for a new SHS admission application.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <ScrollArea className="max-h-[65vh] p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 <div className="space-y-6">
 
 <div className="space-y-4">
 <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
 <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary/70 flex items-center justify-center text-xs">1</span>
 Personal Details
 </h4>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">First Name</label>
 <Input 
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newApplicant.firstName}
 onChange={e => setNewApplicant({...newApplicant, firstName: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Last Name</label>
 <Input 
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newApplicant.lastName}
 onChange={e => setNewApplicant({...newApplicant, lastName: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date of Birth</label>
 <Input 
 type="date"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newApplicant.dob}
 onChange={e => setNewApplicant({...newApplicant, dob: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Gender</label>
 <select 
 className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newApplicant.gender}
 onChange={e => setNewApplicant({...newApplicant, gender: e.target.value})}
 >
 <option value="Male">Male</option>
 <option value="Female">Female</option>
 </select>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
 <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary/70 flex items-center justify-center text-xs">2</span>
 Academic & Programme
 </h4>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">JHS Attended</label>
 <Input 
 placeholder="e.g. Ridge Religion School"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newApplicant.jhsAttended}
 onChange={e => setNewApplicant({...newApplicant, jhsAttended: e.target.value})}
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">BECE Aggregate</label>
 <Input 
 type="number"
 placeholder="e.g. 06"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newApplicant.beceAggregate}
 onChange={e => setNewApplicant({...newApplicant, beceAggregate: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</label>
 <select 
 className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newApplicant.status}
 onChange={e => setNewApplicant({...newApplicant, status: e.target.value})}
 >
 <option value="Pending">Pending Review</option>
 <option value="Admitted">Admitted</option>
 <option value="Rejected">Rejected</option>
 </select>
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">1st Choice</label>
 <select 
 className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newApplicant.programChoice1}
 onChange={e => setNewApplicant({...newApplicant, programChoice1: e.target.value})}
 >
 <option value="">Select...</option>
 <option value="General Science">General Science</option>
 <option value="General Arts">General Arts</option>
 <option value="Business">Business</option>
 <option value="Visual Arts">Visual Arts</option>
 <option value="Home Economics">Home Economics</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">2nd Choice</label>
 <select 
 className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newApplicant.programChoice2}
 onChange={e => setNewApplicant({...newApplicant, programChoice2: e.target.value})}
 >
 <option value="">Select...</option>
 <option value="General Science">General Science</option>
 <option value="General Arts">General Arts</option>
 <option value="Business">Business</option>
 <option value="Visual Arts">Visual Arts</option>
 <option value="Home Economics">Home Economics</option>
 </select>
 </div>
 </div>
 </div>

 </div>
 </ScrollArea>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end gap-3">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleAddApplicant} 
 disabled={!newApplicant.firstName || !newApplicant.lastName || !newApplicant.beceAggregate}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold"
 >
 Submit Application
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
