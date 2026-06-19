import React from 'react';
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Intelligence() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not an admin/manager with access
  React.useEffect(() => {
    if (!user || !['super_admin', 'company_admin', 'managing_partner'].includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="p-6">
      <IntelligenceDashboard />
    </div>
  );
}
