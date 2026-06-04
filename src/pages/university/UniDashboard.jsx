import React from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Users, BookOpen, Building } from 'lucide-react';

export default function UniDashboard() {
  const { t } = useTranslation();
  const companyId = useCompanyId();

  const { data: students = [] } = useQuery({
    queryKey: ["clients", companyId, "uni_student"],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student' }),
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

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_dashboard", "University Dashboard")} 
        subtitle="Overview of your university campus." 
        metrics={[
          { title: "Students", value: students.length, icon: Users },
          { title: "Courses", value: courses.length, icon: BookOpen },
          { title: "Faculties", value: faculties.length, icon: Building },
        ]}
      />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>University Dashboard analytics go here. (Under construction)</p>
      </div>
    </div>
  );
}
