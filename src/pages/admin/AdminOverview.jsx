import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Scale, Users, Building2, DollarSign, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminOverview() {
  const [companies, setCompanies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: compData } = await supabase.from('companies').select('*');
        if (compData) setCompanies(compData);

        const { data: profData } = await supabase.from('profiles').select('*');
        if (profData) setProfiles(profData);

        const { data: caseData } = await supabase.from('legal_cases').select('*');
        if (caseData) setCases(caseData);
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeFirmsCount = companies.filter(c => c.status === 'active').length;
  const totalUsersCount = profiles.length;
  const totalCasesCount = cases.length;
  
  const mrr = companies
    .filter(c => c.subscription_status === 'active' && c.status === 'active')
    .reduce((sum, c) => {
      const planPrice = c.subscription_plan === 'starter' ? 29 : c.subscription_plan === 'professional' ? 79 : c.subscription_plan === 'enterprise' ? 199 : 0;
      return sum + planPrice;
    }, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Platform Overview" 
        subtitle="Global metrics and MRR across the Optalflow ecosystem." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total MRR</p>
            <p className="text-3xl font-black text-slate-900">${mrr}</p>
            <p className="text-xs text-green-600 mt-2 font-semibold">Active Subscriptions</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Firms</p>
            <p className="text-3xl font-black text-slate-900">{companies.length}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">{activeFirmsCount} Active / {companies.filter(c => c.subscription_status === 'trial').length} Trials</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Users</p>
            <p className="text-3xl font-black text-slate-900">{totalUsersCount}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Across all firms</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Cases</p>
            <p className="text-3xl font-black text-slate-900">{totalCasesCount}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Platform-wide data</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
