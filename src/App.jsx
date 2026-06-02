import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { ImpersonationProvider } from '@/lib/ImpersonationContext';
import { VideoProvider } from '@/lib/VideoContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import React, { useEffect } from 'react';
import { PowerSyncContext } from '@powersync/react';
import { HelmetProvider } from 'react-helmet-async';
import { powerSync, initPowerSync } from './api/PowerSyncConnector';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#ffebee', minHeight: '100vh' }}>
          <h2>Something went wrong in the UI.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

// Original Page imports
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases.jsx';
import Clients from './pages/Clients.jsx';
import CalendarPage from './pages/CalendarPage';
import Invoices from './pages/Invoices';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Team from './pages/Team';

import Settings from './pages/Settings';
import CustomFieldsSettings from './pages/settings/CustomFields';
import ClientPortal from './pages/ClientPortal';
import CaseDetail from './pages/CaseDetail';
import StaffDashboard from './pages/StaffDashboard';
import IntakeForm from './pages/IntakeForm';
import Leads from './pages/Leads';
import BillingDashboard from './pages/BillingDashboard';
import CasePipelinePage from './pages/CasePipelinePage';
import LegalResearch from './pages/LegalResearch';
import AuditLog from './pages/AuditLog';
import LeaveManagement from './pages/LeaveManagement';
import PerformanceDashboard from './pages/PerformanceDashboard';
import CaseOutcomes from './pages/CaseOutcomes';
import ConflictChecker from './pages/ConflictChecker';
import EmailInbox from './pages/EmailInbox';
import ReportsDashboard from './pages/ReportsDashboard';
import DataExport from './pages/DataExport';
import WhatsAppMessenger from './pages/WhatsAppMessenger';
import HRDashboard from './pages/HRDashboard';
import Chat from './pages/Chat';
import Board from './pages/Board';

// School Pages
import SchoolStudents from './pages/school/Students';
import SchoolClasses from './pages/school/Classes';
import SchoolTimetable from './pages/school/Timetable';
import SchoolAttendance from './pages/school/Attendance';
import SchoolGrades from './pages/school/Grades';
import SchoolExams from './pages/school/Exams';
import SchoolFees from './pages/school/FeeManagement';
import SchoolLibrary from './pages/school/Library';
import SchoolParentPortal from './pages/school/ParentPortal';
import SchoolStudentPortal from './pages/school/StudentPortal';

// Hospital Pages
import HospitalPatients from './pages/hospital/Patients';
import HospitalAppointments from './pages/hospital/Appointments';
import HospitalWards from './pages/hospital/Wards';
import HospitalPrescriptions from './pages/hospital/Prescriptions';
import HospitalLabResults from './pages/hospital/LabResults';
import HospitalPharmacy from './pages/hospital/Pharmacy';
import HospitalPatientPortal from './pages/hospital/PatientPortal';

// Hotel Pages
import HotelFrontDesk from './pages/hotel/FrontDesk';
import HotelReservations from './pages/hotel/Reservations';
import HotelRooms from './pages/hotel/Rooms';
import HotelHousekeeping from './pages/hotel/Housekeeping';
import HotelRestaurant from './pages/hotel/Restaurant';
import HotelGuestRequests from './pages/hotel/GuestRequests';
import HotelGuestPortal from './pages/hotel/GuestPortal';

// Church Pages
import ChurchMembers from './pages/church/Members';
import ChurchMinistries from './pages/church/Ministries';
import ChurchEvents from './pages/church/Events';
import ChurchTithes from './pages/church/Tithes';
import ChurchVolunteers from './pages/church/Volunteers';
import ChurchSermons from './pages/church/Sermons';
import ChurchSmallGroups from './pages/church/SmallGroups';
import ChurchPrayers from './pages/church/Prayers';
import ChurchMemberPortal from './pages/church/MemberPortal';

