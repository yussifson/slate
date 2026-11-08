import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import UnivAccessControl from '../../components/universal/UnivAccessControl';

const Roles = () => {
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

  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 font-sans">
      <UnivAccessControl staff={staff} />
    </div>
  );
};

export default Roles;
