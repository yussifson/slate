import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Briefcase, Users, GraduationCap, TrendingUp, Activity, Wrench, Building2, UserCheck} from 'lucide-react';

export default function VDashboard() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [stats, setStats] = useState({
 trades: 0,
 trainees: 0,
 placements: 0,
 loading: true
});

 useEffect(() => {
 const fetchDashboardStats = async () => {
 if (!user?.company_id) return;
 try {
 const [trades, trainees, placements] = await Promise.all([
 base44.getEntities('voc_trade', user.company_id),
 base44.getEntities('voc_trainee', user.company_id),
 base44.getEntities('voc_placement', user.company_id)
 ]);
 
 setStats({
 trades: trades.length,
 trainees: trainees.length,
 placements: placements.length,
 loading: false
});
} catch (error) {
 console.error('Failed to fetch dashboard stats', error);
 setStats(s => ({ ...s, loading: false}));
}
};

 fetchDashboardStats();
}, [user]);

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Vocational Overview
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Monitor training programs, trainee progress, and placement rates.
 </p>
 </div>
 <div className="flex gap-2">
 <Button variant="outline" className="rounded-xl border-primary/20 text-primary/90 hover:bg-slate-50">
 Download Report
 </Button>
 <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white -emerald-200 ">
 New Placement
 </Button>
 </div>
 </div>

 {/* Top Stat Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="rounded-3xl border-none bg-gradient-to-br from-primary to-primary/90 text-slate-900 dark:text-slate-900 dark:text-white overflow-hidden relative">
 <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
 <Users className="w-32 h-32" />
 </div>
 <CardContent className="p-6 relative z-10">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-primary/10 font-medium mb-1">Total Trainees</p>
 <h3 className="text-4xl font-black">{stats.loading ? '...' : stats.trainees}</h3>
 </div>
 <div className="p-3 bg-white dark:bg-slate-900/40/20 rounded-2xl backdrop-blur-sm">
 <Users className="w-6 h-6 text-white" />
 </div>
 </div>
 <div className="mt-6 flex items-center gap-2 text-sm text-primary/10">
 <TrendingUp className="w-4 h-4 text-primary/30" />
 <span><strong className="text-white">+12%</strong> from last cohort</span>
 </div>
 </CardContent>
 </Card>

 <Card className="rounded-3xl border-none bg-gradient-to-br from-primary to-primary/90 text-slate-900 dark:text-slate-900 dark:text-white overflow-hidden relative">
 <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
 <Briefcase className="w-32 h-32" />
 </div>
 <CardContent className="p-6 relative z-10">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-primary/10 font-medium mb-1">Active Trades</p>
 <h3 className="text-4xl font-black">{stats.loading ? '...' : stats.trades}</h3>
 </div>
 <div className="p-3 bg-white dark:bg-slate-900/40/20 rounded-2xl backdrop-blur-sm">
 <Wrench className="w-6 h-6 text-white" />
 </div>
 </div>
 <div className="mt-6 flex items-center gap-2 text-sm text-primary/10">
 <Activity className="w-4 h-4" />
 <span>Across 4 departments</span>
 </div>
 </CardContent>
 </Card>

 <Card className="rounded-3xl border-none bg-gradient-to-br from-primary to-primary/90 text-slate-900 dark:text-slate-900 dark:text-white overflow-hidden relative">
 <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
 <Building2 className="w-32 h-32" />
 </div>
 <CardContent className="p-6 relative z-10">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-primary/10 font-medium mb-1">Job Placements</p>
 <h3 className="text-4xl font-black">{stats.loading ? '...' : stats.placements}</h3>
 </div>
 <div className="p-3 bg-white dark:bg-slate-900/40/20 rounded-2xl backdrop-blur-sm">
 <UserCheck className="w-6 h-6 text-white" />
 </div>
 </div>
 <div className="mt-6 flex items-center gap-2 text-sm text-primary/10">
 <TrendingUp className="w-4 h-4 text-white" />
 <span><strong className="text-white">85%</strong> placement rate</span>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Secondary Section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 dark:ring-slate-800">
 <CardHeader>
 <CardTitle className="text-xl flex items-center gap-2">
 <GraduationCap className="w-5 h-5 text-primary" /> Recent Graduates
 </CardTitle>
 <CardDescription>Trainees who recently completed their slates</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <GraduationCap className="w-12 h-12 text-slate-200 dark:text-slate-700 dark:text-slate-300 mb-3" />
 <p className="text-slate-500 dark:text-slate-400 font-medium">No recent graduates to display.</p>
 <p className="text-sm text-slate-400 mt-1">Completion data will appear here once trainees finish their final assessments.</p>
 </div>
 </CardContent>
 </Card>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 dark:ring-slate-800">
 <CardHeader>
 <CardTitle className="text-xl flex items-center gap-2">
 <Building2 className="w-5 h-5 text-primary" /> Partner Employers
 </CardTitle>
 <CardDescription>Top companies hiring our trainees</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <Building2 className="w-12 h-12 text-slate-200 dark:text-slate-700 dark:text-slate-300 mb-3" />
 <p className="text-slate-500 dark:text-slate-400 font-medium">No employer data available.</p>
 <p className="text-sm text-slate-400 mt-1">Add partner companies to track placements.</p>
 <Button variant="outline" className="mt-4 rounded-xl">Add Employer</Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
