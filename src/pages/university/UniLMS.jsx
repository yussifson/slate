import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { BookOpen, Video, MessageSquare, ClipboardList, Play, Upload, CheckCircle2 } from 'lucide-react';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';
import { useToast } from "@/components/ui/use-toast";

function cn(...classes) { return classes.filter(Boolean).join(' '); }

export default function UniLMS() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [submissionText, setSubmissionText] = useState('');

  const { data: students = [] } = useQuery({ queryKey: ["clients", companyId, "uni_student"], queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student' }), enabled: !!companyId });
  const { data: records = [] } = useQuery({ queryKey: ["cases", companyId, "uni_course"], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_course' }), enabled: !!companyId });

  const courses = records.map(r => { let extra = {}; try { extra = JSON.parse(r.notes || '{}'); } catch(e) {} return { id: r.id, name: r.case_name || r.name || 'Untitled', code: extra.code || 'CS-000', teacher: extra.lecturer || 'Unassigned' }; });
  const parsedStudents = students.map(s => { let extra = {}; try { extra = JSON.parse(s.extra_data || '{}'); } catch(e) {} return { id: s.id, name: s.name, major: extra.major || 'CS', courses: extra.courses || [], submissions: extra.submissions || {} }; });
  const activeStudent = parsedStudents.find(s => s.id === selectedStudentId);
  const activeStudentCourses = activeStudent ? courses.filter(c => activeStudent.courses.includes(c.code)) : [];
  const activeCourse = courses.find(c => c.code === selectedCourseCode);

  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ studentId, courseCode, text }) => {
      const student = students.find(s => s.id === studentId); if (!student) return;
      let extra = {}; try { extra = JSON.parse(student.extra_data || '{}'); } catch(e) {}
      if (!extra.submissions) extra.submissions = {};
      if (!extra.submissions[courseCode]) extra.submissions[courseCode] = [];
      extra.submissions[courseCode].push({ assignment: "Coursework Project Submission", submittedAt: new Date().toISOString().split('T')[0], content: text, status: "Graded Pending" });
      await base44.entities.Client.update(studentId, { extra_data: JSON.stringify(extra) });
    },
    onSuccess: () => { queryClient.invalidateQueries(["clients", companyId, "uni_student"]); setSubmissionText(''); toast({ title: "Assignment Submitted" }); }
  });

  const handleSubmitAssignment = (e) => { e.preventDefault(); if (!submissionText.trim()) return; submitAssignmentMutation.mutate({ studentId: activeStudent.id, courseCode: selectedCourseCode, text: submissionText }); };
  const selectClass = "w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-module-lms)] focus:ring-1 focus:ring-[var(--color-module-lms)] font-body";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-[var(--color-border-subtle)] pb-4">
        <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Learning Management</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Access virtual course workspaces, assignment centers, and academic discussions.</p>
      </div>

      <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6">
        <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">Active Student</label>
        <select value={selectedStudentId} onChange={e => { setSelectedStudentId(e.target.value); setSelectedCourseCode(''); }} className={cn(selectClass, "mt-2")}>
          <option value="">-- Choose Undergraduate --</option>
          {parsedStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.major}) - {s.courses.length} courses</option>)}
        </select>
      </div>

      {activeStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><BookOpen className="w-5 h-5" style={{ color: 'var(--color-module-lms)' }} /> Enrolled Workspaces</h3>
            {activeStudentCourses.length === 0 ? (
              <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-12 text-center text-[var(--color-text-tertiary)]">Not enrolled in any courses yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeStudentCourses.map((course, idx) => (
                  <div key={idx} onClick={() => setSelectedCourseCode(course.code)} className={cn("bg-[var(--color-surface-0)] border rounded-[var(--radius-lg)] p-5 cursor-pointer transition-all hover:shadow-md", selectedCourseCode === course.code ? "border-[var(--color-module-lms)] ring-1 ring-[var(--color-module-lms)] bg-[var(--color-accent-subtle)]" : "border-[var(--color-border-subtle)]")}>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[var(--radius-sm)]" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent-primary)' }}>{course.code}</span>
                    <h4 className="font-semibold text-[var(--color-text-primary)] mt-2">{course.name}</h4>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mt-1">{course.teacher}</p>
                    <button className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-[var(--color-accent-primary)] hover:opacity-90 text-white text-xs font-medium rounded-[var(--radius-md)] transition-all">
                      Enter Workspace <Play className="w-3 h-3 fill-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeCourse && (
              <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--color-border-subtle)]">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Workspace: {activeCourse.name} ({activeCourse.code})</h3>
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Submit course deliverables and assignments here.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-5">
                    <h4 className="font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-1.5"><ClipboardList className="w-4 h-4" style={{ color: 'var(--color-module-lms)' }} /> Assignment 1: Final Practical Project</h4>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mb-3">Due: End of term.</p>
                    <form onSubmit={handleSubmitAssignment} className="space-y-3">
                      <textarea value={submissionText} onChange={e => setSubmissionText(e.target.value)} placeholder="Paste submission notes, github links..." className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] p-3 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-module-lms)] focus:ring-1 focus:ring-[var(--color-module-lms)] font-body min-h-[100px]" required />
                      <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-[var(--color-module-lms)] hover:opacity-90 text-white text-sm font-medium rounded-[var(--radius-md)] transition-all"><Upload className="w-3.5 h-3.5" /> Upload</button>
                    </form>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[var(--color-text-primary)]">Submission History</h4>
                    {(activeStudent.submissions[activeCourse.code] || []).length === 0 ? (
                      <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">No submissions yet.</p>
                    ) : activeStudent.submissions[activeCourse.code].map((sub, sIdx) => (
                      <div key={sIdx} className="p-3 bg-[var(--color-success-subtle)] border border-[var(--color-success)] rounded-[var(--radius-md)] flex justify-between items-center text-[var(--text-xs)]">
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">{sub.assignment}</p>
                          <p className="text-[var(--color-text-tertiary)] mt-0.5">Submitted: {sub.submittedAt}</p>
                          <p className="text-[var(--color-text-secondary)] mt-1 italic font-mono">"{sub.content}"</p>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--color-success)] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Checked</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 h-fit">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-1.5"><MessageSquare className="w-4 h-4" style={{ color: 'var(--color-module-lms)' }} /> Discussions</h3>
            <div className="space-y-3">
              <div className="p-3 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] text-[var(--text-xs)]">
                <p className="font-semibold text-[var(--color-text-primary)]">"Trouble with partition algorithms?"</p>
                <p className="text-[var(--color-text-tertiary)] mt-1">3 replies today</p>
              </div>
              <div className="p-3 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] text-[var(--text-xs)]">
                <p className="font-semibold text-[var(--color-text-primary)]">"Practical project guidelines updated"</p>
                <p className="text-[var(--color-text-tertiary)] mt-1">Read Announcement</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-12 text-center text-[var(--color-text-tertiary)]">Select a student profile to load class workspaces.</div>
      )}
    </div>
  );
}
