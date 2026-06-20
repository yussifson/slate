import React, { useState } from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompanyId } from "@/hooks/useCompanyId";
import { BookOpen, MessageSquare, ClipboardList, Play, Upload, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

function cn(...classes) { return classes.filter(Boolean).join(' '); }

export default function UniLMS() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [submissionText, setSubmissionText] = useState('');

  // Fetch Students
  const { data: students = [] } = useQuery({
    queryKey: ["uni_students", companyId],
    queryFn: () => powerSync.execute('SELECT * FROM uni_students WHERE company_id = ?', [companyId]).then(r => r.rows._array),
    enabled: !!companyId
  });

  // Fetch Courses
  const { data: courses = [] } = useQuery({
    queryKey: ["uni_courses", companyId],
    queryFn: () => powerSync.execute('SELECT * FROM uni_courses WHERE company_id = ?', [companyId]).then(r => r.rows._array),
    enabled: !!companyId
  });

  // Fetch Enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ["uni_enrollments", companyId],
    queryFn: () => powerSync.execute('SELECT * FROM uni_enrollments WHERE company_id = ?', [companyId]).then(r => r.rows._array),
    enabled: !!companyId
  });

  // Fetch Assignments for selected course
  const { data: assignments = [] } = useQuery({
    queryKey: ["uni_lms_assignments", selectedCourseId],
    queryFn: () => powerSync.execute('SELECT * FROM uni_lms_assignments WHERE course_id = ?', [selectedCourseId]).then(r => r.rows._array),
    enabled: !!selectedCourseId
  });

  // Fetch Submissions for selected student in selected course
  const { data: submissions = [] } = useQuery({
    queryKey: ["uni_lms_submissions", selectedStudentId, selectedCourseId],
    queryFn: async () => {
      // Get assignments first
      const asgns = await powerSync.execute('SELECT id FROM uni_lms_assignments WHERE course_id = ?', [selectedCourseId]);
      const asgnIds = asgns.rows._array.map(a => a.id);
      if(asgnIds.length === 0) return [];
      
      const placeholders = asgnIds.map(() => '?').join(',');
      const res = await powerSync.execute(`SELECT * FROM uni_lms_submissions WHERE student_id = ? AND assignment_id IN (${placeholders}) ORDER BY submitted_at DESC`, [selectedStudentId, ...asgnIds]);
      return res.rows._array;
    },
    enabled: !!selectedStudentId && !!selectedCourseId
  });

  const activeStudent = students.find(s => s.id === selectedStudentId);
  const activeStudentEnrollments = enrollments.filter(e => e.student_id === selectedStudentId);
  const activeStudentCourses = courses.filter(c => activeStudentEnrollments.some(e => e.course_id === c.id));
  const activeCourse = courses.find(c => c.id === selectedCourseId);

  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ studentId, assignmentId, text }) => {
      await powerSync.execute(
        `INSERT INTO uni_lms_submissions (id, company_id, assignment_id, student_id, submission_text, submitted_at, score, feedback) 
         VALUES (uuid(), ?, ?, ?, ?, datetime('now'), null, null)`,
        [companyId, assignmentId, studentId, text]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["uni_lms_submissions", selectedStudentId, selectedCourseId]);
      setSubmissionText('');
      toast({ title: "Assignment Submitted" });
    }
  });

  const handleSubmitAssignment = (e, assignmentId) => {
    e.preventDefault();
    if (!submissionText.trim()) return;
    submitAssignmentMutation.mutate({ studentId: activeStudent.id, assignmentId, text: submissionText });
  };

  const selectClass = "w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-primary/40 pb-4">
        <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Learning Management</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Access virtual course workslates, assignment centers, and academic discussions.</p>
      </div>

      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
        <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Active Student Portal View</label>
        <select value={selectedStudentId} onChange={e => { setSelectedStudentId(e.target.value); setSelectedCourseId(''); }} className={cn(selectClass, "mt-2")}>
          <option value="">-- Choose Student --</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id_number || 'N/A'})</option>)}
        </select>
      </div>

      {activeStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><BookOpen className="w-5 h-5" style={{ color: 'var(--primary)' }} /> Enrolled Workslates</h3>
            {activeStudentCourses.length === 0 ? (
              <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-12 text-center text-[var(--color-text-tertiary)]">Not enrolled in any courses yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeStudentCourses.map((course, idx) => (
                  <div key={idx} onClick={() => setSelectedCourseId(course.id)} className={cn("bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 rounded-md-[var(--radius-lg)] p-5 cursor-pointer transition-all ", selectedCourseId === course.id ? "border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--color-accent-subtle)]" : "border-primary/40")}>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md-[var(--radius-sm)]" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent-primary)' }}>{course.code}</span>
                    <h4 className="font-semibold text-[var(--color-text-primary)] mt-2">{course.name}</h4>
                    <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--color-accent-primary)] hover:opacity-90 text-white text-xs font-medium rounded-md-[var(--radius-md)] transition-all tracking-[0.04em]">
                      Enter WorkSlate <Play className="w-3 h-3 fill-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeCourse && (
              <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden ">
                <div className="p-6 border-b border-primary/40">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Workslate: {activeCourse.name} ({activeCourse.code})</h3>
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Submit course deliverables and assignments here.</p>
                </div>
                <div className="p-6 space-y-6">
                  {assignments.length === 0 ? (
                      <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] tracking-[0.04em]">No active assignments for this course.</p>
                  ) : assignments.map(assignment => (
                    <div key={assignment.id} className="bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-lg)] p-5 mb-4">
                      <h4 className="font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2.5"><ClipboardList className="w-4 h-4" style={{ color: 'var(--primary)' }} /> {assignment.title}</h4>
                      <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mb-3 tracking-[0.04em]">{assignment.description || 'No description.'}</p>
                      <form onSubmit={(e) => handleSubmitAssignment(e, assignment.id)} className="space-y-3">
                        <textarea value={submissionText} onChange={e => setSubmissionText(e.target.value)} placeholder="Paste submission notes, github links..." className="w-full bg-[var(--color-surface-2)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] p-3 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body min-h-[100px]" required />
                        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-md-[var(--radius-md)] transition-all"><Upload className="w-3.5 h-3.5" /> Submit Work</button>
                      </form>
                    </div>
                  ))}

                  <div className="space-y-3 mt-6">
                    <h4 className="font-semibold text-[var(--color-text-primary)]">Submission History</h4>
                    {submissions.length === 0 ? (
                      <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] tracking-[0.04em]">No submissions yet.</p>
                    ) : submissions.map((sub, sIdx) => {
                      const asgn = assignments.find(a => a.id === sub.assignment_id);
                      return (
                        <div key={sIdx} className="p-3 bg-[var(--color-success-subtle)] border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-success)] rounded-md-[var(--radius-md)] flex justify-between items-center text-[var(--text-xs)] tracking-[0.04em]">
                          <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">{asgn ? asgn.title : 'Assignment'}</p>
                            <p className="text-[var(--color-text-tertiary)] mt-0.5">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                            <p className="text-[var(--color-text-secondary)] mt-1 italic font-mono">"{sub.submission_text}"</p>
                          </div>
                          <span className="text-[10px] font-semibold text-[var(--color-success)] flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Received</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 h-fit">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2.5"><MessageSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} /> Discussions</h3>
            <div className="space-y-3">
              <div className="p-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] text-[var(--text-xs)] tracking-[0.04em]">
                <p className="font-semibold text-[var(--color-text-primary)]">"Final project submission guidelines"</p>
                <p className="text-[var(--color-text-tertiary)] mt-1">Read Announcement</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-12 text-center text-[var(--color-text-tertiary)]">Select a student profile to load class workslates.</div>
      )}
    </div>
  );
}
