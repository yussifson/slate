import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Plus, CheckCircle2 } from 'lucide-react';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';
import { useToast } from "@/components/ui/use-toast";

function cn(...classes) { return classes.filter(Boolean).join(' '); }

export default function UniRegistration() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { data: students = [] } = useQuery({
    queryKey: ["clients", companyId, "uni_student"],
    queryFn: () => powerSync.execute('SELECT * FROM uni_enrollments WHERE company_id = ?', [companyId]).then(r => r.rows._array),
    enabled: !!companyId
  });

  const { data: records = [] } = useQuery({ 
    queryKey: ["cases", companyId, "uni_course"], 
    queryFn: () => powerSync.execute('SELECT * FROM uni_enrollments WHERE company_id = ?', [companyId]).then(r => r.rows._array), 
    enabled: !!companyId 
  });

  const courses = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id, name: r.case_name || r.name || 'Untitled Course',
      code: extra.code || `CS-${Math.floor(Math.random() * 800) + 101}`,
      teacher: extra.lecturer || 'Prof. Unassigned',
      credits: parseInt(extra.credits || '4'),
      schedule: extra.schedule || 'MWF 10:00 AM',
      prerequisite: extra.prerequisite || ''
    };
  });

  const parsedStudents = students.map(s => {
    let extra = {};
    try { extra = JSON.parse(s.extra_data || '{}'); } catch(e) {}
    return { id: s.id, name: s.name, gpa: parseFloat(extra.gpa || '3.50'), status: extra.status || 'Active', major: extra.major || 'Computer Science', courses: extra.courses || [] };
  });

  const activeStudent = parsedStudents.find(s => s.id === selectedStudentId);

  const updateStudentCoursesMutation = useMutation({
    mutationFn: async ({ studentId, updatedCourses }) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      let extra = {};
      try { extra = JSON.parse(student.extra_data || '{}'); } catch(e) {}
      extra.courses = updatedCourses;
      await powerSync.execute('UPDATE uni_enrollments SET updated_at = datetime(\'now\') WHERE id = ?', [studentId]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["clients", companyId, "uni_student"]);
      toast({ title: "Registration Processed", description: "Course registration updated." });
    }
  });

  const toggleCourse = (courseCode) => {
    if (!activeStudent) { toast({ title: "No Student Selected", variant: "destructive" }); return; }
    if (activeStudent.gpa < 2.0) { toast({ title: "Academic Lockout", description: "Student is on probation.", variant: "destructive" }); return; }
    const targeted = courses.find(c => c.code === courseCode);
    if (!targeted) return;
    const isEnrolled = activeStudent.courses.includes(courseCode);
    if (!isEnrolled) {
      const currentCredits = courses.filter(c => activeStudent.courses.includes(c.code)).reduce((sum, c) => sum + c.credits, 0);
      if (currentCredits + targeted.credits > 18) { toast({ title: "Credit Limit Exceeded", description: "Max 18 credit hours.", variant: "destructive" }); return; }
      if (targeted.prerequisite && !activeStudent.courses.includes(targeted.prerequisite)) { toast({ title: "Missing Prerequisite", description: `Prerequisite ${targeted.prerequisite} required.`, variant: "destructive" }); return; }
    }
    const updatedCourses = isEnrolled ? activeStudent.courses.filter(code => code !== courseCode) : [...activeStudent.courses, courseCode];
    updateStudentCoursesMutation.mutate({ studentId: activeStudent.id, updatedCourses });
  };

  const registeredCredits = activeStudent ? courses.filter(c => activeStudent.courses.includes(c.code)).reduce((sum, c) => sum + c.credits, 0) : 0;
  const selectClass = "w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)] font-body";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-primary/40 pb-4">
        <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Course Registration</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Submit slate choices, validate credit workloads, and satisfy prerequisites.</p>
      </div>

      <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
        <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Active Student Profile</label>
        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className={cn(selectClass, "mt-2")}>
          <option value="">-- Choose Undergraduate --</option>
          {parsedStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.major}) - GPA: {s.gpa}</option>)}
        </select>
      </div>

      {activeStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
            <div className="p-6 border-b border-primary/40">
              <h2 className="font-semibold text-[var(--color-text-primary)]">Registration Grid</h2>
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Select courses. System verifies requirements automatically.</p>
            </div>
            <div className="p-4 space-y-3">
              {courses.length === 0 ? (
                <p className="text-[var(--color-text-tertiary)] text-center py-8">No courses found. Create courses in the Course Catalog first.</p>
              ) : courses.map((course, idx) => {
                const isEnrolled = activeStudent.courses.includes(course.code);
                return (
                  <div key={idx} className="p-4 bg-[var(--color-surface-1)] rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-[var(--color-accent-primary)] bg-[var(--color-accent-subtle)] px-2 py-0.5 rounded-md-[var(--radius-sm)] tracking-[0.04em]">{course.code}</span>
                        <h4 className="font-semibold text-[var(--text-sm)] text-[var(--color-text-primary)]">{course.name}</h4>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-[var(--text-xs)] text-[var(--color-text-secondary)] font-medium tracking-[0.04em]">
                        <span>{course.credits} Credits</span>
                        <span>{course.schedule}</span>
                        {course.prerequisite && <span className="text-[var(--color-warning)]">Prereq: {course.prerequisite}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEnrolled ? (
                        <>
                          <OrbitStatusBadge status="enrolled" />
                          <button onClick={() => toggleCourse(course.code)} className="px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] rounded-md-[var(--radius-md)] transition-colors tracking-[0.04em]">Drop</button>
                        </>
                      ) : (
                        <button onClick={() => toggleCourse(course.code)} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-accent-primary)] hover:opacity-90 text-white text-xs font-medium rounded-md-[var(--radius-md)] transition-all tracking-[0.04em]">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 h-fit space-y-6">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Workload Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[var(--text-sm)]">
                <span className="text-[var(--color-text-secondary)]">Credit Load:</span>
                <span className="font-mono font-semibold text-[var(--color-accent-primary)]">{registeredCredits} / 18</span>
              </div>
              <div className="w-full bg-[var(--color-surface-3)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--color-accent-primary)] h-full transition-all" style={{ width: `${Math.min(100, (registeredCredits / 18) * 100)}%` }} />
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-primary/40">
              <div className="flex justify-between text-[var(--text-sm)]">
                <span className="text-[var(--color-text-secondary)]">Standing:</span>
                <span className={activeStudent.gpa >= 2.0 ? 'text-[var(--color-success)] font-medium' : 'text-[var(--color-danger)] font-medium'}>
                  {activeStudent.gpa >= 2.0 ? 'Good Standing' : 'Probation'}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-sm)]">
                <span className="text-[var(--color-text-secondary)]">Advising:</span>
                <span className="text-[var(--color-success)] font-medium flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Cleared</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-12 text-center text-[var(--color-text-tertiary)]">
          Select a student to manage course registration.
        </div>
      )}
    </div>
  );
}
