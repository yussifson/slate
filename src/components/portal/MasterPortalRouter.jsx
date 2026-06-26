import React, { Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PageLoader } from '@/components/ui/orbit-loader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ShieldAlert } from 'lucide-react';

// ─── LAW / LEGAL ────────────────────────────────────────────────────────────
const LawClientPortal = React.lazy(() => import('@/pages/ClientPortal'));

// ─── HOSPITAL / HEALTHCARE ──────────────────────────────────────────────────
const HospitalPatientPortal = React.lazy(() => import('@/pages/hospital/PatientPortal'));

// ─── HOTEL / HOSPITALITY ────────────────────────────────────────────────────
const HotelGuestPortal = React.lazy(() => import('@/pages/hotel/GuestPortal'));

// ─── LOGISTICS / TRANSPORT ──────────────────────────────────────────────────
const LogisticsTrackingPortal = React.lazy(() => import('@/pages/logistics/TrackingPortal'));

// ─── RELIGION / NGO ─────────────────────────────────────────────────────────
const ReligionMemberPortal = React.lazy(() => import('@/pages/religion/MemberPortal'));

// ─── INSURANCE ──────────────────────────────────────────────────────────────
const InsurancePolicyholderPortal = React.lazy(() => import('@/pages/insurance/PolicyholderPortal'));

// ─── RETAIL / E-COMMERCE ────────────────────────────────────────────────────
const RetailCustomerPortal = React.lazy(() => import('@/pages/retail/CustomerPortal'));

// ─── SCHOOL ─────────────────────────────────────────────────────────────────
const SchoolParentPortal = React.lazy(() => import('@/pages/school/ParentPortal'));
const SchoolStudentPortal = React.lazy(() => import('@/pages/school/StudentPortal'));

// ─── HIGH SCHOOL (same portals as school) ────────────────────────────────────
// Reuses SchoolParentPortal and SchoolStudentPortal above

// ─── UNIVERSITY ─────────────────────────────────────────────────────────────
const UniversityStudentPortal = React.lazy(() => import('@/pages/university/StudentPortal'));

// ─── ONLINE LEARNING / E-LEARNING ──────────────────────────────────────────
const OnlineLearnerPortal = React.lazy(() => import('@/pages/online/LearnerPortal'));

// ─── HR / ERP ────────────────────────────────────────────────────────────────
const HREmployeePortal = React.lazy(() => import('@/pages/hr/EmployeePortal'));

// ─── REAL ESTATE ─────────────────────────────────────────────────────────────
const RealEstateTenantPortal = React.lazy(() => import('@/pages/real-estate/TenantPortal'));
const RealEstateLandlordPortal = React.lazy(() => import('@/pages/real-estate/LandlordPortal'));

// ─── PHARMACY ────────────────────────────────────────────────────────────────
const PharmacyCustomerPortal = React.lazy(() => import('@/pages/pharmacy/CustomerPortal'));

// ─── VOCATIONAL ──────────────────────────────────────────────────────────────
const VocationalTraineePortal = React.lazy(() => import('@/pages/vocational/TraineePortal'));

// ─── FALLBACK (generic) ──────────────────────────────────────────────────────
const GenericClientPortal = React.lazy(() => import('@/pages/ClientPortal'));

/**
 * MasterPortalRouter (Option 3 — Unified System, Role-Based Access)
 *
 * Every client/patient/student/tenant etc. logs into the SAME unified system
 * using the same login page and same subdomain as staff.
 *
 * When they land here (via the /portal route), this component reads:
 *  1. user.company_industry — to know which vertical this workspace is
 *  2. user.role             — to determine which portal view to show
 *                            (e.g., 'patient', 'parent', 'student', 'tenant', 'landlord')
 *
 * Data isolation is enforced at the Supabase RLS layer — each portal page
 * only queries rows linked to the logged-in user's entity ID.
 */
export default function MasterPortalRouter() {
  const { user } = useAuth();

  const industry = user?.company_industry || user?.industry || 'custom';
  const role = (user?.role || 'client').toLowerCase();

  const renderPortal = () => {
    // ── School (primary + high school) ──────────────────────────────────────
    if (['school', 'highschool', 'primary_school'].includes(industry)) {
      if (role === 'student') return <SchoolStudentPortal />;
      return <SchoolParentPortal />; // parent, guardian, default
    }

    // ── University ──────────────────────────────────────────────────────────
    if (industry === 'university') {
      return <UniversityStudentPortal />;
    }

    // ── Online Learning / E-Learning ────────────────────────────────────────
    if (['online', 'elearning', 'online_learning'].includes(industry)) {
      return <OnlineLearnerPortal />;
    }

    // ── Vocational ──────────────────────────────────────────────────────────
    if (industry === 'vocational') {
      return <VocationalTraineePortal />;
    }

    // ── Hospital / Healthcare ───────────────────────────────────────────────
    if (['hospital', 'healthcare', 'clinic'].includes(industry)) {
      return <HospitalPatientPortal />;
    }

    // ── Pharmacy ────────────────────────────────────────────────────────────
    if (industry === 'pharmacy') {
      return <PharmacyCustomerPortal />;
    }

    // ── Hotel / Hospitality ─────────────────────────────────────────────────
    if (['hotel', 'hospitality'].includes(industry)) {
      return <HotelGuestPortal />;
    }

    // ── Real Estate ─────────────────────────────────────────────────────────
    if (['real_estate', 'realestate', 'property'].includes(industry)) {
      if (role === 'landlord' || role === 'owner') return <RealEstateLandlordPortal />;
      return <RealEstateTenantPortal />; // tenant, default
    }

    // ── Logistics / Transport ───────────────────────────────────────────────
    if (['logistics', 'transport', 'shipping'].includes(industry)) {
      return <LogisticsTrackingPortal />;
    }

    // ── Retail / E-commerce ─────────────────────────────────────────────────
    if (['retail', 'ecommerce', 'wholesale'].includes(industry)) {
      return <RetailCustomerPortal />;
    }

    // ── Insurance ───────────────────────────────────────────────────────────
    if (industry === 'insurance') {
      return <InsurancePolicyholderPortal />;
    }

    // ── Religion / NGO / Non-profit ─────────────────────────────────────────
    if (['religion', 'church', 'ngo', 'nonprofit'].includes(industry)) {
      return <ReligionMemberPortal />;
    }

    // ── HR / ERP — employees accessing ESS ─────────────────────────────────
    if (['hr', 'erp', 'manufacturing', 'construction'].includes(industry)) {
      return <HREmployeePortal />;
    }

    // ── Law / Legal ─────────────────────────────────────────────────────────
    if (['law', 'legal', 'firm'].includes(industry)) {
      return <LawClientPortal />;
    }

    // ── Default fallback (agency, consulting, custom, etc.) ─────────────────
    return <GenericClientPortal />;
  };

  // Safety check: block non-portal roles from accidentally loading this
  const allowedRoles = [
    'client', 'patient', 'student', 'parent', 'guardian', 'tenant',
    'landlord', 'owner', 'guest', 'member', 'policyholder', 'trainee',
    'learner', 'employee', 'portal_user',
  ];

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center p-8">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm">
            The client portal is only accessible to invited clients, patients, students, and other portal users.
            <br />Your current role (<strong>{role}</strong>) does not have portal access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader label="Loading your portal..." />}>
        {renderPortal()}
      </Suspense>
    </ErrorBoundary>
  );
}
