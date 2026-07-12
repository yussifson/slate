import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Users, Building2, Layers, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrbitLoader } from '@/components/ui/orbit-loader';

export default function Overview() {
  const [stats, setStats] = useState({ companies: 0, spaces: 0, users: 0, logins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [{ count: cCount }, { count: sCount }, { count: pCount }, { count: aCount }] = await Promise.all([
          supabase.from('companies').select('*', { count: 'exact', head: true }),
          supabase.from('clipad_spaces').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('action', 'login')
        ]);
        setStats({
          companies: cCount || 0,
          spaces: sCount || 0,
          users: pCount || 0,
          logins: aCount || 0
        });
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
        <Card>
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md">
            Chart integration coming soon
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Company Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md">
            Chart integration coming soon
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
