import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Loader2, Database, LayoutDashboard, Activity, FileText } from 'lucide-react';
import UnivDashboard from '@/components/universal/UnivDashboard';

export default function OrbitDashboard() {
  const companyId = useCompanyId();
  const { user } = useAuth();

  // Fetch Orbit Config
  const { data: orbitBuildData, isLoading: configLoading } = useQuery({
    queryKey: ['orbit_build_config', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('industry_records')
        .select('data')
        .eq('company_id', companyId)
        .eq('industry', 'orbit_build')
        .eq('record_type', 'workspace_config')
        .single();
      return data?.data || null;
    },
    enabled: !!companyId
  });

  // Fetch all custom data records created in Orbit Mode
  const { data: dynamicRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['orbit_dynamic_records', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('industry_records')
        .select('record_type, id')
        .eq('company_id', companyId)
        .eq('industry', 'orbit_build_data');
      return data || [];
    },
    enabled: !!companyId
  });

  const kpis = useMemo(() => {
    if (!orbitBuildData || !dynamicRecords) return [];

    // Count records per page/module
    const counts = dynamicRecords.reduce((acc, record) => {
      acc[record.record_type] = (acc[record.record_type] || 0) + 1;
      return acc;
    }, {});

    const pages = orbitBuildData.pages || [];
    
    // Create KPIs based on the generated pages
    let generatedKpis = pages.slice(0, 4).map((p, idx) => {
      const icons = [Database, LayoutDashboard, Activity, FileText];
      return {
        title: `Total ${p.page_name}`,
        value: (counts[p.page_name] || 0).toString(),
        change: counts[p.page_name] > 0 ? '+100%' : '0%',
        trend: counts[p.page_name] > 0 ? 'up' : 'neutral',
        icon: icons[idx % icons.length]
      };
    });

    // Fallback if no pages
    if (generatedKpis.length === 0) {
      generatedKpis = [
        { title: 'Data Records', value: '0', change: '0%', trend: 'neutral', icon: Database }
      ];
    }

    return generatedKpis;
  }, [orbitBuildData, dynamicRecords]);

  if (configLoading || recordsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const industryName = orbitBuildData?.industry_name || 'Custom Workspace';

  return (
    <div className="flex-1 h-screen overflow-hidden">
      <UnivDashboard 
        title={`${industryName} Dashboard`}
        subtitle="Real-time overview of your dynamically generated workspace."
        kpis={kpis}
      />
    </div>
  );
}
