import React from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { GraduationCap, Trophy, Globe2, Briefcase, Landmark, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const colors = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#6366f1"];

const defaultHonorsDistribution = [
  { name: 'First Class Honors', value: 120 },
  { name: 'Second Class (Upper)', value: 450 },
  { name: 'Second Class (Lower)', value: 320 },
  { name: 'Pass', value: 90 },
];

export default function UniGraduationStats() {
  const { t } = useTranslation();
  const companyId = useCompanyId();

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_graduation_stats", "Graduation & Alumni Statistics")} 
        subtitle="Yearly graduation rates, student degree classifications, and post-graduation outcomes." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Alumni</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">12,480</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employment Rate</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">94.2%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Higher Education</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">18.5%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Globe2 className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Degrees Verified</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">100%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm col-span-1">
          <CardHeader>
            <CardTitle>Class Honors Distribution</CardTitle>
            <CardDescription>Degree class ratios for the graduating cohort.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defaultHonorsDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {defaultHonorsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2 mt-4 text-xs font-semibold">
              {defaultHonorsDistribution.map((h, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                    {h.name}
                  </span>
                  <span>{h.value} Graduates</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Post-Graduation Employment Sectors
            </CardTitle>
            <CardDescription>Top destination domains for university alumni.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>Technology & Software Engineering</span>
                <span>38%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '38%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>Finance & Investment Banking</span>
                <span>24%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-50 h-full rounded-full" style={{ width: '24%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>Healthcare & Medical Research</span>
                <span>18%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '18%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>Government & Public Policy</span>
                <span>12%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
