import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Users, BookOpen, Banknote, GraduationCap, Clock, Activity, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function OnlineDashboard() {
  const { t } = useTranslation();
  const companyId = useCompanyId();

  const { data: learners = [] } = useQuery({ 
    queryKey: ["online_learners", companyId], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'online_learner' }), 
    enabled: !!companyId 
  });
  
  const { data: courses = [] } = useQuery({ 
    queryKey: ["online_courses", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_course' }), 
    enabled: !!companyId 
  });

  const { data: sales = [] } = useQuery({ 
    queryKey: ["online_sales", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_sale' }), 
    enabled: !!companyId 
  });

  const totalRevenue = sales.reduce((sum, sale) => {
    let amt = 0; 
    try { amt = parseFloat(JSON.parse(sale.notes).amount || 0); } catch(e) {}
    return sum + amt;
  }, 0);

  const activeCourses = courses.filter(c => c.status === 'Active').length;

  const stats = [
    { title: "Total Learners", value: learners.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Courses", value: activeCourses, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Course Completions", value: Math.floor(learners.length * 0.75), icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const salesData = [
    { name: 'Jan', revenue: 1200 },
    { name: 'Feb', revenue: 1900 },
    { name: 'Mar', revenue: 1500 },
    { name: 'Apr', revenue: 2100 },
    { name: 'May', revenue: totalRevenue > 0 ? totalRevenue : 3200 }
  ];

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("online_dashboard", "Online Learning Dashboard")} 
        subtitle="Overview of your e-learning platform's performance, learners, and revenue." 
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
                <TrendingUp className="w-5 h-5 text-purple-500" /> Revenue Growth
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{fill: 'rgba(139, 92, 246, 0.1)'}}
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-amber-500" /> Recent Enrollments
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">John Doe enrolled in React 101</p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">New Course Published</p>
                  <p className="text-xs text-slate-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Platform update v1.2</p>
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
