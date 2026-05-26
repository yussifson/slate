import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Returns the ID of the Company record for this user.
 * All staff/cases/clients etc. belong to this company.
 */
export function useCompanyId() {
  const { user } = useAuth();
  return user?.company_id || null;
}

export function useCompany() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
  return { company: companies[0] || null, isLoading: isLoading && !!companyId };
}