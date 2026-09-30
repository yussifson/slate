import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyDashboard from "./CompanyDashboard";
import OrbitDashboard from "./OrbitDashboard";
import AdaptiveDashboard from "./omnicore/AdaptiveDashboard";
import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ["super_admin", "company_admin", "admin", "managing_partner"].includes(user?.role);

  const [versionOverride, setVersionOverride] = useState(() => {
    return sessionStorage.getItem('slate_version_override') || localStorage.getItem('slate_version_override') || 'v1';
  });

  useEffect(() => {
    const handleVersionChange = () => {
      const current = sessionStorage.getItem('slate_version_override') || localStorage.getItem('slate_version_override') || 'v1';
      setVersionOverride(current);
    };
    window.addEventListener('slate_version_change', handleVersionChange);
    return () => window.removeEventListener('slate_version_change', handleVersionChange);
  }, []);

  const savedModulesStr = localStorage.getItem(`active_modules_${user?.company_id}`);
  const activeModules = savedModulesStr ? JSON.parse(savedModulesStr) : null;
  const isOrbitMode = user?.company_industry === 'orbit_build' || (activeModules?.length === 1 && activeModules[0] === '__orbit__');

  useEffect(() => {
    if (user?.role === "enterprise_admin") {
      navigate("/enterprise-admin", { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate("/my-dashboard", { replace: true });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  // When V2 is active via super admin toggle or system flag, render AdaptiveDashboard
  if (versionOverride === 'v2') {
    return <AdaptiveDashboard />;
  }

  return isOrbitMode ? <OrbitDashboard /> : <CompanyDashboard />;
}

