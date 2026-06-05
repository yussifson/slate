import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Users, Search, Plus, Filter, GraduationCap, Mail, Calendar, Sparkles, BookOpen, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UniStudents() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('directory'); // directory, add, standing
  const [formData, setFormData] = useState({ name: '', email: '', major: 'Computer Science', year: 'Freshman', gpa: '3.80' });

  const { data: records = [], refetch } = useQuery({ 
    queryKey: ["clients", companyId, "uni_student"], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student' }), 
    enabled: !!companyId 
  });

  const createStudentMutation = useMutation({
    mutationFn: (newStudent) => base44.entities.Client.create(newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients", companyId, "uni_student"]);
      refetch();
      setActiveTab('directory');
      setFormData({ name: '', email: '', major: 'Computer Science', year: 'Freshman', gpa: '3.80' });
    }
  });

  const students = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.extra_data || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name || 'Unnamed Student',
      email: r.email || extra.email || 'No email',
      studentId: extra.studentId || `UID${r.id.substring(0, 5).toUpperCase()}`,
      major: extra.major || 'Computer Science',
      year: extra.year || 'Senior',
      gpa: extra.gpa || '3.50',
      status: extra.status || 'Active'
    };
  });

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateStudent = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    createStudentMutation.mutate({
      company_id: companyId,
      name: formData.name,
      email: formData.email,
      type: 'uni_student',
      extra_data: JSON.stringify({
        studentId: `UID${Math.floor(Math.random() * 90000) + 10000}`,
        major: formData.major,
        year: formData.year,
        gpa: formData.gpa,
        status: 'Active'
      })
    });
  };

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_students", "Student Information System")}
        subtitle="Manage student lifecycle, academic directory, records, and GPA standings."
        metrics={[
          { title: "Enrolled Students", value: students.length, icon: Users }
        ]}
      />

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => { setActiveTab('directory'); setSelectedStudent(null); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'directory' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Student Directory
        </button>
        <button
          onClick={() => setActiveTab('standing')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'standing' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Academic Standing & Honors
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'add' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Add New Student
        </button>
      </div>

      {activeTab === 'directory' && !selectedStudent && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search students..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 border-slate-200 dark:border-slate-800 focus-visible:ring-primary" 
              />
            </div>
            <Button size="sm" variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filter Majors</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-bold">No students registered yet</p>
                <p className="text-sm">Use the "Add New Student" form to start enrolling undergraduates.</p>
              </div>
            ) : (
              filtered.map(student => (
                <Card key={student.id} onClick={() => setSelectedStudent(student)} className="border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer school-card relative overflow-hidden group">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {student.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{student.status}</Badge>
                    </div>
                    <h3 className="text-md font-extrabold text-slate-900 group-hover:text-primary transition-colors">{student.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{student.studentId}</p>
                    <div className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-primary" /> {student.major}</div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> {student.year}</div>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-3 px-6 border-t flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">CGPA</span>
                    <span className="font-black text-slate-900">{student.gpa}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'directory' && selectedStudent && (
        <Card className="border-slate-100 shadow-lg">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 pb-6">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shadow-inner">
                  {selectedStudent.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800">{selectedStudent.name}</CardTitle>
                  <CardDescription className="font-mono mt-0.5">{selectedStudent.studentId} · {selectedStudent.major}</CardDescription>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedStudent(null)}>Back to Directory</Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5"><FileText className="w-5 h-5 text-primary" /> Academic History & Transcript Log</h4>
              <div className="border-l-2 border-slate-200 pl-4 space-y-4">
                <div className="relative">
                  <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-800">Fall Semester 2025</p>
                  <p className="text-xs text-slate-500 mt-1">CS-302: HCI (Grade: A) · CS-401: Distributed Systems (Grade: A-)</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-800">Spring Semester 2025</p>
                  <p className="text-xs text-slate-500 mt-1">MATH-202: Linear Algebra (Grade: B+) · ENG-102: Rhetoric (Grade: A)</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800">Student Milestones</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span>Current Year:</span>
                  <span className="font-bold">{selectedStudent.year}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Email:</span>
                  <span className="font-bold">{selectedStudent.email}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Academic Standing:</span>
                  <span className="font-bold text-emerald-600">Good Standing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'standing' && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-1.5"><Sparkles className="w-5 h-5 text-amber-500" /> Dean's Honor Roll & Standing</CardTitle>
            <CardDescription>Academic honors lists and probationary alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 rounded-2xl">
                <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> President's list (CGPA &gt; 3.90)</h4>
                <p className="text-xs text-emerald-700 mt-2">Students eligible for academic honors and scholarship endowments.</p>
              </div>
              <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 rounded-2xl">
                <h4 className="font-bold text-sm text-rose-800 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-rose-600" /> Academic Probation (CGPA &lt; 2.00)</h4>
                <p className="text-xs text-rose-700 mt-2">Active advisory sessions and enrollment credit locks.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'add' && (
        <Card className="border-slate-100 shadow-sm max-w-xl">
          <CardHeader>
            <CardTitle>Enroll New Undergraduate</CardTitle>
            <CardDescription>Register a fresh student profile with institutional metadata.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Marie Curie" 
                  className="mt-1" 
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Institutional Email</label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="e.g. mcurie@university.edu" 
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
                    <option value="Finance & Economics">Finance & Economics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Academic Year</label>
                  <select 
                    value={formData.year} 
                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                    className="w-full mt-1 border rounded-md p-2 bg-white text-sm"
                  >
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white w-full">Save Student Profile</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
