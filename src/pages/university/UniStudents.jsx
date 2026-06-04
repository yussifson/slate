import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Users, Search, Plus, Filter, GraduationCap, Mail, Phone, Calendar } from 'lucide-react';
import { ModuleBanner, ViewModeToggle } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UniStudents() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  
  const { data: records = [] } = useQuery({ 
    queryKey: ["clients", companyId, "uni_student"], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student' }), 
    enabled: !!companyId 
  });
  
  const students = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.extra_data || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name || 'Unnamed Student',
      email: r.email || extra.email || 'No email',
      studentId: extra.studentId || `UID${Math.floor(Math.random() * 90000) + 10000}`,
      major: extra.major || 'Computer Science',
      year: extra.year || ['Freshman', 'Sophomore', 'Junior', 'Senior'][Math.floor(Math.random() * 4)],
      gpa: extra.gpa || (Math.random() * 2 + 2).toFixed(2),
      status: extra.status || 'Active'
    };
  });

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_students", "University Students")}
        subtitle={t("manage_uni_students", "Manage student records, majors, and enrollment status")}
        metrics={[
          { title: "Total Students", value: students.length, icon: Users }
        ]}
      />
      
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name or student ID..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 border-slate-200 focus-visible:ring-indigo-500" 
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="gap-2 text-slate-600">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No students found</p>
          </div>
        ) : (
          filtered.map(student => (
            <Card key={student.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-lg ring-4 ring-white shadow-sm">
                      {student.name?.substring(0,2).toUpperCase()}
                    </div>
                    <Badge variant="outline" className={student.status === 'Active' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-600 border-slate-200 bg-slate-50'}>
                      {student.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                    {student.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mb-4">{student.studentId}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-600">
                      <GraduationCap className="w-4 h-4 mr-2 text-indigo-400" />
                      <span className="truncate">{student.major}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                      {student.year}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="w-4 h-4 mr-2 text-indigo-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 border-t border-slate-100 p-3 px-6 flex justify-between items-center">
                  <div className="text-xs text-slate-500 font-medium">GPA</div>
                  <div className="text-sm font-bold text-slate-900">{student.gpa}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
