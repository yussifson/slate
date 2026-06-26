import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { BookOpen, Award, TrendingUp, Calendar, CheckCircle, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

function ProgressBar({ value, max, color = 'bg-primary' }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function TraineePortal() {
  const { user } = useAuth();

  const { data: trainee } = useQuery({
    queryKey: ['vocational-trainee', user?.email],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM vocational_trainee_profiles WHERE email = ? AND company_id = ? LIMIT 1`,
        [user?.email, user?.company_id]
      );
      return rows?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['vocational-progress', trainee?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM vocational_training_progress WHERE trainee_id = ? ORDER BY updated_at DESC`,
        [trainee?.id]
      );
      return rows || [];
    },
    enabled: !!trainee?.id,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['vocational-certificates', trainee?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM vocational_certificates WHERE trainee_id = ?`,
        [trainee?.id]
      );
      return rows || [];
    },
    enabled: !!trainee?.id,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['vocational-assessments', trainee?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM vocational_assessments WHERE trainee_id = ? ORDER BY created_at DESC LIMIT 10`,
        [trainee?.id]
      );
      return rows || [];
    },
    enabled: !!trainee?.id,
  });

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-bold">
          {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{trainee?.full_name || user?.full_name || 'Trainee'} Portal</h1>
          <p className="text-muted-foreground text-sm">{trainee?.trade || trainee?.program || 'Vocational Programme'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Modules" value={progress.length} color="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle} label="Completed" value={progress.filter(p => p.status === 'completed').length} color="bg-green-100 text-green-700" />
        <StatCard icon={Award} label="Certificates" value={certificates.length} color="bg-yellow-100 text-yellow-700" />
        <StatCard icon={TrendingUp} label="Overall Progress" value={`${trainee?.overall_progress ?? 0}%`} color="bg-blue-100 text-blue-700" />
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Training Progress</h2>
        </div>
        {progress.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No training modules assigned yet.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {progress.map(p => (
              <div key={p.id} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{p.module_name || p.course_name || 'Module'}</p>
                  <span className="text-xs font-bold text-primary">{p.progress_pct ?? 0}%</span>
                </div>
                <ProgressBar value={p.progress_pct ?? 0} max={100} />
                <p className="text-xs text-muted-foreground">{p.status || 'in_progress'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Certificates Earned</h2>
        </div>
        {certificates.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No certificates earned yet. Keep going!</div>
        ) : (
          <div className="divide-y divide-border/50">
            {certificates.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{c.title || c.trade || 'Certificate'}</p>
                  <p className="text-xs text-muted-foreground">{c.issued_date ? format(new Date(c.issued_date), 'dd MMM yyyy') : 'Issued'}</p>
                </div>
                <Badge className="text-xs bg-yellow-100 text-yellow-700">🏆 Earned</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
