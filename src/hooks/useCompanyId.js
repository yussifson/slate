import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

/**
 * Returns the ID of the Company record for this user.
 */
export function useCompanyId() {
  const { user } = useAuth();
  return user?.company_id || null;
}

export function useCompany() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const { data: company = null, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      if (error) { console.error("useCompany fetch error:", error); return null; }
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const override = typeof window !== 'undefined' ? sessionStorage.getItem('optalflow_industry_override') : null;

  let finalCompany = company;
  if (user?.role === 'super_admin') {
    if (!finalCompany) {
      finalCompany = {
        id: 'super_admin_company',
        name: 'Super Admin Co',
        industry_type: override || 'law'
      };
    } else if (override) {
      finalCompany = {
        ...finalCompany,
        industry_type: override
      };
    }
  }

  return { company: finalCompany, isLoading: isLoading && !!companyId };
}