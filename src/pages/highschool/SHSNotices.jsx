import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Megaphone, Calendar, Users, Eye} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';

export default function SHSNotices() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [notices, setNotices] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [newNotice, setNewNotice] = useState({
 title: '',
 content: '',
 targetAudience: 'All', // All, Students, Parents, Teachers
 priority: 'Normal', // Normal, High, Urgent
 expiryDate: (() => {
 const d = new Date();
 d.setDate(d.getDate() + 30);
 return d.toISOString().split('T')[0];
})()
});

 const fetchNotices = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_notice', user?.company_id);
 // Sort newest first
 records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
 setNotices(records);
} catch (error) {
 console.error('Failed to fetch notices:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchNotices();
}
}, [user]);

 const handlePublish = async () => {
 try {
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_notice',
 title: newNotice.title,
 case_number: `NTC-${Math.floor(Math.random() * 10000)}`,
 status: 'Active',
 data: {
 ...newNotice,
 publishDate: new Date().toISOString().split('T')[0],
 authorName: user?.full_name || 'Admin'
}
};
 
 await base44.createEntity(payload);
 setIsModalOpen(false);
 setNewNotice({ title: '', content: '', targetAudience: 'All', priority: 'Normal', expiryDate: new Date().toISOString().split('T')[0]});
 fetchNotices();
} catch (error) {
 console.error('Failed to publish notice:', error);
}
};

 const updateStatus = async (id, status) => {
 try {
 await base44.updateEntity(id, { status});
 fetchNotices();
} catch (error) {
 console.error('Failed to update notice:', error);
}
};

 const filteredNotices = notices.filter(n => 
 n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 n.data?.content?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Notice Board
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Publish announcements and alerts to students, parents, and staff.
 </p>
 </div>
 
 <Button onClick={() => setIsModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> New Announcement
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-slate-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Megaphone className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Active Notices</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{notices.filter(n => n.status === 'Active').length}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Broadcast Feed</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search announcements..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading notices...</div>
 ) : filteredNotices.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <Megaphone className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No announcements published</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Create a new broadcast to share information.</p>
 </div>
 ) : (
 <div className="divide-y divide-slate-100">
 {filteredNotices.map((notice) => (
 <div key={notice.id} className={`p-6 transition-colors ${notice.status === 'Archived' ? 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 opacity-70' : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50'}`}>
 <div className="flex justify-between items-start gap-4">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <Badge variant="outline" className={`border-none ${
 notice.data?.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 
 notice.data?.priority === 'High' ? 'bg-amber-100 text-amber-700' : 
 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}>
 {notice.data?.priority} Priority
 </Badge>
 {notice.status === 'Archived' && (
 <Badge variant="outline" className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none">Archived</Badge>
 )}
 </div>
 
 <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">{notice.title}</h4>
 <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{notice.data?.content}</p>
 
 <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Published: {notice.data?.publishDate}</span>
 <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Audience: {notice.data?.targetAudience}</span>
 <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Author: {notice.data?.authorName}</span>
 </div>
 </div>
 
 <div className="flex flex-col items-end gap-2 shrink-0">
 {notice.status === 'Active' ? (
 <Button 
 size="sm" 
 variant="outline" 
 onClick={() => updateStatus(notice.id, 'Archived')}
 className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-primary/40 dark:border-primary/40"
 >
 Archive
 </Button>
 ) : (
 <Button 
 size="sm" 
 variant="outline" 
 onClick={() => updateStatus(notice.id, 'Active')}
 className="text-primary hover:bg-slate-50 dark:bg-slate-800/50 border-primary/20"
 >
 Republish
 </Button>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
 <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black">Publish Notice</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Create a new announcement for the digital noticeboard.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Announcement Title</label>
 <Input 
 placeholder="e.g. End of Term Arrangements"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl font-bold"
 value={newNotice.title}
 onChange={e => setNewNotice({...newNotice, title: e.target.value})}
 />
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Content</label>
 <textarea 
 placeholder="Write the full announcement here..."
 className="w-full h-32 rounded-xl border border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary resize-none text-sm"
 value={newNotice.content}
 onChange={e => setNewNotice({...newNotice, content: e.target.value})}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Target Audience</label>
 <select 
 className="w-full h-11 rounded-xl border border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newNotice.targetAudience}
 onChange={e => setNewNotice({...newNotice, targetAudience: e.target.value})}
 >
 <option value="All">All Users</option>
 <option value="Students Only">Students Only</option>
 <option value="Parents Only">Parents Only</option>
 <option value="Staff Only">Staff Only</option>
 <option value="Boarders Only">Boarders Only</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Priority Level</label>
 <select 
 className="w-full h-11 rounded-xl border border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newNotice.priority}
 onChange={e => setNewNotice({...newNotice, priority: e.target.value})}
 >
 <option value="Normal">Normal</option>
 <option value="High">High</option>
 <option value="Urgent">Urgent (Red Alert)</option>
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Auto-Archive Date</label>
 <Input 
 type="date"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl h-11 w-full sm:w-1/2"
 value={newNotice.expiryDate}
 onChange={e => setNewNotice({...newNotice, expiryDate: e.target.value})}
 />
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3">
 <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handlePublish} 
 disabled={!newNotice.title || !newNotice.content}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold px-6"
 >
 Publish Now
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
