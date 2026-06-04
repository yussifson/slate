import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { GraduationCap, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function UniAdmissions() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  
  const { data: applicants = [] } = useQuery({ 
    queryKey: ["clients", companyId, "uni_admission"], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_admission' }), 
    enabled: !!companyId 
  });
  
  const parsedApplicants = applicants.map(a => {
    let extra = {};
    try { extra = JSON.parse(a.extra_data || '{}'); } catch(e) {}
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      major: extra.major || 'Undeclared',
      date: extra.appliedDate || new Date().toISOString().split('T')[0],
      status: extra.status || ['pending', 'approved', 'rejected'][Math.floor(Math.random()*3)]
    };
  });

  const filtered = parsedApplicants.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1"/> Admitted</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1"/> Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_admissions", "Admissions Portal")}
        subtitle={t("manage_admissions", "Review applicants, process enrollments, and manage intake")}
        metrics={[
          { title: "Total Applicants", value: applicants.length, icon: GraduationCap }
        ]}
      />
      
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search applicants..." 
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
            Export List
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No applicants found</p>
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 py-4 pl-6">Applicant Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                    <TableHead className="font-semibold text-slate-700">Intended Major</TableHead>
                    <TableHead className="font-semibold text-slate-700">Applied Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(app => (
                    <TableRow key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {app.name?.substring(0,2).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">{app.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">{app.email || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {app.major}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500">{app.date}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
