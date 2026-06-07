import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import LawDashboard from "@/components/dashboard/LawDashboard";
import SchoolDashboard from "@/components/dashboard/SchoolDashboard";
import HospitalDashboard from "@/components/dashboard/HospitalDashboard";
import GenericDashboard from "@/components/dashboard/GenericDashboard";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { impersonatedCompany } = useImpersonation();
  const defaultCompanyId = useCompanyId();
  const companyId = impersonatedCompany?.id || user?.company_id || defaultCompanyId;

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const list = await base44.entities.Company.list();
      return list.find(c => c.id === companyId) || null;
    },
    enabled: !!companyId,
  });

  const isAdmin = ["company_admin", "super_admin", "admin"].includes(user?.role);
  const industry = sessionStorage.getItem('slate_industry_override') || company?.industry_type || user?.company_industry || "law";

  if (industry === 'law') {
    return <LawDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'school') {
    return <SchoolDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'hospital') {
    return <HospitalDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else {
    return <GenericDashboard companyId={companyId} company={company} isAdmin={isAdmin} industry={industry} />;
  }
}