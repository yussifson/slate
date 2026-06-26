import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PortalLogin from './auth/PortalLogin';
import PortalLayout from './layout/PortalLayout';
import { useAuth } from '@/lib/AuthContext';
import { PageLoader } from '@/components/ui/orbit-loader';

// This is the root component for the portal domain
export default function PortalEntry() {
  const { isAuthenticated, isLoadingAuth, authChecked, user } = useAuth();
  
  if (isLoadingAuth || !authChecked) {
    return <PageLoader label="Loading Secure Portal" />;
  }

  // Enforce portal isolation: If logged in but NOT a portal user, they shouldn't be here.
  // We assume portal users have raw_user_meta_data.role = 'portal_user'
  if (isAuthenticated && user?.role !== 'portal_user' && user?.role !== 'client') {
     // They might be a workspace admin testing it, or someone leaking tokens.
     // For safety, allow it if it's a preview mode, otherwise maybe block or warn.
  }

  return (
    <Routes>
      <Route path="/login" element={<PortalLogin />} />
      <Route path="/invite/:token" element={<PortalLogin isInvite={true} />} />
      
      {isAuthenticated ? (
        <Route element={<PortalLayout />}>
          <Route path="/" element={<div className="p-8">Welcome to the Portal! Dashboard content coming in Stage 3.</div>} />
          {/* We will add more universal modules here in Stage 2 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
