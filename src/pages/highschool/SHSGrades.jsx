import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from 'react-hot-toast';
import { Award, Plus, Search } from "lucide-react";

export default function SHSGrades() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    studentName: '', subject: 'Core Mathematics', term: 'Term 1', score: '', grade: 'A1', remarks: 'Excellent'
  });

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["shs_grades", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'shs_grade' }), 
    enabled: !!companyId 
  });

  const mutateGrade = useMutation({
    mutationFn: (data) => base44.entities.LegalCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shs_grades", companyId] });
      toast.success("Grade recorded successfully");
      setShowModal(false);
    }
  });

  const grades = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      studentName: r.title,
      subject: r.description || '',
      term: r.status || 'Term 1',
      score: extra.score || 0,
      grade: extra.grade || 'C4',
      remarks: extra.remarks || '',
      date: new Date(r.created_at).toLocaleDateString()
    };
  });

  const filtered = grades.filter(g => g.studentName.toLowerCase().includes(search.toLowerCase()) || g.subject.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!formData.studentName || !formData.score) return toast.error("Student Name and Score are required");
    mutateGrade.mutate({
      company_id: companyId,
      case_type: 'shs_grade',
      title: formData.studentName,
      description: formData.subject,
      status: formData.term,
      notes: JSON.stringify({
        score: formData.score,
        grade: formData.grade,
        remarks: formData.remarks
      })
    });
  };

  const getGradeColor = (grade) => {
    if (['A1', 'B2', 'B3'].includes(grade)) return 'bg-purple-100 text-purple-700';
    if (['C4', 'C5', 'C6'].includes(grade)) return 'bg-blue-100 text-blue-700';
    if (['D7', 'E8'].includes(grade)) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("grades_results", "Grades & Results")} 
        subtitle="Record and manage terminal examination results and continuous assessments." 
        metrics={[
          { title: "Total Records", value: grades.length, icon: Award }
        ]}
      />
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by student or subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => {
          setFormData({ studentName: '', subject: 'Core Mathematics', term: 'Term 1', score: '', grade: 'A1', remarks: 'Excellent' });
          setShowModal(true);
        }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Record Grade
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Student Name', 'Term', 'Subject', 'Score', 'Grade', 'Remarks', 'Date recorded'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(g => (
              <tr key={g.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{g.studentName}</td>
                <td className="px-4 py-3 text-slate-600">{g.term}</td>
                <td className="px-4 py-3 text-slate-600">{g.subject}</td>
                <td className="px-4 py-3 font-bold text-slate-700">{g.score}%</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getGradeColor(g.grade)}`}>
                    {g.grade}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 italic text-xs">{g.remarks}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{g.date}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center py-8 text-slate-500">No grades recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Record Grade</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Student Name / ID</label>
                <Input value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} placeholder="e.g. Kwame Osei" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Term / Semester</label>
                  <select value={formData.term} onChange={e => setFormData({...formData, term: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Term 1</option><option>Term 2</option><option>Term 3</option><option>WASSCE Mock</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Core Mathematics</option><option>English Language</option><option>Integrated Science</option><option>Social Studies</option><option>Elective Maths</option><option>Physics</option><option>Chemistry</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Score (%)</label>
                  <Input type="number" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} placeholder="85" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Grade</label>
                  <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Teacher's Remarks</label>
                <Input value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Excellent performance..." className="mt-1" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Save Grade</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
