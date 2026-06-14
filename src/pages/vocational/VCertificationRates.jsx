import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, FileCheck, Calendar, Percent, ShieldCheck, TrendingUp, BarChart3} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

export default function VCertificationRates() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [rates, setRates] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedRate, setSelectedRate] = useState(null);

 const fetchRates = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_certificate_rate', user?.company_id);
 setRates(records);
 if (records.length > 0 && !selectedRate) {
 setSelectedRate(records[0]);
}
} catch (error) {
 console.error('Failed to fetch certification rates:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchRates();
}
}, [user]);

 const filteredRates = rates.filter(r => 
 r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 r.data?.period?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary via-primary to-primary/80 bg-clip-text text-transparent">
 Certification Rates
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Analyze pass rates and certification achievements across programs.
 </p>
 </div>
 <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl -emerald-500/30">
 <TrendingUp className="w-4 h-4 mr-2" /> Export Report
 </Button>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
 <div className="p-4 border-b border-primary/5 dark:border-primary/40">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
 <Input 
 placeholder="Search programs..." 
 className="pl-9 h-10 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-primary/30 text-sm">Loading data...</div>
 ) : filteredRates.length === 0 ? (
 <div className="p-8 text-center text-slate-400 text-sm">No data found.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredRates.map(rate => (
 <button
 key={rate.id}
 onClick={() => setSelectedRate(rate)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedRate?.id === rate.id 
 ? 'bg-primary text-white -emerald-500/20' 
 : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}
 >
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
 selectedRate?.id === rate.id ? 'bg-white dark:bg-slate-900/40/20' : 'bg-slate-100 text-primary'
}`}>
 <ShieldCheck className="w-5 h-5" />
 </div>
 <div className="overflow-hidden">
 <p className="font-bold truncate text-sm">{rate.title}</p>
 <p className={`text-xs truncate ${selectedRate?.id === rate.id ? 'text-primary/20' : 'text-slate-500 dark:text-slate-400'}`}>
 {rate.data?.period || 'Academic Year'}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
 {selectedRate ? (
 <>
 <div className="h-32 bg-gradient-to-r from-primary to-primary relative shrink-0">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
 <div className="absolute top-4 right-4">
 <Badge className="bg-white dark:bg-slate-900/40/20 text-white hover:bg-white dark:bg-slate-900/40/30 backdrop-blur-md border-none flex items-center gap-1">
 <Calendar className="w-3 h-3" /> {selectedRate.data?.period || 'Current Period'}
 </Badge>
 </div>
 </div>
 
 <ScrollArea className="flex-1 -mt-12">
 <div className="px-8 pb-8">
 <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
 <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-1 shrink-0">
 <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center text-primary">
 <FileCheck className="w-10 h-10" />
 </div>
 </div>
 <div className="flex-1 mt-4 sm:mt-12">
 <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedRate.title}</h2>
 <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
 <span className="flex items-center gap-1.5 text-primary dark:text-primary/70">
 <Percent className="w-4 h-4" /> Pass Rate: {selectedRate.data?.passRate || '0'}%
 </span>
 </div>
 </div>
 </div>

 <div className="mt-8">
 <Tabs defaultValue="overview" className="w-full">
 <TabsList className="bg-slate-500 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border border-primary/40 dark:border-primary/40">
 <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-primary">Overview Stats</TabsTrigger>
 <TabsTrigger value="breakdown" className="rounded-lg data-[state=active]:bg-white dark:bg-slate-900/40 data-[state=active]:text-primary">Cohort Breakdown</TabsTrigger>
 </TabsList>
 
 <div className="mt-6">
 <TabsContent value="overview" className="space-y-6 outline-none">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border border-primary/40 dark:border-primary/40 dark:border-primary/40 rounded-2xl">
 <CardContent className="p-6 flex flex-col items-center text-center">
 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-primary rounded-full flex items-center justify-center mb-4">
 <BarChart3 className="w-6 h-6" />
 </div>
 <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Enrolled</h4>
 <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{selectedRate.data?.totalEnrolled || 0}</p>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border border-primary/40 dark:border-primary/40 dark:border-primary/40 rounded-2xl">
 <CardContent className="p-6 flex flex-col items-center text-center">
 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-primary rounded-full flex items-center justify-center mb-4">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Certified</h4>
 <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{selectedRate.data?.totalCertified || 0}</p>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border border-primary/20 dark:border-primary/80 rounded-2xl ring-1 ring-primary/20">
 <CardContent className="p-6 flex flex-col items-center text-center">
 <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
 <TrendingUp className="w-6 h-6" />
 </div>
 <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Vs Industry Standard</h4>
 <p className="text-3xl font-black text-primary mt-1">
 {parseFloat(selectedRate.data?.passRate || 0) >= parseFloat(selectedRate.data?.industryStandard || 0) ? '+' : ''}
 {(parseFloat(selectedRate.data?.passRate || 0) - parseFloat(selectedRate.data?.industryStandard || 0)).toFixed(1)}%
 </p>
 </CardContent>
 </Card>
 </div>
 </TabsContent>
 
 <TabsContent value="breakdown" className="outline-none">
 <div className="p-8 text-center border-2 border-dashed border-primary/40 dark:border-primary/40 rounded-2xl">
 <h4 className="text-slate-700 dark:text-slate-300 dark:text-slate-200 font-bold mb-2">Demographic Breakdown</h4>
 <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Detailed view of certification rates by demographic groups and cohorts is not available yet.</p>
 <Button variant="outline" className="border-primary/20 text-primary hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl">
 Generate Breakdown
 </Button>
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
 <FileCheck className="w-10 h-10 text-primary/30" />
 </div>
 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Program Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
 Select a program from the list to view its certification statistics and performance against industry standards.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
