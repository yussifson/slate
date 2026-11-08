import React from 'react';
import IntelligenceDashboard from '@/components/IntelligenceDashboard';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Intelligence() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if unauthenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-6 lg:p-8 pb-24 sm:pb-12 transition-all duration-300 ease-in-out">
      <div className="w-full max-w-7xl mx-auto">
        <IntelligenceDashboard />
      </div>
    </div>
  );
}
