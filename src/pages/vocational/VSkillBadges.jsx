import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Medal, CheckCircle2, Hexagon, Shield, Zap, Plus} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function VSkillBadges() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [badges, setBadges] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedBadge, setSelectedBadge] = useState(null);

 const fetchBadges = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_badge', user?.company_id);
 setBadges(records);
 if (records.length > 0 && !selectedBadge) {
 setSelectedBadge(records[0]);
}
} catch (error) {
 console.error('Failed to fetch skill badges:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchBadges();
}
}, [user]);

 const filteredBadges = badges.filter(b => 
 b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 b.data?.category?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary via-primary/90 to-slate-900 bg-clip-text text-transparent">
 Skill Badges
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Define, award, and track micro-credentials and specific skill badges.
 </p>
 </div>
 <Button className="rounded-xl -fuchsia-200 bg-primary hover:bg-primary/90 text-white">
 <Plus className="w-4 h-4 mr-2" /> Create Badge
 </Button>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
 <div className="p-4 border-b border-primary/5">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
 <Input 
 placeholder="Search badges..." 
 className="pl-9 h-10 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-primary/30 text-sm">Loading badges...</div>
 ) : filteredBadges.length === 0 ? (
 <div className="p-8 text-center text-slate-400 text-sm">No skill badges found.</div>
 ) : (
 <div className="p-2 grid grid-cols-2 gap-2">
 {filteredBadges.map(badge => (
 <button
 key={badge.id}
 onClick={() => setSelectedBadge(badge)}
 className={`text-center p-4 rounded-2xl transition-all duration-200 flex flex-col items-center gap-2 ${
 selectedBadge?.id === badge.id 
 ? 'bg-primary text-white -fuchsia-500/20' 
 : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200 border border-primary/40'
}`}
 >
 <Hexagon className={`w-10 h-10 ${selectedBadge?.id === badge.id ? 'text-primary/20 fill-primary' : 'text-primary/30 fill-primary/5'}`} />
 <p className="font-bold text-xs line-clamp-2">{badge.title}</p>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
 {selectedBadge ? (
 <>
 <div className="h-48 bg-gradient-to-br from-primary/70 via-primary/90 to-primary relative shrink-0 flex items-center justify-center overflow-hidden">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
 
 {/* Large Badge Icon */}
 <div className="relative z-10 flex flex-col items-center">
 <div className="relative">
 <Hexagon className="w-32 h-32 text-primary/30 fill-primary/80 " strokeWidth={1} />
 <Medal className="w-12 h-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
 </div>
 </div>
 </div>
 
 <ScrollArea className="flex-1">
 <div className="p-8">
 <div className="text-center mb-8">
 <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedBadge.title}</h2>
 <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-2">{selectedBadge.data?.description || 'A recognized micro-credential validating specific technical or soft skills.'}</p>
 <div className="flex justify-center gap-2 mt-4">
 <Badge className="bg-slate-100 text-primary/90 hover:bg-slate-100 border-none">{selectedBadge.data?.category || 'Technical Skill'}</Badge>
 <Badge variant="outline" className="border-primary/20 text-primary">{selectedBadge.data?.points || 0} Points</Badge>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="p-6 rounded-2xl bg-primary/30 border border-primary/40">
 <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Criteria for Awarding</h3>
 <ul className="space-y-3">
 {selectedBadge.data?.criteria?.length > 0 ? (
 selectedBadge.data.criteria.map((criterion, idx) => (
 <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
 <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span>{criterion}</span>
 </li>
 ))
 ) : (
 <li className="text-sm text-slate-500 dark:text-slate-400 italic">No specific criteria defined.</li>
 )}
 </ul>
 </div>

 <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-primary/40 dark:border-primary/40 flex flex-col items-center justify-center text-center">
 <Shield className="w-12 h-12 text-slate-200 mb-3" />
 <h3 className="font-bold text-slate-800">Recipients</h3>
 <p className="text-3xl font-black text-primary my-2">{selectedBadge.data?.recipient_count || 0}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Students have earned this badge</p>
 <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl">View Recipients</Button>
 </div>
 </div>
 </div>
 </ScrollArea>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
 <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
 <Medal className="w-10 h-10 text-primary/30" />
 </div>
 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Badge Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
 Select a skill badge to view its criteria and student recipients.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
