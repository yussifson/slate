import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Briefcase, Building2, MapPin, Calendar, Clock, Plus, Building, UserCircle, Star} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

export default function VInternshipTracking() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [internships, setInternships] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedInternship, setSelectedInternship] = useState(null);

 const fetchInternships = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_internship', user?.company_id);
 setInternships(records);
 if (records.length > 0 && !selectedInternship) {
 setSelectedInternship(records[0]);
}
} catch (error) {
 console.error('Failed to fetch internships:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchInternships();
}
}, [user]);

 const filteredInternships = internships.filter(i => 
 i.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 i.data?.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 i.data?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Internship Tracking
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Manage and track student internship placements and performance.
 </p>
 </div>
 <Button className="rounded-xl -indigo-200">
 <Plus className="w-4 h-4 mr-2" /> New Placement
 </Button>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
 <div className="p-4 border-b border-primary/5">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
 <Input 
 placeholder="Search placements..." 
 className="pl-9 h-10 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-primary/30 text-sm">Loading placements...</div>
 ) : filteredInternships.length === 0 ? (
 <div className="p-8 text-center text-slate-400 text-sm">No internships found.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredInternships.map(internship => (
 <button
 key={internship.id}
 onClick={() => setSelectedInternship(internship)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedInternship?.id === internship.id 
 ? 'bg-primary text-white -indigo-500/20' 
 : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}
 >
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
 selectedInternship?.id === internship.id ? 'bg-white dark:bg-slate-900/40/20' : 'bg-slate-100 text-primary'
}`}>
 <Briefcase className="w-5 h-5" />
 </div>
 <div className="overflow-hidden">
 <p className="font-bold truncate">{internship.data?.student_name || internship.title}</p>
 <p className={`text-xs truncate ${selectedInternship?.id === internship.id ? 'text-primary/20' : 'text-slate-500 dark:text-slate-400'}`}>
 {internship.data?.company_name || 'Unassigned'}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
 {selectedInternship ? (
 <>
 <div className="h-32 bg-gradient-to-r from-primary/90 to-primary relative shrink-0">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
 </div>
 
 <ScrollArea className="flex-1 -mt-12">
 <div className="px-8 pb-8">
 <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
 <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-1 shrink-0">
 <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center text-primary">
 <Briefcase className="w-12 h-12" />
 </div>
 </div>
 <div className="flex-1 mt-4 sm:mt-12">
 <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedInternship.data?.student_name || selectedInternship.title}</h2>
 <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
 <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-primary" /> {selectedInternship.data?.company_name || 'TBD'}</span>
 <span>•</span>
 <span className="flex items-center gap-1.5">
 <Badge className={selectedInternship.status === 'Active' ? 'bg-primary' : selectedInternship.status === 'Completed' ? 'bg-primary' : 'bg-amber-500'}>
 {selectedInternship.status || 'Pending'}
 </Badge>
 </span>
 </div>
 </div>
 </div>

 <div className="mt-8">
 <Tabs defaultValue="overview" className="w-full">
 <TabsList className="bg-slate-500 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border border-primary/40 dark:border-primary/40">
 <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-primary">Overview</TabsTrigger>
 <TabsTrigger value="supervisor" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-primary">Supervisor</TabsTrigger>
 <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-primary">Daily Logs</TabsTrigger>
 </TabsList>
 
 <div className="mt-6">
 <TabsContent value="overview" className="space-y-6 outline-none">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-5 rounded-2xl bg-primary/30 border border-primary/40 space-y-4">
 <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Placement Details</h3>
 <div className="grid grid-cols-2 gap-y-4">
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Start Date</p>
 <p className="font-medium text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary/70" /> {selectedInternship.data?.start_date || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">End Date</p>
 <p className="font-medium text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary/70" /> {selectedInternship.data?.end_date || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
 <p className="font-medium text-slate-800 flex items-center gap-2"><Clock className="w-4 h-4 text-primary/70" /> {selectedInternship.data?.duration_weeks || 'N/A'} weeks</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
 <p className="font-medium text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary/70" /> {selectedInternship.data?.location || 'N/A'}</p>
 </div>
 </div>
 </div>
 
 <div className="p-5 rounded-2xl bg-primary/30 border border-primary/40 space-y-4">
 <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Company Info</h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Company Name</p>
 <p className="font-medium text-slate-800">{selectedInternship.data?.company_name || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Industry</p>
 <p className="font-medium text-slate-800">{selectedInternship.data?.industry || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
 <p className="font-medium text-slate-800">{selectedInternship.data?.department || 'N/A'}</p>
 </div>
 </div>
 </div>
 </div>
 </TabsContent>
 
 <TabsContent value="supervisor" className="outline-none">
 <div className="p-8 text-center border-2 border-dashed border-primary/40 rounded-2xl bg-primary/20">
 <UserCircle className="w-10 h-10 text-primary/30 mx-auto mb-3" />
 <h4 className="text-slate-700 dark:text-slate-300 font-bold">Supervisor Details</h4>
 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">No supervisor information recorded for this placement.</p>
 <Button variant="outline" className="border-primary/20 text-primary hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl">Add Supervisor</Button>
 </div>
 </TabsContent>

 <TabsContent value="logs" className="outline-none">
 <div className="p-8 text-center border-2 border-dashed border-primary/40 rounded-2xl bg-primary/20">
 <Star className="w-10 h-10 text-primary/30 mx-auto mb-3" />
 <h4 className="text-slate-700 dark:text-slate-300 font-bold">No Daily Logs</h4>
 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">Student has not submitted any daily logs yet.</p>
 <Button variant="outline" className="border-primary/20 text-primary hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl">View Requirements</Button>
 </div>
 </TabsContent>
 </div>
 </Tabs>
 </div>
 </div>
 </ScrollArea>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
 <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
 <Briefcase className="w-10 h-10 text-primary/30" />
 </div>
 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Placement Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
 Select an internship placement from the list to view details and performance.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