// Insurance Pages
import InsurancePolicies from './pages/insurance/Policies';
import InsuranceClaims from './pages/insurance/Claims';
import InsuranceClients from './pages/insurance/Clients';
import InsurancePolicyholderPortal from './pages/insurance/PolicyholderPortal';
import InsuranceUnderwriting from './pages/insurance/Underwriting';
import InsuranceAgentPerformance from './pages/insurance/AgentPerformance';
import InsurancePremiums from './pages/insurance/Premiums';

// Retail Pages
import RetailDashboard from './pages/retail/RetailDashboard';
import RetailPurchaseOrders from './pages/retail/PurchaseOrders';
import RetailPromotions from './pages/retail/Promotions';
import RetailInventory from './pages/retail/Inventory';
import RetailPOS from './pages/retail/POS';
import RetailSales from './pages/retail/Sales';
import RetailSuppliers from './pages/retail/Suppliers';
import Products from './pages/retail/Products';
import Orders from './pages/retail/Orders';
import Loyalty from './pages/retail/Loyalty';
import Shifts from './pages/retail/Shifts';
import RetailCustomers from './pages/retail/Customers';
import RetailCustomerPortal from './pages/retail/CustomerPortal';

// Logistics Pages
import LogisticsShipments from './pages/logistics/Shipments';
import LogisticsFleet from './pages/logistics/Fleet';
import LogisticsDrivers from './pages/logistics/Drivers';
import LogisticsTrackingPortal from './pages/logistics/TrackingPortal';
import LogisticsWarehouses from './pages/logistics/Warehouses';

// HR Pages
import HREmployees from './pages/hr/Employees';
import HRRecruitment from './pages/hr/Recruitment';
import HRPayroll from './pages/hr/Payroll';
import HRLeave from './pages/hr/Leave';

// Layout
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import { getSubdomainAndBase } from '@/lib/domainUtils';
import MarketingLayout from './components/layout/MarketingLayout';
import Home from './pages/marketing/Home';
import Features from './pages/marketing/Features';
import Pricing from './pages/marketing/Pricing';
import About from './pages/marketing/About';
import Contact from './pages/marketing/Contact';
import EnterpriseContact from './pages/marketing/EnterpriseContact';
import Integrations from './pages/marketing/Integrations';
import Changelog from './pages/marketing/Changelog';
import Careers from './pages/marketing/Careers';
import Partners from './pages/marketing/Partners';
import LegalDocs from './pages/marketing/LegalDocs';
import OnboardingWizard from './pages/OnboardingWizard';
import AppIntegrations from './pages/Integrations';
import GenericModulePage from './pages/GenericModulePage';
import CreateModulePage from './pages/CreateModulePage';
import Marketplace from './pages/Marketplace';

// Admin Ecosystem Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminFirms from './pages/admin/AdminFirms';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBilling from './pages/admin/AdminBilling';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminBroadcasts from './pages/admin/AdminBroadcasts';

