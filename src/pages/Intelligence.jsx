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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 transition-all duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto">
        <IntelligenceDashboard />
      </div>
    </div>
  );
}
