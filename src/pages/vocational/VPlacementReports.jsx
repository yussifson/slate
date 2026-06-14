import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, FileSpreadsheet, Building, Calendar, DollarSign, MessageSquare, Award} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

export default function VPlacementReports() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [reports, setReports] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedReport, setSelectedReport] = useState(null);

 const fetchReports = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_placement_report', user?.company_id);
 setReports(records);
 if (records.length > 0 && !selectedReport) {
 setSelectedReport(records[0]);
}
} catch (error) {
 console.error('Failed to fetch placement reports:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchReports();
}
}, [user]);

 const filteredReports = reports.filter(r => 
 r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 r.data?.employer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 r.data?.position?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 bg-clip-text text-transparent">
 Placement Reports
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Track trainee job placements, compensation, and post-placement feedback.
 </p>
 </div>
 <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl -amber-500/30">
 <FileSpreadsheet className="w-4 h-4 mr-2" /> Log Placement
 </Button>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100/50">
 <div className="p-4 border-b border-amber-50 dark:border-primary/40">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
 <Input 
 placeholder="Search trainees or employers..." 
 className="pl-9 h-10 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 border-amber-100 dark:border-primary/40 rounded-xl focus-visible:ring-amber-600"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-amber-300 text-sm">Loading reports...</div>
 ) : filteredReports.length === 0 ? (
 <div className="p-8 text-center text-slate-400 text-sm">No reports found.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredReports.map(report => (
 <button
 key={report.id}
 onClick={() => setSelectedReport(report)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedReport?.id === report.id 
 ? 'bg-amber-600 text-white -amber-500/20' 
 : 'hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}
 >
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
 selectedReport?.id === report.id ? 'bg-white dark:bg-slate-900/40/20' : 'bg-amber-100 text-amber-600'
}`}>
 <Award className="w-5 h-5" />
 </div>
 <div className="overflow-hidden">
 <p className="font-bold truncate text-sm">{report.title}</p>
 <p className={`text-xs truncate ${selectedReport?.id === report.id ? 'text-amber-200' : 'text-slate-500 dark:text-slate-400'}`}>
 {report.data?.position || 'Unknown Position'}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100/50 overflow-hidden relative">
 {selectedReport ? (
 <>
 <div className="h-32 bg-gradient-to-r from-amber-500 to-orange-500 relative shrink-0">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
 <div className="absolute top-4 right-4">
 <Badge className="bg-white dark:bg-slate-900/40 text-amber-600 hover:bg-slate-50 dark:bg-slate-800/50 border-none font-bold">
 Placed
 </Badge>
 </div>
 </div>
 
 <ScrollArea className="flex-1 -mt-12">
 <div className="px-8 pb-8">
 <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
 <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-1 shrink-0">
 <div className="w-full h-full rounded-2xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-amber-600">
 <Award className="w-10 h-10" />
 </div>
 </div>
 <div className="flex-1 mt-4 sm:mt-12">
 <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedReport.title}</h2>
 <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
 <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-amber-500" /> {selectedReport.data?.employer || 'Unknown Employer'}</span>
 <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-amber-500" /> {selectedReport.data?.placementDate || 'Date Not Set'}</span>
 </div>
 </div>
 </div>

 <div className="mt-8">
 <Tabs defaultValue="overview" className="w-full">
 <TabsList className="bg-amber-50/50 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border border-amber-100 dark:border-primary/40">
 <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-amber-600">Placement Details</TabsTrigger>
 <TabsTrigger value="employer-feedback" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-amber-600">Employer Feedback</TabsTrigger>
 <TabsTrigger value="trainee-feedback" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-amber-600">Trainee Feedback</TabsTrigger>
 </TabsList>
 
 <div className="mt-6">
 <TabsContent value="overview" className="space-y-6 outline-none">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-6 rounded-2xl bg-amber-50/30 border border-amber-100 dark:border-primary/40 space-y-4">
 <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider">Job Information</h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Position Title</p>
 <p className="font-medium text-slate-800 dark:text-slate-200">{selectedReport.data?.position || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
 <p className="font-medium text-slate-800 dark:text-slate-200">{selectedReport.data?.department || 'General'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Contract Type</p>
 <p className="font-medium text-slate-800 dark:text-slate-200">{selectedReport.data?.contractType || 'Full-time'}</p>
 </div>
 </div>
 </div>
 
 <div className="p-6 rounded-2xl bg-amber-50/30 border border-amber-100 dark:border-primary/40 space-y-4">
 <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider">Compensation</h3>
 <div className="flex flex-col h-full justify-center pb-6">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary">
 <DollarSign className="w-6 h-6" />
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Starting Salary</p>
 <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{selectedReport.data?.startingSalary || 'Not Disclosed'}</p>
 </div>
 </div>
 <p className="text-xs text-slate-500 dark:text-slate-400 ml-16">{selectedReport.data?.benefits || 'Standard benefits apply'}</p>
 </div>
 </div>
 </div>
 </TabsContent>
 
 <TabsContent value="employer-feedback" className="outline-none">
 <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/30 border border-primary/40 dark:border-primary/40 dark:border-primary/40">
 <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Supervisor Evaluation</h3>
 <div className="space-y-4">
 <div className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-4 rounded-xl border border-primary/40 dark:border-primary/40 dark:border-primary/40 ">
 <div className="flex justify-between items-center mb-2">
 <p className="font-bold text-slate-800 dark:text-slate-200">Overall Performance</p>
 <Badge className="bg-slate-100 text-primary/90 hover:bg-primary/20 border-none">{selectedReport.data?.employerRating || 'Excellent'}</Badge>
 </div>
 <p className="text-sm text-slate-600 dark:text-slate-400">
 {selectedReport.data?.employerComments || 'The trainee has adapted well to the workplace environment and demonstrates strong foundational skills.'}
 </p>
 </div>
 </div>
 </div>
 </TabsContent>

 <TabsContent value="trainee-feedback" className="outline-none">
 <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/30 border border-primary/40 dark:border-primary/40 dark:border-primary/40">
 <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Graduate Experience</h3>
 <div className="space-y-4">
 <div className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-4 rounded-xl border border-primary/40 dark:border-primary/40 dark:border-primary/40 ">
 <div className="flex justify-between items-center mb-2">
 <p className="font-bold text-slate-800 dark:text-slate-200">Training Relevance</p>
 <Badge className="bg-orange-100 text-orange-700 hover:bg-primary/20 border-none">{selectedReport.data?.trainingRelevanceRating || 'Highly Relevant'}</Badge>
 </div>
 <p className="text-sm text-slate-600 dark:text-slate-400">
 {selectedReport.data?.traineeComments || 'The skills learned during the vocational program were directly applicable to my daily tasks here.'}
 </p>
 </div>
 </div>
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
 <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
 <Award className="w-10 h-10 text-amber-300" />
 </div>
 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Report Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
 Select a placement report to view compensation details and post-placement feedback.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
