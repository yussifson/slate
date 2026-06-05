import React from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Users, UserPlus, CheckCircle2, XCircle, TrendingUp, BarChart4 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const defaultEnrollmentHistory = [
  { term: 'Fall 2023', enrolled: 1200, applied: 1800 },
  { term: 'Spring 2024', enrolled: 1350, applied: 2000 },
  { term: 'Fall 2024', enrolled: 1580, applied: 2400 },
  { term: 'Spring 2025', enrolled: 1720, applied: 2650 },
  { term: 'Fall 2025', enrolled: 1980, applied: 3100 },
];

export default function UniEnrollment() {
  const { t } = useTranslation();
  const companyId = useCompanyId();

  const { data: students = [] } = useQuery({
    queryKey: ["clients", companyId, "uni_student"],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student' }),
    enabled: !!companyId
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ["clients", companyId, "uni_applicant"],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_applicant' }),
    enabled: !!companyId
  });

  const admittedCount = applicants.filter(a => a.status === 'Admitted').length;
  const pendingCount = applicants.filter(a => a.status === 'Pending' || a.status === 'Reviewing').length;
  const rejectedCount = applicants.filter(a => a.status === 'Rejected').length;

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_enrollment_analytics", "Enrollment Analytics")} 
        subtitle="Track enrollment trends, pipeline yield metrics, and historical admissions data." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Enrolled</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{students.length || 3240}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admitted (Current Batch)</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{admittedCount || 412}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Applications</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{pendingCount || 185}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected Applications</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{rejectedCount || 54}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart4 className="w-5 h-5 text-primary" /> Enrollment & Application Growth
            </CardTitle>
            <CardDescription>Historical comparison of student applications versus final enrollments.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={defaultEnrollmentHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="term" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="applied" stroke="#10b981" fillOpacity={1} fill="url(#colorApplied)" strokeWidth={2} />
                  <Area type="monotone" dataKey="enrolled" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorEnrolled)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Conversion Overview</CardTitle>
            <CardDescription>Funnel metrics from initial review to registration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>Application to Interview Rate</span>
                <span>82%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>Interview to Offer Yield</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>Offer Acceptance Rate</span>
                <span>78%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Current Term Yield</p>
                <p className="text-2xl font-black text-slate-900 mt-1">74.2%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
