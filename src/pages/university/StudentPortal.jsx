import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { GraduationCap, BookOpen, Award, Calendar, TrendingUp, CheckCircle, FileText, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default function UniversityStudentPortal() {
  const { user } = useAuth();

  const { data: student } = useQuery({
    queryKey: ['uni-student-portal', user?.email],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM uni_students WHERE email = ? AND company_id = ? LIMIT 1`,
        [user?.email, user?.company_id]
      );
      return rows?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['uni-registrations', student?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT r.*, c.title as course_title, c.credits as course_credits, c.instructor as course_instructor
         FROM uni_registrations r
         LEFT JOIN uni_courses c ON r.course_id = c.id
         WHERE r.student_id = ?
         ORDER BY r.created_at DESC`,
        [student?.id]
      ) || [];
      return rows.map(r => ({
        ...r,
        course: { title: r.course_title, credits: r.course_credits, instructor: r.course_instructor }
      }));
    },
    enabled: !!student?.id,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['uni-grades', student?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT g.*, c.title as course_title
         FROM uni_grades g
         LEFT JOIN uni_courses c ON g.course_id = c.id
         WHERE g.student_id = ?
         ORDER BY g.created_at DESC LIMIT 10`,
        [student?.id]
      ) || [];
      return rows.map(r => ({
        ...r,
        course: { title: r.course_title }
      }));
    },
    enabled: !!student?.id,
  });

  const { data: fees = [] } = useQuery({
    queryKey: ['uni-fees-portal', student?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM uni_fees WHERE student_id = ? ORDER BY due_date DESC LIMIT 6`,
        [student?.id]
      );
      return rows || [];
    },
    enabled: !!student?.id,
  });

  const gradeColor = (g) => {
    if (!g) return 'text-muted-foreground';
    const n = parseFloat(g);
    if (n >= 70) return 'text-green-600 font-bold';
    if (n >= 50) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const statusBadge = (s) => ({
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    A: 'bg-green-100 text-green-700',
    B: 'bg-blue-100 text-blue-700',
    C: 'bg-yellow-100 text-yellow-700',
  }[s] || 'bg-gray-100 text-gray-600');

  const activeCourses = registrations.filter(r => r.status === 'registered' || r.status === 'active');
  const completedCourses = registrations.filter(r => r.status === 'completed');

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-bold">
          {(student?.full_name || user?.full_name || user?.email || '?')[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{student?.full_name || user?.full_name || 'Student'}</h1>
          <p className="text-muted-foreground text-sm">
            {student?.programme || 'Programme'} · Level {student?.level || '—'} · {student?.student_id || ''}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Registered Courses" value={activeCourses.length} color="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle} label="Completed Courses" value={completedCourses.length} color="bg-green-100 text-green-700" />
        <StatCard icon={TrendingUp} label="Current GPA" value={student?.gpa ?? '—'} color="bg-blue-100 text-blue-700" />
        <StatCard icon={CreditCard} label="Outstanding Fees" value={fees.filter(f => f.status !== 'paid').length} color="bg-red-100 text-red-700" />
      </div>

      {/* Current Courses */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Current Courses</h2>
        </div>
        {activeCourses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No active course registrations.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {activeCourses.map(r => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{r.course?.title || r.course_code || 'Course'}</p>
                  <p className="text-xs text-muted-foreground">{r.course?.instructor || ''}{r.course?.credits ? ` · ${r.course.credits} credits` : ''}</p>
                </div>
                <Badge className="text-xs bg-blue-100 text-blue-700">Active</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grades */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Grades & Results</h2>
        </div>
        {grades.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No grades recorded yet.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {grades.map(g => (
              <div key={g.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{g.course?.title || g.course_code || 'Course'}</p>
                  <p className="text-xs text-muted-foreground">{g.semester || ''} {g.academic_year || ''}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg ${gradeColor(g.score)}`}>{g.grade || g.letter_grade || '—'}</p>
                  <p className="text-xs text-muted-foreground">{g.score ? `${g.score}%` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fees */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Fee Statements</h2>
        </div>
        {fees.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No fee records found.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {fees.map(f => (
              <div key={f.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{f.description || f.fee_type || 'Fee'}</p>
                  <p className="text-xs text-muted-foreground">Due: {f.due_date ? format(new Date(f.due_date), 'dd MMM yyyy') : '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{f.amount ? `GHS ${Number(f.amount).toLocaleString()}` : '—'}</span>
                  <Badge className={`text-xs ${statusBadge(f.status)}`}>{f.status || 'pending'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
