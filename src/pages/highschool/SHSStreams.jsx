import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Layers, GitMerge} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';

export default function SHSStreams() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [streams, setStreams] = useState([]);
 const [programmes, setProgrammes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newStream, setNewStream] = useState({
 name: '',
 programmeId: '',
 description: ''
});

 const fetchData = async () => {
 setLoading(true);
 try {
 const [streamData, progData] = await Promise.all([
 base44.getEntities('shs_stream', user?.company_id),
 base44.getEntities('shs_programme', user?.company_id)
 ]);
 setStreams(streamData);
 setProgrammes(progData);
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

 const handleAddStream = async () => {
 try {
 const selectedProg = programmes.find(p => p.id === newStream.programmeId);
 
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_stream',
 title: newStream.name,
 case_number: `STRM-${Math.floor(Math.random() * 1000)}`,
 status: 'Active',
 data: {
 ...newStream,
 programmeName: selectedProg?.title || 'General'
}
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewStream({ name: '', programmeId: '', description: ''});
 fetchData();
} catch (error) {
 console.error('Failed to add stream:', error);
}
};

 const filteredStreams = streams.filter(s => 
 s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 s.data?.programmeName?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Academic Streams
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Manage class divisions and specialized sub-tracks (e.g. Science A, Arts B).
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Create Stream
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {loading ? (
 <div className="col-span-full p-12 text-center text-slate-400 dark:text-slate-500 dark:text-muted-foreground">Loading streams...</div>
 ) : filteredStreams.length === 0 ? (
 <div className="col-span-full p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary mx-auto flex items-center justify-center mb-4">
 <GitMerge className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-foreground dark:text-foreground">No streams defined</h3>
 <p className="text-sm text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground">Create streams to organize classes within programmes.</p>
 </div>
 ) : (
 filteredStreams.map(strm => (
 <Card key={strm.id} className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 hover:ring-primary/30 dark:hover:ring-primary/30 transition-all group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6">
 <div className="flex justify-between items-start mb-4">
 <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary flex items-center justify-center text-primary dark:text-primary/70">
 <Layers className="w-5 h-5" />
 </div>
 <Badge variant="outline" className="bg-slate-50 dark:bg-secondary/50 text-primary/90 border-primary/20">
 {strm.status}
 </Badge>
 </div>
 
 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{strm.title}</h3>
 <p className="text-xs font-semibold text-primary dark:text-primary/70 uppercase tracking-wider mb-4 tracking-[0.04em]">{strm.data?.programmeName}</p>
 
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground line-clamp-2 min-h-[32px] tracking-[0.04em]">
 {strm.data?.description || 'No description provided.'}
 </p>
 
 <div className="mt-5 pt-4 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-2">
 <Button variant="ghost" size="sm" className="text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-secondary/50 dark:bg-secondary font-semibold w-full">
 View Classes
 </Button>
 </div>
 </CardContent>
 </Card>
 ))
 )}
 </div>

 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black tracking-[-0.02em]">Add Stream</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Define a new class division under a programme.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Stream Name</label>
 <Input 
 placeholder="e.g. Science A"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newStream.name}
 onChange={e => setNewStream({...newStream, name: e.target.value})}
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Parent Programme</label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newStream.programmeId}
 onChange={e => setNewStream({...newStream, programmeId: e.target.value})}
 >
 <option value="">Select Programme...</option>
 {programmes.map(p => (
 <option key={p.id} value={p.id}>{p.title}</option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Description</label>
 <textarea 
 className="w-full h-24 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary resize-none text-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 placeholder="Brief description..."
 value={newStream.description}
 onChange={e => setNewStream({...newStream, description: e.target.value})}
 />
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-card/40 dark:bg-card border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-foreground">
 Cancel
 </Button>
 <Button 
 onClick={handleAddStream} 
 disabled={!newStream.name || !newStream.programmeId}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold"
 >
 Save Stream
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
