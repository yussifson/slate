import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyDashboard from "./CompanyDashboard";
import OrbitDashboard from "./OrbitDashboard";
import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);

  const savedModulesStr = localStorage.getItem(`active_modules_${user?.company_id}`);
  const activeModules = savedModulesStr ? JSON.parse(savedModulesStr) : null;
  const isOrbitMode = user?.company_industry === 'orbit_build' || (activeModules?.length === 1 && activeModules[0] === '__orbit__');

  useEffect(() => {
    if (!isAdmin) {
      navigate("/my-dashboard", { replace: true });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return isOrbitMode ? <OrbitDashboard /> : <CompanyDashboard />;
}