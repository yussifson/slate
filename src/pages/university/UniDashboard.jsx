import React from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Users, BookOpen, Building, GraduationCap, DollarSign, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function UniDashboard() {
  const { t } = useTranslation();
  const companyId = useCompanyId();

  const { data: students = [] } = useQuery({
    queryKey: ["clients", companyId, "uni_student"],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student' }),
    enabled: !!companyId
  });

  const { data: admissions = [] } = useQuery({
    queryKey: ["clients", companyId, "uni_admission"],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_admission' }),
    enabled: !!companyId
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_course"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_course' }),
    enabled: !!companyId
  });

  const { data: faculties = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_faculty"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_faculty' }),
    enabled: !!companyId
  });

  const { data: finances = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_finance"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_finance' }),
    enabled: !!companyId
  });

  const recentStudents = students.slice(0, 4);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_dashboard", "University Dashboard")} 
        subtitle="Comprehensive overview of campus activities and metrics." 
        metrics={[
          { title: "Enrolled Students", value: students.length, icon: Users },
          { title: "Active Courses", value: courses.length, icon: BookOpen },
          { title: "Departments", value: faculties.length, icon: Building },
        ]}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-white/90">New Admissions</CardTitle>
            <GraduationCap className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{admissions.length}</div>
            <p className="text-sm text-indigo-100 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% from last term
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-white/90">Financials (YTD)</CardTitle>
            <DollarSign className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${finances.length * 1500 + 45000}</div>
            <p className="text-sm text-emerald-100 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Steady cash flow
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-white/90">Upcoming Events</CardTitle>
            <Calendar className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-sm text-amber-100 mt-1">
              Next: Orientation
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-white/90">Pending Actions</CardTitle>
            <Building className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14</div>
            <p className="text-sm text-rose-100 mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-100">
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
            <CardDescription>Latest students who have completed registration.</CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No recent enrollments found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentStudents.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        {s.name?.substring(0, 2).toUpperCase() || 'UN'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.email || 'No email provided'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200">
                      Enrolled
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-slate-100">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage key areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200">
              <span className="flex items-center"><GraduationCap className="w-4 h-4 mr-2" /> Review Admissions</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
              <span className="flex items-center"><DollarSign className="w-4 h-4 mr-2" /> Process Payments</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200">
              <span className="flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Update Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
