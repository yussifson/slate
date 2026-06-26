import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { PlayCircle, BookOpen, Award, Clock, TrendingUp, CheckCircle, Star, Download } from 'lucide-react';
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
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(value ?? 0, 100)}%` }} />
    </div>
  );
}

export default function LearnerPortal() {
  const { user } = useAuth();

  const { data: learner } = useQuery({
    queryKey: ['online-learner-portal', user?.email],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM online_learners WHERE email = ? AND company_id = ? LIMIT 1`,
        [user?.email, user?.company_id]
      );
      return rows?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['online-enrollments', learner?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT e.*, c.title as course_title, c.thumbnail as course_thumbnail, c.instructor_name as course_instructor, c.total_lessons as course_lessons
         FROM online_enrollments e
         LEFT JOIN online_courses c ON e.course_id = c.id
         WHERE e.learner_id = ?
         ORDER BY e.enrolled_at DESC`,
        [learner?.id]
      ) || [];
      return rows.map(r => ({
        ...r,
        course: { title: r.course_title, thumbnail: r.course_thumbnail, instructor_name: r.course_instructor, total_lessons: r.course_lessons }
      }));
    },
    enabled: !!learner?.id,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['online-certificates', learner?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT c.*, co.title as course_title
         FROM online_certificates c
         LEFT JOIN online_courses co ON c.course_id = co.id
         WHERE c.learner_id = ?
         ORDER BY c.issued_at DESC`,
        [learner?.id]
      ) || [];
      return rows.map(r => ({
        ...r,
        course: { title: r.course_title }
      }));
    },
    enabled: !!learner?.id,
  });

  const activeCourses = enrollments.filter(e => e.status !== 'completed');
  const completedCourses = enrollments.filter(e => e.status === 'completed');

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md">
          {(learner?.full_name || user?.full_name || user?.email || '?')[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {(learner?.full_name || user?.full_name || 'Learner').split(' ')[0]}!</h1>
          <p className="text-muted-foreground text-sm">{activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''} in progress · {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={PlayCircle} label="Courses In Progress" value={activeCourses.length} color="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle} label="Completed" value={completedCourses.length} color="bg-green-100 text-green-700" />
        <StatCard icon={Award} label="Certificates" value={certificates.length} color="bg-yellow-100 text-yellow-700" />
        <StatCard icon={TrendingUp} label="Total Enrolled" value={enrollments.length} color="bg-blue-100 text-blue-700" />
      </div>

      {/* Continue Learning */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><PlayCircle className="w-4 h-4 text-primary" /> Continue Learning</h2>
        </div>
        {activeCourses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No active courses. Browse the catalog to get started.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {activeCourses.map(e => (
              <div key={e.id} className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.course?.title || 'Course'}</p>
                    <p className="text-xs text-muted-foreground">{e.course?.instructor_name ? `By ${e.course.instructor_name}` : ''}</p>
                  </div>
                  <Button size="sm" className="text-xs gap-1 shrink-0">
                    <PlayCircle className="w-3 h-3" /> Resume
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium text-foreground">{e.progress_pct ?? 0}%</span>
                  </div>
                  <ProgressBar value={e.progress_pct ?? 0} />
                  {e.course?.total_lessons && (
                    <p className="text-xs text-muted-foreground">{e.lessons_completed || 0} / {e.course.total_lessons} lessons</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> My Certificates</h2>
          </div>
          <div className="divide-y divide-border/50">
            {certificates.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center text-lg">🏆</div>
                  <div>
                    <p className="font-medium text-sm">{c.course?.title || c.title || 'Certificate'}</p>
                    <p className="text-xs text-muted-foreground">{c.issued_at ? format(new Date(c.issued_at), 'dd MMM yyyy') : 'Issued'}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Download className="w-3 h-3" /> Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Completed Courses</h2>
          </div>
          <div className="divide-y divide-border/50">
            {completedCourses.map(e => (
              <div key={e.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{e.course?.title || 'Course'}</p>
                  <p className="text-xs text-muted-foreground">Completed {e.completed_at ? format(new Date(e.completed_at), 'dd MMM yyyy') : ''}</p>
                </div>
                <Badge className="text-xs bg-green-100 text-green-700">✓ Complete</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
