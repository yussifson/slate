import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Building, Search, Plus } from 'lucide-react';
import { ModuleBanner, ViewModeToggle } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";

export default function UniFaculties() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  const { data: records = [] } = useQuery({ 
    queryKey: ["cases", companyId, "uni_faculty"], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_faculty' }), 
    enabled: !!companyId 
  });
  
  const faculties = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.case_name || r.name,
      dean: extra.dean || 'Unknown',
      departments: extra.departments || 0
    };
  });

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_faculties", "Faculties & Departments")}
        subtitle={t("manage_faculties", "Manage university faculties, departments, and deans")}
        metrics={[
          { title: "Total Faculties", value: faculties.length, icon: Building }
        ]}
      />
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search faculties..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4" /> Add Faculty
          </Button>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6">
        <p className="text-muted-foreground">Faculty management UI under construction</p>
      </div>
    </div>
  );
}
