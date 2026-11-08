import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import HRTrainingPanel from '../../components/hr/HRTrainingPanel';

export default function Training() {
  const { user } = useAuth();
  const companyId = user?.company_id;

  const { data: staff = [] } = useQuery({ 
    queryKey: ["staff", companyId], 
    queryFn: async () => { 
      const res = await powerSync.execute("SELECT id, name as full_name, email, role, department, status, salary, start_date as hire_date, phone, company_id FROM univ_hr_employees WHERE company_id = ?", [companyId]); 
      return res.rows?._array || []; 
    }, 
    enabled: !!companyId 
  });
  
  const { data: complaints = [] } = useQuery({ 
    queryKey: ["complaints", companyId], 
    queryFn: () => base44.entities.HRComplaint.filter({ company_id: companyId }, "-created_at", 100), 
    enabled: !!companyId 
  });
  
  const { data: promotions = [] } = useQuery({ 
    queryKey: ["promotions", companyId], 
    queryFn: () => base44.entities.Promotion.filter({ company_id: companyId }, "-created_at", 100), 
    enabled: !!companyId 
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 font-sans">
      <HRTrainingPanel />
    </div>
  );
}
