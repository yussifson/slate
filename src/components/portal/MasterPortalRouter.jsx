import React, { Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PageLoader } from '@/components/ui/orbit-loader';

// Import portals using React.lazy to keep bundle size small
const HospitalPatientPortal = React.lazy(() => import('@/pages/hospital/PatientPortal'));
const HotelGuestPortal = React.lazy(() => import('@/pages/hotel/GuestPortal'));
const RetailCustomerPortal = React.lazy(() => import('@/pages/retail/CustomerPortal'));
const SchoolParentPortal = React.lazy(() => import('@/pages/school/ParentPortal'));
const SchoolStudentPortal = React.lazy(() => import('@/pages/school/StudentPortal'));
const LogisticsTrackingPortal = React.lazy(() => import('@/pages/logistics/TrackingPortal'));
const ReligionMemberPortal = React.lazy(() => import('@/pages/religion/MemberPortal'));
const InsurancePolicyholderPortal = React.lazy(() => import('@/pages/insurance/PolicyholderPortal'));
const UnivClientPortal = React.lazy(() => import('@/components/universal/UnivClientPortal'));
const GenericClientPortal = React.lazy(() => import('@/pages/ClientPortal'));

export default function MasterPortalRouter() {
  const { user } = useAuth();
  const industry = user?.company_industry || 'custom';
  const role = user?.role || 'client';

  const renderPortal = () => {
    // School special cases
    if (industry === 'school' || industry === 'university' || industry === 'highschool') {
      if (role === 'parent') return <SchoolParentPortal />;
      if (role === 'student') return <SchoolStudentPortal />;
      return <SchoolParentPortal />; // Fallback
    }

    // Direct Mappings
    switch (industry) {
      case 'hospital':
        return <HospitalPatientPortal />;
      case 'hotel':
        return <HotelGuestPortal />;
      case 'retail':
        return <RetailCustomerPortal />;
      case 'logistics':
        return <LogisticsTrackingPortal />;
      case 'religion':
        return <ReligionMemberPortal />;
      case 'insurance':
        return <InsurancePolicyholderPortal />;
      case 'law':
        return <GenericClientPortal />; // Existing law portal is ClientPortal.jsx
      default:
        // For custom industries or standard B2B like Agency, Finance, Consulting:
        // Use the Universal Client Portal configured dynamically
        return <UnivClientPortal title={user?.company_name || 'Client'} />;
    }
  };

  return (
    <Suspense fallback={<PageLoader text="Loading your portal..." />}>
      {renderPortal()}
    </Suspense>
  );
}
