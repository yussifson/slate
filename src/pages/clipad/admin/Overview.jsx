import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Users, Building2, Layers, Activity, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrbitLoader } from '@/components/ui/orbit-loader';

export default function Overview() {
  const [stats, setStats] = useState({ companies: 0, spaces: 0, users: 0, logins: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: cCount }, 
          { count: sCount }, 
          { count: pCount }, 
          { count: aCount },
          { data: logs },
          { data: comps }
        ] = await Promise.all([
          supabase.from('companies').select('*', { count: 'exact', head: true }),
          supabase.from('clipad_spaces').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('action', 'login'),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('companies').select('*').order('created_at', { ascending: false }).limit(5)
        ]);
        
        setStats({
          companies: cCount || 0,
          spaces: sCount || 0,
          users: pCount || 0,
          logins: aCount || 0
        });
        setRecentActivities(logs || []);
        setRecentCompanies(comps || []);
      } catch (e) {
        console.error("Error fetching admin stats:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center"><OrbitLoader /></div>;

  const statCards = [
    { title: "Total Companies", value: stats.companies, icon: Building2, color: "text-blue-500" },
    { title: "Total Spaces", value: stats.spaces, icon: Layers, color: "text-indigo-500" },
    { title: "Registered Users", value: stats.users, icon: Users, color: "text-purple-500" },
    { title: "Total Logins (Audited)", value: stats.logins, icon: Activity, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome to the CliPad Super Admin dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500" /> Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[350px]">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((log) => (
                  <div key={log.id} className="flex flex-col gap-1 pb-3 border-b border-border last:border-0 last:pb-0">
                    <p className="text-sm font-medium capitalize flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {log.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.details || 'System event triggered.'}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md p-4">
                No recent activities found
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> Recent Companies</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[350px]">
            {recentCompanies.length > 0 ? (
              <div className="space-y-4">
                {recentCompanies.map((company) => (
                  <div key={company.id} className="flex justify-between items-center pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.subdomain ? `${company.subdomain}.optavel.com` : 'No subdomain'}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {company.subscription_plan || 'starter'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md p-4">
                No recent companies found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
