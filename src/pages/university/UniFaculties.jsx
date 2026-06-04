import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Building, Search, Plus, MapPin, Users, BookOpen, MoreVertical } from 'lucide-react';
import { ModuleBanner, ViewModeToggle } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from '@/components/ui/card';

export default function UniFaculties() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  
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
      name: r.case_name || r.name || 'Unnamed Faculty',
      dean: extra.dean || 'Dr. Smith',
      departments: extra.departments || Math.floor(Math.random() * 8) + 2,
      staffCount: extra.staffCount || Math.floor(Math.random() * 100) + 20,
      building: extra.building || 'Main Campus',
      color: extra.color || ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500', 'bg-purple-500'][Math.floor(Math.random() * 6)]
    };
  });

  const filtered = faculties.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_faculties", "Faculties & Departments")}
        subtitle={t("manage_faculties", "Manage university faculties, departments, and leadership")}
        metrics={[
          { title: "Total Faculties", value: faculties.length, icon: Building }
        ]}
      />
      
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search faculties..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 border-slate-200 focus-visible:ring-indigo-500" 
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
            <Plus className="w-4 h-4" /> Add Faculty
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No faculties found</p>
          </div>
        ) : (
          filtered.map(faculty => (
            <Card key={faculty.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className={`h-3 w-full ${faculty.color}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {faculty.name}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> {faculty.building}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Dean</span>
                    <span className="font-medium text-slate-900">{faculty.dean}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-auto">
                  <div className="text-center p-2 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-center text-slate-500 mb-1">
                      <BookOpen className="w-4 h-4 mr-1" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{faculty.departments}</p>
                    <p className="text-xs text-slate-500">Depts</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-center text-slate-500 mb-1">
                      <Users className="w-4 h-4 mr-1" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{faculty.staffCount}</p>
                    <p className="text-xs text-slate-500">Staff</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
