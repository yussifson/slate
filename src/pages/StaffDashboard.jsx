import React from "react";
import { useAuth } from "@/lib/AuthContext";
import LawDashboard from "./dashboards/LawDashboard";
import SoftwareDashboard from "./dashboards/SoftwareDashboard";
import RealEstateDashboard from "./dashboards/RealEstateDashboard";
import HospitalDashboard from "./dashboards/HospitalDashboard";
import SchoolDashboard from "./dashboards/SchoolDashboard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";

export default function StaffDashboard() {
  const { user, impersonatedCompany } = useAuth();
  
  const activeIndustry = sessionStorage.getItem('slate_industry_override') || impersonatedCompany?.industry || impersonatedCompany?.industry_type || user?.company_industry || 'law';

  switch (activeIndustry) {
    case 'optavel':
      return <SoftwareDashboard />;
    case 'real_estate':
      return <RealEstateDashboard />;
    case 'hospital':
      return <HospitalDashboard />;
    case 'school':
      return <SchoolDashboard />;
    case 'law':
    default:
      return <LawDashboard />;
  }
}
