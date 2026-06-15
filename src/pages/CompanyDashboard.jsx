import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@powersync/react";
import { base44 } from "@/api/base44Client"; // Keep for other possible uses, or remove if unused
import LawDashboard from "@/components/dashboard/LawDashboard";
import SchoolDashboard from "@/components/dashboard/SchoolDashboard";
import HospitalDashboard from "@/components/dashboard/HospitalDashboard";
import GenericDashboard from "@/components/dashboard/GenericDashboard";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { impersonatedCompany } = useImpersonation();
  const defaultCompanyId = useCompanyId();
  const companyId = impersonatedCompany?.id || user?.company_id || defaultCompanyId;

  // Use PowerSync to read from the unified offline DB instead of base44 network calls
  const { data: companies = [] } = useQuery("SELECT * FROM companies WHERE id = ?", [companyId]);
  const company = companies.length > 0 ? companies[0] : null;

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