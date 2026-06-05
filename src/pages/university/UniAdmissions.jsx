import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { GraduationCap, Search, Filter, CheckCircle, XCircle, Clock, Plus, Sparkles, Mail, Eye, Calendar, CalendarCheck } from 'lucide-react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function UniAdmissions() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('directory'); // directory, add, interviews
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', major: 'Computer Science', gpa: '3.90', statement: '' });

  const { data: applicants = [], refetch } = useQuery({ 
    queryKey: ["clients", companyId, "uni_admission"], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_admission' }), 
    enabled: !!companyId 
  });

  const createApplicantMutation = useMutation({
    mutationFn: (newApplicant) => base44.entities.Client.create(newApplicant),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients", companyId, "uni_admission"]);
      refetch();
      setActiveTab('directory');
      setFormData({ name: '', email: '', major: 'Computer Science', gpa: '3.90', statement: '' });
    }
  });

  const parsedApplicants = applicants.map(a => {
    let extra = {};
    try { extra = JSON.parse(a.extra_data || '{}'); } catch(e) {}
    return {
      id: a.id,
      name: a.name || 'Unnamed Applicant',
      email: a.email || extra.email || 'No email',
      major: extra.major || 'Computer Science',
      date: extra.appliedDate || new Date().toISOString().split('T')[0],
      gpa: extra.gpa || '3.80',
      statement: extra.statement || 'No statement submitted.',
      status: a.status || extra.status || 'Pending'
    };
  });

  const filtered = parsedApplicants.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreateApplicant = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    createApplicantMutation.mutate({
      company_id: companyId,
      name: formData.name,
      email: formData.email,
      type: 'uni_admission',
      extra_data: JSON.stringify({
        major: formData.major,
        gpa: formData.gpa,
        statement: formData.statement,
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
      })
    });
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'admitted':
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1"/> Admitted</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1"/> Reviewing</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_admissions", "Admissions & Intake Board")}
        subtitle="Process freshman candidate profiles, review personal statements, and extend academic offers."
        metrics={[
          { title: "Total Candidates", value: applicants.length, icon: GraduationCap }
        ]}
      />

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => { setActiveTab('directory'); setSelectedApplicant(null); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'directory' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Applicants Directory
        </button>
        <button
          onClick={() => setActiveTab('interviews')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'interviews' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Interview Schedules
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'add' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Log Candidate Application
        </button>
      </div>

      {activeTab === 'directory' && !selectedApplicant && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search candidates by name..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 border-slate-200 dark:border-slate-800 focus-visible:ring-primary" 
              />
            </div>
            <Button size="sm" variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filter Majors</Button>
          </div>

          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-100">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-bold">No applicant profiles logged yet</p>
                  <p className="text-sm mt-1">Use the "Log Candidate Application" tab to add records.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700 py-4 pl-6">Candidate Name</TableHead>
                        <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                        <TableHead className="font-semibold text-slate-700">Intended Major</TableHead>
                        <TableHead className="font-semibold text-slate-700">Entrance GPA</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(app => (
                        <TableRow key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {app.name?.substring(0,2).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{app.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">{app.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                              {app.major}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-700">{app.gpa}</TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell className="text-right pr-6">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedApplicant(app)} className="text-primary hover:text-primary/80 gap-1 font-bold">
                              <Eye className="w-4 h-4" /> Review
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
      )}

      {activeTab === 'directory' && selectedApplicant && (
        <Card className="border-slate-100 shadow-md">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 pb-6">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                  {selectedApplicant.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-xl font-black">{selectedApplicant.name}</CardTitle>
                  <CardDescription>Major: {selectedApplicant.major} · Entry GPA: {selectedApplicant.gpa}</CardDescription>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedApplicant(null)}>Close Profile</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Personal Statement / Essay</h4>
              <p className="text-xs text-slate-600 bg-slate-50 border p-4 rounded-xl leading-relaxed mt-2">{selectedApplicant.statement}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Admit Candidate</Button>
              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 font-bold border-red-200">Reject Application</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'interviews' && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> Interview Matrix</CardTitle>
            <CardDescription>Scheduled entrance evaluation sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 border rounded-2xl flex items-center gap-3">
              <CalendarCheck className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">Interviews scheduled for tomorrow</p>
                <p className="text-[10px] text-slate-500">Dr. Alan Turing with candidate John Doe regarding Computer Science admission offer.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'add' && (
        <Card className="border-slate-100 shadow-sm max-w-xl">
          <CardHeader>
            <CardTitle>Log Candidate Application</CardTitle>
            <CardDescription>Submit admission candidacy data.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateApplicant} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Applicant Name</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Rosalind Franklin" 
                  className="mt-1" 
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Contact Email</label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="e.g. rfranklin@gmail.com" 
                  className="mt-1" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Intended Major</label>
                  <select 
                    value={formData.major} 
                    onChange={e => setFormData({ ...formData, major: e.target.value })}
                    className="w-full mt-1 border rounded-md p-2 bg-white text-sm"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Applied Physics">Applied Physics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">High School GPA</label>
                  <Input 
                    type="number"
                    step="0.01" 
                    value={formData.gpa} 
                    onChange={e => setFormData({ ...formData, gpa: e.target.value })} 
                    className="mt-1" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Personal Statement</label>
                <textarea 
                  value={formData.statement} 
                  onChange={e => setFormData({ ...formData, statement: e.target.value })} 
                  rows={4}
                  placeholder="Explain your academic pursuits..."
                  className="w-full mt-1 border rounded-md p-3 bg-white text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white w-full">Submit Application</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
