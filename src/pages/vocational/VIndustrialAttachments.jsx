import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Link as LinkIcon, Factory, UserCheck, CalendarDays, BookOpen, Plus, Activity} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

export default function VIndustrialAttachments() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [attachments, setAttachments] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedAttachment, setSelectedAttachment] = useState(null);

 const fetchAttachments = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_attachment', user?.company_id);
 setAttachments(records);
 if (records.length > 0 && !selectedAttachment) {
 setSelectedAttachment(records[0]);
}
} catch (error) {
 console.error('Failed to fetch attachments:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchAttachments();
}
}, [user]);

 const filteredAttachments = attachments.filter(a => 
 a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 a.data?.trainee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 a.data?.host_org?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-amber-700 via-amber-800 to-slate-900 bg-clip-text text-transparent">
 Industrial Attachments
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Monitor trainee host organizations, technical tasks, and attachment logs.
 </p>
 </div>
 <Button className="rounded-xl -amber-200 bg-amber-600 hover:bg-amber-700 text-white">
 <Plus className="w-4 h-4 mr-2" /> Assign Trainee
 </Button>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100/50">
 <div className="p-4 border-b border-amber-50">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
 <Input 
 placeholder="Search trainees or orgs..." 
 className="pl-9 h-10 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-amber-100 dark:border-primary/40 rounded-xl focus-visible:ring-amber-600"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-amber-300 text-sm">Loading attachments...</div>
 ) : filteredAttachments.length === 0 ? (
 <div className="p-8 text-center text-slate-400 text-sm">No attachments found.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredAttachments.map(attachment => (
 <button
 key={attachment.id}
 onClick={() => setSelectedAttachment(attachment)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedAttachment?.id === attachment.id 
 ? 'bg-amber-600 text-white -amber-500/20' 
 : 'hover:bg-amber-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}
 >
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
 selectedAttachment?.id === attachment.id ? 'bg-white dark:bg-slate-900/40/20' : 'bg-amber-100 text-amber-600'
}`}>
 <Factory className="w-5 h-5" />
 </div>
 <div className="overflow-hidden">
 <p className="font-bold truncate">{attachment.data?.trainee_name || attachment.title}</p>
 <p className={`text-xs truncate ${selectedAttachment?.id === attachment.id ? 'text-amber-200' : 'text-slate-500 dark:text-slate-400'}`}>
 {attachment.data?.host_org || 'No Org'}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100/50 overflow-hidden relative">
 {selectedAttachment ? (
 <>
 <div className="h-32 bg-gradient-to-r from-amber-600 to-orange-500 relative shrink-0">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
 </div>
 
 <ScrollArea className="flex-1 -mt-12">
 <div className="px-8 pb-8">
 <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
 <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-1 shrink-0">
 <div className="w-full h-full rounded-2xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-amber-600">
 <LinkIcon className="w-12 h-12" />
 </div>
 </div>
 <div className="flex-1 mt-4 sm:mt-12">
 <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedAttachment.data?.trainee_name || selectedAttachment.title}</h2>
 <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
 <span className="flex items-center gap-1.5"><Factory className="w-4 h-4 text-amber-500" /> {selectedAttachment.data?.host_org || 'TBD'}</span>
 <span>•</span>
 <span className="flex items-center gap-1.5">
 <Badge className={selectedAttachment.status === 'Active' ? 'bg-primary' : 'bg-slate-500'}>
 {selectedAttachment.status || 'Pending'}
 </Badge>
 </span>
 </div>
 </div>
 </div>

 <div className="mt-8">
 <Tabs defaultValue="overview" className="w-full">
 <TabsList className="bg-amber-50/50 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border border-amber-100 dark:border-primary/40">
 <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-amber-600">Details</TabsTrigger>
 <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-amber-600">Attendance</TabsTrigger>
 <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-amber-600">Tasks & Skills</TabsTrigger>
 </TabsList>
 
 <div className="mt-6">
 <TabsContent value="overview" className="space-y-6 outline-none">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-5 rounded-2xl bg-amber-50/30 border border-amber-100 space-y-4">
 <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider">Host Information</h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Organization</p>
 <p className="font-medium text-slate-800">{selectedAttachment.data?.host_org || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Industry</p>
 <p className="font-medium text-slate-800">{selectedAttachment.data?.industry || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Technical Mentor</p>
 <p className="font-medium text-slate-800 flex items-center gap-2">
 <UserCheck className="w-4 h-4 text-amber-500" />
 {selectedAttachment.data?.mentor_name || 'Not assigned'}
 </p>
 </div>
 </div>
 </div>
 
 <div className="p-5 rounded-2xl bg-amber-50/30 border border-amber-100 space-y-4">
 <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider">Schedule</h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Start Date</p>
 <p className="font-medium text-slate-800 flex items-center gap-2">
 <CalendarDays className="w-4 h-4 text-amber-500" />
 {selectedAttachment.data?.start_date || 'N/A'}
 </p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400">Expected End Date</p>
 <p className="font-medium text-slate-800 flex items-center gap-2">
 <CalendarDays className="w-4 h-4 text-amber-500" />
 {selectedAttachment.data?.end_date || 'N/A'}
 </p>
 </div>
 </div>
 </div>
 </div>
 </TabsContent>
 
 <TabsContent value="attendance" className="outline-none">
 <div className="p-8 text-center border-2 border-dashed border-amber-100 rounded-2xl bg-amber-50/20">
 <Activity className="w-10 h-10 text-amber-300 mx-auto mb-3" />
 <h4 className="text-slate-700 dark:text-slate-300 font-bold">Attendance Records</h4>
 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">No timesheets or attendance logs submitted for this period.</p>
 <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl">View Timesheets</Button>
 </div>
 </TabsContent>

 <TabsContent value="tasks" className="outline-none">
 <div className="p-8 text-center border-2 border-dashed border-amber-100 rounded-2xl bg-amber-50/20">
 <BookOpen className="w-10 h-10 text-amber-300 mx-auto mb-3" />
 <h4 className="text-slate-700 dark:text-slate-300 font-bold">Technical Tasks Log</h4>
 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">Trainee has not documented any specific technical skills applied.</p>
 <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl">Add Task Log</Button>
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
 <LinkIcon className="w-10 h-10 text-amber-300" />
 </div>
 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Attachment Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
 Select an industrial attachment record to view assignment details and logs.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
