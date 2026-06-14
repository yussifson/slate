import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Briefcase, Users, FileText, Settings, ArrowRight} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter} from '@/components/ui/dialog';
import { Label} from '@/components/ui/label';

export default function VTrades() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [trades, setTrades] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [newTrade, setNewTrade] = useState({ title: '', industry: '', duration: '', description: ''});
 const [selectedTrade, setSelectedTrade] = useState(null);

 const fetchTrades = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_trade', user?.company_id);
 setTrades(records);
 if (records.length > 0 && !selectedTrade) {
 setSelectedTrade(records[0]);
}
} catch (error) {
 console.error('Failed to fetch trades:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchTrades();
}
}, [user]);

 const handleCreateTrade = async () => {
 if (!newTrade.title) return;
 try {
 const created = await base44.createEntity('voc_trade', {
 title: newTrade.title,
 data: {
 industry: newTrade.industry,
 duration: newTrade.duration,
 description: newTrade.description,
}
}, user?.company_id);
 setTrades([...trades, created]);
 setIsDialogOpen(false);
 setNewTrade({ title: '', industry: '', duration: '', description: ''});
 setSelectedTrade(created);
} catch (error) {
 console.error('Failed to create trade:', error);
}
};

 const filteredTrades = trades.filter(t => 
 t.title?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Vocational Trades
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Manage offered vocational trades, industries, and program lengths.
 </p>
 </div>
 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
 <DialogTrigger asChild>
 <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl -indigo-200 ">
 <Plus className="w-4 h-4 mr-2" /> Add Trade
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-[425px] rounded-2xl">
 <DialogHeader>
 <DialogTitle>Add New Trade</DialogTitle>
 </DialogHeader>
 <div className="grid gap-4 py-4">
 <div className="space-y-2">
 <Label htmlFor="title">Trade Name</Label>
 <Input id="title" placeholder="e.g. Carpentry" value={newTrade.title} onChange={e => setNewTrade({...newTrade, title: e.target.value})} className="rounded-xl" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="industry">Industry</Label>
 <Input id="industry" placeholder="e.g. Construction" value={newTrade.industry} onChange={e => setNewTrade({...newTrade, industry: e.target.value})} className="rounded-xl" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="duration">Duration (Months)</Label>
 <Input id="duration" placeholder="e.g. 12" value={newTrade.duration} onChange={e => setNewTrade({...newTrade, duration: e.target.value})} className="rounded-xl" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Input id="description" placeholder="Short description" value={newTrade.description} onChange={e => setNewTrade({...newTrade, description: e.target.value})} className="rounded-xl" />
 </div>
 </div>
 <DialogFooter>
 <Button onClick={handleCreateTrade} className="bg-primary hover:bg-primary/90 rounded-xl">Save Trade</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 {/* Left Panel: Trade List */}
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
 <div className="p-4 border-b border-primary/5 dark:border-primary/40">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
 <Input 
 placeholder="Search trades..." 
 className="pl-9 h-10 bg-slate-500 dark:bg-slate-800/50 border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-primary/30 text-sm">Loading trades...</div>
 ) : filteredTrades.length === 0 ? (
 <div className="p-8 text-center text-slate-400 text-sm">No trades found.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredTrades.map(trade => (
 <button
 key={trade.id}
 onClick={() => setSelectedTrade(trade)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedTrade?.id === trade.id 
 ? 'bg-primary text-white -indigo-500/20' 
 : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}
 >
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
 selectedTrade?.id === trade.id ? 'bg-white dark:bg-slate-900/40/20' : 'bg-slate-100 dark:bg-slate-800 text-primary'
}`}>
 <Briefcase className="w-5 h-5" />
 </div>
 <div className="overflow-hidden">
 <p className="font-bold truncate">{trade.title}</p>
 <p className={`text-xs truncate ${selectedTrade?.id === trade.id ? 'text-primary/20' : 'text-slate-500 dark:text-slate-400'}`}>
 {trade.data?.industry || 'General'}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 {/* Right Panel: Trade Details */}
 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
 {selectedTrade ? (
 <>
 <div className="h-32 bg-gradient-to-r from-primary to-primary relative shrink-0 flex items-center px-8">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
 <div className="relative z-10 flex items-center gap-6 translate-y-10">
 <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-2 shrink-0">
 <div className="w-full h-full rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center text-primary">
 <Briefcase className="w-10 h-10" />
 </div>
 </div>
 </div>
 </div>
 
 <ScrollArea className="flex-1 mt-12">
 <div className="px-8 pb-8">
 <div className="flex justify-between items-start">
 <div>
 <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedTrade.title}</h2>
 <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
 <Badge variant="outline" className="border-primary/20 bg-slate-50 dark:bg-slate-800/50 text-primary/90 dark:bg-slate-800 dark:text-primary/70">
 {selectedTrade.data?.industry || 'General Industry'}
 </Badge>
 <span>•</span>
 <span className="flex items-center gap-1.5">
 {selectedTrade.data?.duration ? `${selectedTrade.data.duration} Months` : 'Duration TBD'}
 </span>
 </div>
 </div>
 <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary hover:bg-slate-50">
 <Settings className="w-4 h-4 mr-2" /> Edit Trade
 </Button>
 </div>

 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="p-6 rounded-2xl bg-slate-500 dark:bg-slate-800/50 border border-primary/40 dark:border-primary/40">
 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
 <FileText className="w-5 h-5 text-primary" /> Description
 </h3>
 <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
 {selectedTrade.data?.description || 'No description provided for this trade. Add a description to help trainees understand the scope and objectives.'}
 </p>
 </div>

 <div className="p-6 rounded-2xl bg-slate-500 dark:bg-slate-800/50 border border-primary/40 dark:border-primary/40">
 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
 <Users className="w-5 h-5 text-primary" /> Trainee Stats
 </h3>
 <div className="space-y-4">
 <div className="flex justify-between items-center pb-2 border-b border-primary/40 dark:border-primary/40">
 <span className="text-slate-600 dark:text-slate-400 text-sm">Active Trainees</span>
 <span className="font-bold text-slate-800 dark:text-slate-100">--</span>
 </div>
 <div className="flex justify-between items-center pb-2 border-b border-primary/40 dark:border-primary/40">
 <span className="text-slate-600 dark:text-slate-400 text-sm">Graduates</span>
 <span className="font-bold text-slate-800 dark:text-slate-100">--</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </ScrollArea>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
 <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center mb-6">
 <Briefcase className="w-10 h-10 text-primary/30" />
 </div>
 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No Trade Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 max-w-sm mt-2">
 Select a trade from the list to view details or add a new one.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
