import React from "react";
import { Navigate } from "react-router-dom";
import CompanyDashboard from "./CompanyDashboard";
import OrbitDashboard from "./OrbitDashboard";
import StaffDashboard from "./StaffDashboard";
import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = ["super_admin", "company_admin", "admin", "managing_partner"].includes(user?.role);

  const savedModulesStr = localStorage.getItem(`active_modules_${user?.company_id}`);
  const activeModules = savedModulesStr ? JSON.parse(savedModulesStr) : null;
  const isOrbitMode = user?.company_industry === 'orbit_build' || (activeModules?.length === 1 && activeModules[0] === '__orbit__');

  if (user?.role === "enterprise_admin") {
    return <Navigate to="/enterprise-admin" replace />;
  }
  
  if (!isAdmin) {
    return <StaffDashboard />;
  }

  return isOrbitMode ? <OrbitDashboard /> : <CompanyDashboard />;
}