function PlatformRoutes() {
  return (
    <>
      {/* Core / Shared Pages */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/cases" element={<Cases />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/invoices" element={<Invoices />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/team" element={<Team />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/custom-fields" element={<CustomFieldsSettings />} />
      <Route path="/integrations" element={<AppIntegrations />} />
      <Route path="/client-portal" element={<ClientPortal />} />
      <Route path="/cases/:id" element={<CaseDetail />} />
      <Route path="/my-dashboard" element={<StaffDashboard />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/billing" element={<BillingDashboard />} />
      <Route path="/pipeline" element={<CasePipelinePage />} />
      <Route path="/research" element={<LegalResearch />} />
      <Route path="/audit" element={<AuditLog />} />
      <Route path="/leave" element={<LeaveManagement />} />
      <Route path="/performance" element={<PerformanceDashboard />} />
      <Route path="/outcomes" element={<CaseOutcomes />} />
      <Route path="/conflict-check" element={<ConflictChecker />} />
      <Route path="/email-inbox" element={<EmailInbox />} />
      <Route path="/reports" element={<ReportsDashboard />} />
      <Route path="/export" element={<DataExport />} />
      <Route path="/whatsapp" element={<WhatsAppMessenger />} />
      <Route path="/hr" element={<HRDashboard />} />
      <Route path="/firm-setup" element={<OnboardingWizard />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/board" element={<Board />} />

      {/* School Suite */}
      <Route path="/students" element={<SchoolStudents />} />
      <Route path="/classes" element={<SchoolClasses />} />
      <Route path="/timetable" element={<SchoolTimetable />} />
      <Route path="/attendance" element={<SchoolAttendance />} />
      <Route path="/grades" element={<SchoolGrades />} />
      <Route path="/exams" element={<SchoolExams />} />
      <Route path="/fees" element={<SchoolFees />} />
      <Route path="/library" element={<SchoolLibrary />} />
      <Route path="/parent-portal" element={<SchoolParentPortal />} />
      <Route path="/student-portal" element={<SchoolStudentPortal />} />

      {/* Hospital Suite */}
      <Route path="/patients" element={<HospitalPatients />} />
      <Route path="/appointments" element={<HospitalAppointments />} />
      <Route path="/wards" element={<HospitalWards />} />
      <Route path="/prescriptions" element={<HospitalPrescriptions />} />
      <Route path="/lab-results" element={<HospitalLabResults />} />
      <Route path="/pharmacy" element={<HospitalPharmacy />} />
      <Route path="/patient-portal" element={<HospitalPatientPortal />} />

      {/* Hotel Suite */}
      <Route path="/front-desk" element={<HotelFrontDesk />} />
      <Route path="/reservations" element={<HotelReservations />} />
      <Route path="/rooms" element={<HotelRooms />} />
      <Route path="/housekeeping" element={<HotelHousekeeping />} />
      <Route path="/restaurant" element={<HotelRestaurant />} />
      <Route path="/guest-requests" element={<HotelGuestRequests />} />
      <Route path="/guest-portal" element={<HotelGuestPortal />} />

      {/* Church Suite */}
      <Route path="/members" element={<ChurchMembers />} />
      <Route path="/ministries" element={<ChurchMinistries />} />
      <Route path="/events" element={<ChurchEvents />} />
      <Route path="/tithes" element={<ChurchTithes />} />
      <Route path="/volunteers" element={<ChurchVolunteers />} />
      <Route path="/sermons" element={<ChurchSermons />} />
      <Route path="/small-groups" element={<ChurchSmallGroups />} />
      <Route path="/prayers" element={<ChurchPrayers />} />
      <Route path="/member-portal" element={<ChurchMemberPortal />} />

      {/* Insurance Suite */}
      <Route path="/policies" element={<InsurancePolicies />} />
      <Route path="/claims" element={<InsuranceClaims />} />
      <Route path="/insurance-clients" element={<InsuranceClients />} />
      <Route path="/policyholder-portal" element={<InsurancePolicyholderPortal />} />
      <Route path="/underwriting" element={<InsuranceUnderwriting />} />
      <Route path="/agent-performance" element={<InsuranceAgentPerformance />} />
      <Route path="/premiums" element={<InsurancePremiums />} />

      {/* Retail Suite */}
      <Route path="/retail-dashboard" element={<RetailDashboard />} />
      <Route path="/purchase-orders" element={<RetailPurchaseOrders />} />
      <Route path="/promotions" element={<RetailPromotions />} />
      <Route path="/pos" element={<RetailPOS />} />
      <Route path="/inventory" element={<RetailInventory />} />
      <Route path="/sales" element={<RetailSales />} />
      <Route path="/suppliers" element={<RetailSuppliers />} />
      <Route path="/retail-customers" element={<RetailCustomers />} />
      <Route path="/customer-portal" element={<RetailCustomerPortal />} />

      {/* Logistics Suite */}
      <Route path="/shipments" element={<LogisticsShipments />} />
      <Route path="/fleet" element={<LogisticsFleet />} />
      <Route path="/drivers" element={<LogisticsDrivers />} />
      <Route path="/tracking" element={<LogisticsTrackingPortal />} />
      <Route path="/warehouse" element={<LogisticsWarehouses />} />

      {/* HR Suite */}
      <Route path="/employees" element={<HREmployees />} />
      <Route path="/recruitment" element={<HRRecruitment />} />
      <Route path="/payroll" element={<HRPayroll />} />
      <Route path="/hr-leave" element={<HRLeave />} />

      {/* Missing Industry Pages mapped to GenericModulePage */}
      <Route path="/products" element={<Products />} />
      <Route path="/org-chart" element={<GenericModulePage />} />
      <Route path="/disciplinary" element={<GenericModulePage />} />
      <Route path="/dispatch" element={<GenericModulePage />} />
      <Route path="/shifts" element={<Shifts />} />
      <Route path="/benefits" element={<GenericModulePage />} />
      <Route path="/routes" element={<GenericModulePage />} />
      <Route path="/training" element={<GenericModulePage />} />
      <Route path="/loyalty" element={<Loyalty />} />
      <Route path="/pickups" element={<GenericModulePage />} />
      <Route path="/orders" element={<Orders />} />
      
      {/* OrbitBolt & Builder */}
      <Route path="/modules/BOLT" element={<CreateModulePage isBoltOpen={true} />} />
      <Route path="/modules/create" element={<CreateModulePage />} />
      <Route path="/modules/edit/:id" element={<CreateModulePage />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/m/*" element={<GenericModulePage />} />
    </>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  
  // Show spinner while auth is loading OR while auth hasn't been checked yet
  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Use React Router Navigate instead of window.location.href to avoid
    // an irreversible hard page reload that cannot be cancelled
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

function App() {
  const { currentSubdomain } = getSubdomainAndBase();
  const isBaseDomain = currentSubdomain === null;

  useEffect(() => {
    initPowerSync().catch(console.error);
  }, []);

  return (
    <PowerSyncContext.Provider value={powerSync}>
    <HelmetProvider>
    <AuthProvider>
      <ThemeProvider>
        <ImpersonationProvider>
          <VideoProvider>
            <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ErrorBoundary>
                {isBaseDomain ? (
                  /* Storefront Routes for the Base Domain */
                  <Routes>
                    <Route element={<MarketingLayout><Outlet /></MarketingLayout>}>
                      <Route path="/" element={<Home />} />
                      <Route path="/features" element={<Features />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/enterprise-contact" element={<EnterpriseContact />} />
                      <Route path="/integrations" element={<Integrations />} />
                      <Route path="/changelog" element={<Changelog />} />
                      <Route path="/careers" element={<Careers />} />
                      <Route path="/partners" element={<Partners />} />
                      <Route path="/legal" element={<LegalDocs />} />
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    
                    <Route element={<ProtectedRoute />}>
                      <Route path="/onboarding" element={<OnboardingWizard />} />
                      
                      {/* Super Admin Base Domain Dashboard */}
                      <Route element={<AppLayout />}>
                        <Route path="/admin" element={<AdminOverview />} />
                        <Route path="/admin/firms" element={<AdminFirms />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/billing" element={<AdminBilling />} />
                        <Route path="/admin/security" element={<AdminSecurity />} />
                        <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />

                        {PlatformRoutes()}
                      </Route>
                    </Route>
                    
                    <Route path="/intake" element={<IntakeForm />} />
                    <Route path="*" element={<PageNotFound />} />
                  </Routes>
                ) : (
                  /* App Routes for Subdomains */
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    
                    <Route element={<ProtectedRoute />}>
                      <Route element={<AppLayout />}>
                        <Route path="/admin" element={<AdminOverview />} />
                        <Route path="/admin/firms" element={<AdminFirms />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/billing" element={<AdminBilling />} />
                        <Route path="/admin/security" element={<AdminSecurity />} />
                        <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />

                        {PlatformRoutes()}
                      </Route>
                      <Route path="/intake" element={<IntakeForm />} />
                      <Route path="/onboarding" element={<OnboardingWizard />} />
                      <Route path="*" element={<PageNotFound />} />
                    </Route>
                  </Routes>
                )}
              </ErrorBoundary>
            </Router>
          </QueryClientProvider>
          </VideoProvider>
        </ImpersonationProvider>
      </ThemeProvider>
    </AuthProvider>
    </HelmetProvider>
    </PowerSyncContext.Provider>
  );
}

export default App;