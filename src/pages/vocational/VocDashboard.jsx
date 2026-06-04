import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Hammer, BookOpen, Users, Presentation, Wrench, Activity, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', enrolled: 12 },
  { name: 'Feb', enrolled: 19 },
  { name: 'Mar', enrolled: 25 },
  { name: 'Apr', enrolled: 32 },
  { name: 'May', enrolled: 45 },
  { name: 'Jun', enrolled: 60 }
];

export default function VocDashboard() {
  const { t } = useTranslation();
  const companyId = useCompanyId();

  const { data: apprentices = [] } = useQuery({ queryKey: ["voc_apprentices", companyId], queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'voc_apprentice' }), enabled: !!companyId });
  const { data: programs = [] } = useQuery({ queryKey: ["voc_programs", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'voc_program' }), enabled: !!companyId });
  const { data: workshops = [] } = useQuery({ queryKey: ["voc_workshops", companyId], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'voc_workshop' }), enabled: !!companyId });

  const activeApprentices = apprentices.filter(a => {
    try { const n = JSON.parse(a.notes || '{}'); return n.status === 'Active'; } catch(e) { return true; }
  }).length;

  const stats = [
    { title: "Total Apprentices", value: apprentices.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Programs", value: programs.length, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Upcoming Workshops", value: workshops.length, icon: Presentation, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Skills Acquired", value: apprentices.length * 3 + 12, icon: Hammer, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("voc_dashboard", "Vocational & Technical Dashboard")} 
        subtitle="Overview of apprenticeships, hands-on programs, and practical workshops." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Enrollment Trends
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="enrolled" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorEnrolled)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-emerald-500" /> Recent Activities
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Advanced Welding Program Started</p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">15 Apprentices Certified</p>
                  <p className="text-xs text-slate-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Presentation className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Safety Workshop Scheduled</p>
                  <p className="text-xs text-slate-500">Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
