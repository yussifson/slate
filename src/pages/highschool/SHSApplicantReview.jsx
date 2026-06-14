import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, FileText, CheckCircle2, XCircle, Award, Target, ArrowRight} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSApplicantReview() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [applicants, setApplicants] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedApplicant, setSelectedApplicant] = useState(null);

 const fetchApplicants = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_applicant', user?.company_id);
 const pending = records.filter(a => a.status === 'Pending');
 setApplicants(pending);
 if (pending.length > 0 && !selectedApplicant) {
 setSelectedApplicant(pending[0]);
}
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

 const handleDecision = async (decision) => {
 if (!selectedApplicant) return;
 try {
 await base44.updateEntity(selectedApplicant.id, { status: decision});
 setSelectedApplicant(null);
 await fetchApplicants();
} catch (error) {
 console.error('Failed to process decision:', error);
}
};

 const filteredApplicants = applicants.filter(a => 
 a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 a.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Applicant Review
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Review pending applications and make admission decisions based on cut-off aggregates.
 </p>
 </div>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 {/* Left Panel: Pending Applicants */}
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
 <div className="p-4 border-b border-primary/5">
 <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center justify-between">
 Pending Review <Badge className="bg-amber-100 text-amber-700">{applicants.length}</Badge>
 </h3>
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary dark:text-primary" />
 <Input 
 placeholder="Search applicants..." 
 className="pl-9 h-10 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-primary/30 text-sm">Loading applications...</div>
 ) : filteredApplicants.length === 0 ? (
 <div className="p-8 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">No pending applications found.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredApplicants.map(app => (
 <button
 key={app.id}
 onClick={() => setSelectedApplicant(app)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedApplicant?.id === app.id 
 ? 'bg-primary dark:bg-primary text-white -emerald-500/20' 
 : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}
 >
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
 selectedApplicant?.id === app.id ? 'bg-white dark:bg-slate-900/40 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary/70'
}`}>
 {app.data?.beceAggregate || '?'}
 </div>
 <div className="overflow-hidden">
 <p className="font-bold truncate">{app.title}</p>
 <p className={`text-xs truncate ${selectedApplicant?.id === app.id ? 'text-primary/20 dark:text-primary/80' : 'text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400'}`}>
 {app.case_number} • {app.data?.programChoice1}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 {/* Right Panel: Detailed Review */}
 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
 {selectedApplicant ? (
 <ScrollArea className="flex-1">
 <div className="p-8 max-w-3xl mx-auto space-y-8">
 
 {/* Header */}
 <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-6">
 <div>
 <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedApplicant.title}</h2>
 <div className="flex items-center gap-3 mt-2 text-sm font-medium">
 <Badge variant="outline" className="border-primary/20 dark:border-slate-600 text-primary dark:text-primary/70 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">{selectedApplicant.case_number}</Badge>
 <span className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Applied: {new Date(selectedApplicant.created_date).toLocaleDateString()}</span>
 </div>
 </div>
 <div className="text-right">
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">BECE Aggregate</p>
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 text-2xl font-black ">
 {selectedApplicant.data?.beceAggregate || 'N/A'}
 </div>
 </div>
 </div>

 {/* Profile Grid */}
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-4">
 <h3 className="font-bold text-primary dark:text-primary/70 flex items-center gap-2">
 <FileText className="w-4 h-4" /> Applicant Details
 </h3>
 <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-800 space-y-4">
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Gender</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{selectedApplicant.data?.gender || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Date of Birth</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{selectedApplicant.data?.dob || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">JHS Attended</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{selectedApplicant.data?.jhsAttended || 'N/A'}</p>
 </div>
 </div>
 </div>
 
 <div className="space-y-4">
 <h3 className="font-bold text-primary flex items-center gap-2">
 <Target className="w-4 h-4" /> Programme Choices
 </h3>
 <div className="p-5 rounded-2xl bg-slate-500 border border-slate-200 space-y-4">
 <div>
 <p className="text-xs text-primary/70 font-bold uppercase tracking-wider">1st Choice</p>
 <p className="font-bold text-primary/70 text-lg">{selectedApplicant.data?.programChoice1 || 'None'}</p>
 </div>
 <div className="pt-3 border-t border-slate-200">
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">2nd Choice</p>
 <p className="font-medium text-slate-700 dark:text-slate-300 dark:text-slate-200">{selectedApplicant.data?.programChoice2 || 'None'}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Decision Zone */}
 <div className="mt-8 p-6 rounded-2xl border-2 border-dashed border-primary/20 dark:border-slate-600 bg-primary/30 dark:bg-slate-800/30">
 <h3 className="font-bold text-slate-800 dark:text-slate-100 text-center mb-6">Make Admission Decision</h3>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Button 
 onClick={() => handleDecision('Rejected')}
 className="h-12 px-8 rounded-xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 "
 >
 <XCircle className="w-5 h-5 mr-2" /> Reject Application
 </Button>
 <Button 
 onClick={() => handleDecision('Admitted')}
 className="h-12 px-8 rounded-xl bg-primary hover:bg-primary text-white -emerald-500/20 font-bold"
 >
 <CheckCircle2 className="w-5 h-5 mr-2" /> Admit to 1st Choice
 </Button>
 </div>
 <p className="text-center text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-4">
 Once a decision is made, the applicant will be removed from this pending queue.
 </p>
 </div>

 </div>
 </ScrollArea>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
 <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center mb-6">
 <FileText className="w-10 h-10 text-primary/30" />
 </div>
 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No Applicant Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 max-w-sm mt-2">
 Select a pending applicant from the queue to review their BECE aggregate and programme choices.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
