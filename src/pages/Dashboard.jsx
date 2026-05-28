import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyDashboard from "./CompanyDashboard";
import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/my-dashboard", { replace: true });
    }
  }, [isAdmin, navigate]);

  return isAdmin ? <CompanyDashboard /> : null;
}