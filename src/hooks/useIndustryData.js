import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useCompany } from './useCompanyId';

/**
 * Hook to fetch generic industry records
 * @param {string} recordType - e.g. 'student', 'patient', 'reservation'
 * @returns React Query object with data, isLoading, error
 */
export function useIndustryRecords(recordType) {
  const { company } = useCompany();
  const companyId = company?.id;
  const industry = company?.industry_type;

  return useQuery({
    queryKey: ['industry_records', companyId, industry, recordType],
    queryFn: async () => {
      if (!companyId || !industry || !recordType) return [];

      const { data, error } = await supabase
        .from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('industry', industry)
        .eq('record_type', recordType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!industry && !!recordType,
  });
}



/**
 * Hook to create or update an industry record
 * @returns Mutation object with mutate function
 */
export function useMutateIndustryRecord() {
  const queryClient = useQueryClient();
  const { company } = useCompany();
  const companyId = company?.id;
  const industry = company?.industry_type;

  return useMutation({
    mutationFn: async ({ id, recordType, payload, status, searchText }) => {
      if (!companyId || !industry || !recordType) {
        throw new Error("Missing context to save record.");
      }

      const record = {
        company_id: companyId,
        industry,
        record_type: recordType,
        data: payload,
        status: status || null,
        search_text: searchText || null,
      };

      let result;
      if (id) {
        // Update existing record
        result = await supabase
          .from('industry_records')
          .update(record)
          .eq('id', id)
          .select()
          .single();
      } else {
        // Insert new record
        result = await supabase
          .from('industry_records')
          .insert(record)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate the cache to trigger a refetch
      queryClient.invalidateQueries(['industry_records', companyId, industry, data.record_type]);
    },
  });
}

/**
 * Hook to delete an industry record
 */
export function useDeleteIndustryRecord() {
  const queryClient = useQueryClient();
  const { company } = useCompany();

  return useMutation({
    mutationFn: async ({ id, recordType }) => {
      const { error } = await supabase
        .from('industry_records')
        .delete()
        .eq('id', id)
        .eq('company_id', company?.id);

      if (error) throw error;
      return { id, recordType };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['industry_records', company?.id, company?.industry_type, data.recordType]);
    },
  });
}
