import React, { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@powersync/react";
import { base44 } from "@/api/base44Client"; // Keep for other possible uses, or remove if unused
import LawDashboard from "@/components/dashboard/LawDashboard";
import SchoolDashboard from "@/components/dashboard/SchoolDashboard";
import HospitalDashboard from "@/components/dashboard/HospitalDashboard";
import HotelDashboard from "@/components/dashboard/HotelDashboard";
import InsuranceDashboard from "@/components/dashboard/InsuranceDashboard";
import ReligionDashboard from "@/components/dashboard/ReligionDashboard";
import RetailDashboard from "@/components/dashboard/RetailDashboard";
import LogisticsDashboard from "@/components/dashboard/LogisticsDashboard";
import GenericDashboard from "@/components/dashboard/GenericDashboard";
import RealEstateDashboard from "@/pages/real-estate/RealEstateDashboard";
import PharmacyDashboard from "@/pages/pharmacy/Dashboard";
import OptavelCommandCenter from "@/pages/optavel/OptavelCommandCenter";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { impersonatedCompany } = useImpersonation();
  const defaultCompanyId = useCompanyId();
  const companyId = impersonatedCompany?.id || user?.company_id || defaultCompanyId;

  // Use PowerSync to read from the unified offline DB instead of base44 network calls
  const { data: companies = [] } = useQuery("SELECT * FROM companies WHERE id = ?", [companyId]);
  const company = companies.length > 0 ? companies[0] : null;

  const isAdmin = ["company_admin", "super_admin", "admin"].includes(user?.role);
  const dbIndustry = company?.industry_type;
  const userIndustry = user?.company_industry;
  const resolvedDbIndustry = (dbIndustry === 'law' && userIndustry && userIndustry !== 'law') ? userIndustry : dbIndustry;

  // Priority: sessionStorage override > impersonated user > DB > user object > localStorage > fallback
  const industry = sessionStorage.getItem('slate_industry_override') 
    || impersonatedCompany?.industry
    || impersonatedCompany?.industry_type
    || resolvedDbIndustry 
    || userIndustry 
    || localStorage.getItem('slate_onboarding_industry')
    || "law";

  // Once the company has fully synced its industry_type from the DB, clear the temporary localStorage key
  useEffect(() => {
    if (company?.industry_type) {
      localStorage.removeItem('slate_onboarding_industry');
    }
  }, [company?.industry_type]);

  if (industry === 'law') {
    return <LawDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'school' || industry === 'highschool' || industry === 'university' || industry === 'online' || industry === 'vocational') {
    return <SchoolDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'hospital') {
    return <HospitalDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'hotel') {
    return <HotelDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'insurance') {
    return <InsuranceDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'religion') {
    return <ReligionDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'retail') {
    return <RetailDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'logistics') {
    return <LogisticsDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'real_estate' || industry === 'realestate') {
    return <RealEstateDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'pharmacy') {
    return <PharmacyDashboard companyId={companyId} company={company} isAdmin={isAdmin} />;
  } else if (industry === 'software' || industry === 'optavel_software') {
    return <OptavelCommandCenter />;
  } else {
    return <GenericDashboard companyId={companyId} company={company} isAdmin={isAdmin} industry={industry} />;
  }
}
