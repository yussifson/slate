import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Toaster as HotToaster } from "react-hot-toast"
import { useToast } from "@/components/ui/use-toast"
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
const JoinMeeting = React.lazy(() => import('@/pages/JoinMeeting'));
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { ImpersonationProvider } from '@/lib/ImpersonationContext';
import { VideoProvider } from '@/lib/VideoContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import EnterpriseDashboard from './pages/EnterpriseDashboard';
import Intelligence from '@/pages/Intelligence';
import GlobalAnalyticsDashboard from '@/pages/GlobalAnalyticsDashboard';
// React imported at the top
import { PowerSyncContext } from '@powersync/react';
import { HelmetProvider } from 'react-helmet-async';
import { powerSync, initPowerSync } from './api/PowerSyncConnector';
import { supabase } from './api/supabaseClient';
import { OrbitLoader, PageLoader } from '@/components/ui/orbit-loader';
const UnivCRM = React.lazy(() => import('@/components/universal/UnivCRM'));
const UnivProject = React.lazy(() => import('@/components/universal/UnivProject'));
const UnivContactManagement = React.lazy(() => import('@/components/universal/UnivContactManagement'));
const UnivKanban = React.lazy(() => import('@/components/universal/UnivKanban'));
const UnivDocument = React.lazy(() => import('@/components/universal/UnivDocument'));
const UnivInventory = React.lazy(() => import('@/components/universal/UnivInventory'));
const UnivHREmployee = React.lazy(() => import('@/components/universal/UnivHREmployee'));
const UnivHRSystem = React.lazy(() => import('@/components/universal/UnivHRSystem'));
const UnivInvoice = React.lazy(() => import('@/components/universal/UnivInvoice'));
const UnivPayroll = React.lazy(() => import('@/components/universal/UnivPayroll'));
const UnivRecruitment = React.lazy(() => import('@/components/universal/UnivRecruitment'));
const UnivAttendance = React.lazy(() => import('@/components/universal/UnivAttendance'));
const UnivLeaveManagement = React.lazy(() => import('@/components/universal/UnivLeaveManagement'));
const UnivPayment = React.lazy(() => import('@/components/universal/UnivPayment'));
const UnivAssetManagement = React.lazy(() => import('@/components/universal/UnivAssetManagement'));
const UnivProcurement = React.lazy(() => import('@/components/universal/UnivProcurement'));
const UnivAnalytics = React.lazy(() => import('@/components/universal/UnivAnalytics'));
const UnivBOM = React.lazy(() => import('@/components/universal/UnivBOM'));
const UnivBOQ = React.lazy(() => import('@/components/universal/UnivBOQ'));
const UnivBooking = React.lazy(() => import('@/components/universal/UnivBooking'));
const UnivCalendar = React.lazy(() => import('@/components/universal/UnivCalendar'));
const UnivCaseManagement = React.lazy(() => import('@/components/universal/UnivCaseManagement'));
const UnivClassAttendance = React.lazy(() => import('@/components/universal/UnivClassAttendance'));
const UnivClientPortal = React.lazy(() => import('@/components/universal/UnivClientPortal'));
const UnivContractor = React.lazy(() => import('@/components/universal/UnivContractor'));
const UnivCourse = React.lazy(() => import('@/components/universal/UnivCourse'));
const UnivCourtCalendar = React.lazy(() => import('@/components/universal/UnivCourtCalendar'));
const UnivDashboard = React.lazy(() => import('@/components/universal/UnivDashboard'));
const UnivDataGrid = React.lazy(() => import('@/components/universal/UnivDataGrid'));
const UnivDelivery = React.lazy(() => import('@/components/universal/UnivDelivery'));
const UnivDining = React.lazy(() => import('@/components/universal/UnivDining'));
const UnivDispatch = React.lazy(() => import('@/components/universal/UnivDispatch'));
const UnivEMR = React.lazy(() => import('@/components/universal/UnivEMR'));
const UnivFaculty = React.lazy(() => import('@/components/universal/UnivFaculty'));
const UnivFleet = React.lazy(() => import('@/components/universal/UnivFleet'));
const UnivForm = React.lazy(() => import('@/components/universal/UnivForm'));
const UnivGradebook = React.lazy(() => import('@/components/universal/UnivGradebook'));
const UnivHousekeeping = React.lazy(() => import('@/components/universal/UnivHousekeeping'));
const UnivLMS = React.lazy(() => import('@/components/universal/UnivLMS'));
const UnivLab = React.lazy(() => import('@/components/universal/UnivLab'));
const UnivLegalDocument = React.lazy(() => import('@/components/universal/UnivLegalDocument'));
const UnivAppointments = React.lazy(() => import('@/components/universal/UnivAppointments'));
const UnivMachine = React.lazy(() => import('@/components/universal/UnivMachine'));
const UnivMenu = React.lazy(() => import('@/components/universal/UnivMenu'));
const UnivMessaging = React.lazy(() => import('@/components/universal/UnivMessaging'));
const UnivNotification = React.lazy(() => import('@/components/universal/UnivNotification'));
const UnivParentPortal = React.lazy(() => import('@/components/universal/UnivParentPortal'));
const UnivPatient = React.lazy(() => import('@/components/universal/UnivPatient'));
const UnivPOS = React.lazy(() => import('@/components/universal/UnivPOS'));
const UnivPrescription = React.lazy(() => import('@/components/universal/UnivPrescription'));
const UnivProduction = React.lazy(() => import('@/components/universal/UnivProduction'));
const UnivQualityControl = React.lazy(() => import('@/components/universal/UnivQualityControl'));
const UnivRoom = React.lazy(() => import('@/components/universal/UnivRoom'));
const UnivRoute = React.lazy(() => import('@/components/universal/UnivRoute'));
const UnivSafety = React.lazy(() => import('@/components/universal/UnivSafety'));
const UnivSearch = React.lazy(() => import('@/components/universal/UnivSearch'));
const UnivSiteInspection = React.lazy(() => import('@/components/universal/UnivSiteInspection'));
const UnivStudent = React.lazy(() => import('@/components/universal/UnivStudent'));
const UnivSubscription = React.lazy(() => import('@/components/universal/UnivSubscription'));
const UnivTelemedicine = React.lazy(() => import('@/components/universal/UnivTelemedicine'));
const UnivTimeline = React.lazy(() => import('@/components/universal/UnivTimeline'));
const UnivWard = React.lazy(() => import('@/components/universal/UnivWard'));
const UnivWarehouse = React.lazy(() => import('@/components/universal/UnivWarehouse'));

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
const Roles = React.lazy(() => import('@/pages/Roles'));
const Departments = React.lazy(() => import('@/pages/Departments'));
import ClientPortal from './pages/ClientPortal';
import CaseDetail from './pages/CaseDetail';
import StaffDashboard from './pages/StaffDashboard';
import IntakeForm from './pages/IntakeForm';
import AppIntegrations from './pages/Integrations';
import Automations from './pages/Automations';
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
import CustomPageViewer from './pages/CustomPageViewer';
import OrbitComponentTester from './pages/admin/OrbitComponentTester';
const MasterPortalRouter = React.lazy(() => import('./components/portal/MasterPortalRouter'));

// School Pages
import SchoolStudents from './pages/school/Students';
import StudentProfile from './pages/school/StudentProfile';
import SchoolParents from './pages/school/Parents';
import SchoolTeachers from './pages/school/Teachers';
import SchoolClasses from './pages/school/Classes';
import SchoolTimetable from './pages/school/Timetable';
import SchoolAssignments from './pages/school/Assignments';
import SchoolDiscipline from './pages/school/Discipline';
import SchoolNotices from './pages/school/Notices';
import SchoolTransport from './pages/school/Transport';
import SchoolHostel from './pages/school/Hostel';
import SchoolAttendance from './pages/school/Attendance';
import SchoolGrades from './pages/school/Grades';
import SchoolExams from './pages/school/Exams';
import SchoolFees from './pages/school/FeeManagement';
import SchoolLibrary from './pages/school/Library';
import SchoolParentPortal from './pages/school/ParentPortal';
import SchoolStudentPortal from './pages/school/StudentPortal';

import SchoolGamification from './pages/school/Gamification';
import SchoolTeacherEvaluations from './pages/school/TeacherEvaluations';
import SchoolCanteenPOS from './pages/school/CanteenPOS';
import SchoolComplaints from './pages/school/Complaints';
import SchoolSupportCenter from './pages/school/SupportCenter';

import SchoolCampusMarketplace from './pages/school/CampusMarketplace';
import SchoolInstitutionSettings from './pages/school/InstitutionSettings';
// Hospital Pages
import HospitalPatients from './pages/hospital/Patients';
import HospitalAppointments from './pages/hospital/Appointments';
import HospitalWards from './pages/hospital/Wards';
import HospitalPrescriptions from './pages/hospital/Prescriptions';
import HospitalLabResults from './pages/hospital/LabResults';
import HospitalPharmacy from './pages/hospital/Pharmacy';
import HospitalPatientPortal from './pages/hospital/PatientPortal';
import HospitalBilling from './pages/hospital/HospitalBilling';
import HospitalClaims from './pages/hospital/HospitalClaims';
import HospitalTelemedicine from './pages/hospital/Telemedicine';
import HospitalOperationTheater from './pages/hospital/OperationTheater';
import HospitalRadiology from './pages/hospital/Radiology';
import HospitalAmbulanceDispatch from './pages/hospital/AmbulanceDispatch';
import HospitalReferrals from './pages/hospital/Referrals';
import HospitalBloodBank from './pages/hospital/BloodBank';
import HospitalQueue from './pages/hospital/Queue';
import HospitalStaffRoster from './pages/hospital/StaffRoster';
import HospitalInfectionControl from './pages/hospital/InfectionControl';


// Hotel Pages
import HotelFrontDesk from './pages/hotel/FrontDesk';
import HotelReservations from './pages/hotel/Reservations';
import HotelRooms from './pages/hotel/Rooms';
import HotelHousekeeping from './pages/hotel/Housekeeping';
import HotelRevenueManagement from './pages/hotel/RevenueManagement';
import HotelLoyalty from './pages/hotel/Loyalty';
import HotelRestaurant from './pages/hotel/Restaurant';
import HotelGuestRequests from './pages/hotel/GuestRequests';
import HotelGuestPortal from './pages/hotel/GuestPortal';
import HotelGuests from './pages/hotel/Guests';

// Real Estate Pages
import RealEstateDashboard from './pages/real-estate/RealEstateDashboard';
import RealEstateProperties from './pages/real-estate/Properties';
import RealEstateClients from './pages/real-estate/Clients';
import RealEstateLeases from './pages/real-estate/Leases';
import RealEstateViewings from './pages/real-estate/Viewings';
import RealEstateTransactions from './pages/real-estate/Transactions';
import RealEstateOffers from './pages/real-estate/Offers';
import RealEstateCommissions from './pages/real-estate/Commissions';
import RealEstateRentPayments from './pages/real-estate/RentPayments';
import RealEstateMaintenance from './pages/real-estate/Maintenance';
import RealEstateCRMLeads from './pages/real-estate/CRMLeads';
import RealEstateAgentMetrics from './pages/real-estate/AgentMetrics';
import RealEstateAuditLog from './pages/real-estate/AuditLog';
import RealEstateClientScoring from './pages/real-estate/ClientScoring';
import RealEstateCommissionRules from './pages/real-estate/CommissionRules';
import RealEstateComparableProperties from './pages/real-estate/ComparableProperties';
import RealEstateContractorReviews from './pages/real-estate/ContractorReviews';
import RealEstateContractors from './pages/real-estate/Contractors';
import RealEstateCounterOffers from './pages/real-estate/CounterOffers';
import RealEstateDocumentTemplates from './pages/real-estate/DocumentTemplates';
import RealEstateESignatures from './pages/real-estate/ESignatures';
import RealEstateEscrowAccounts from './pages/real-estate/EscrowAccounts';
import RealEstateLeaseRenewals from './pages/real-estate/LeaseRenewals';
import RealEstateMarketData from './pages/real-estate/MarketData';
import RealEstateMarketIntelligence from './pages/real-estate/MarketIntelligence';
import RealEstatePaymentSchedules from './pages/real-estate/PaymentSchedules';
import RealEstateRecommendations from './pages/real-estate/Recommendations';
import RealEstateTeamManagement from './pages/real-estate/TeamManagement';
import RealEstateTrustAccounting from './pages/real-estate/TrustAccounting';
import RealEstateAnalytics from './pages/real-estate/Analytics';
import RealEstateAgentic from './pages/real-estate/Agentic';

// Religion Pages
import ReligionMembers from './pages/religion/Members';
import ReligionGroups from './pages/religion/Groups';
import ReligionEvents from './pages/religion/Events';
import ReligionDonations from './pages/religion/Donations';
import ReligionVolunteers from './pages/religion/Volunteers';
import ReligionSermons from './pages/religion/Sermons';
import ReligionSmallGroups from './pages/religion/SmallGroups';
import ReligionPrayers from './pages/religion/Prayers';
import ReligionMemberPortal from './pages/religion/MemberPortal';
import ReligionMilestones from './pages/religion/Milestones';

// Insurance Pages
import InsurancePolicies from './pages/insurance/Policies';
import InsuranceClaims from './pages/insurance/Claims';
import InsuranceClients from './pages/insurance/Clients';
import InsurancePolicyholderPortal from './pages/insurance/PolicyholderPortal';
import InsuranceUnderwriting from './pages/insurance/Underwriting';
import ActuarialDashboard from './pages/insurance/ActuarialDashboard';
import Reinsurance from './pages/insurance/Reinsurance';
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

import BarcodeManagement from './pages/retail/BarcodeManagement';
import RMAManagement from './pages/retail/RMAManagement';
import RetailHQDashboard from './pages/retail/RetailHQDashboard';
import OnlineStoreBuilder from './pages/retail/OnlineStoreBuilder';
import OmnichannelMarketplaces from './pages/retail/OmnichannelMarketplaces';
import UnifiedCheckout from './pages/retail/UnifiedCheckout';
import WMSDashboard from './pages/retail/WMSDashboard';
import WMSPickingOperations from './pages/retail/WMSPickingOperations';
import B2BWholesalePortal from './pages/retail/B2BWholesalePortal';
import DemandForecasting from './pages/retail/DemandForecasting';
import FranchiseManager from './pages/retail/FranchiseManager';


// Logistics Pages
const SmartDocs = React.lazy(() => import('./pages/logistics/SmartDocs'));
const RouteOptimization = React.lazy(() => import('./pages/logistics/RouteOptimization'));
const LoadBoard = React.lazy(() => import('./pages/logistics/LoadBoard'));
const GeofenceAlerts = React.lazy(() => import('./pages/logistics/GeofenceAlerts'));
import LogisticsShipments from './pages/logistics/Shipments';
import LogisticsFleet from './pages/logistics/Fleet';
import LogisticsDrivers from './pages/logistics/Drivers';
import LogisticsTrackingPortal from './pages/logistics/TrackingPortal';
const LogisticsWarehouse = React.lazy(() => import('./pages/logistics/Warehouse'));
import LogisticsRouteOptimization from './pages/logistics/RouteOptimization';
import LogisticsProofOfDelivery from './pages/logistics/ProofOfDelivery';
import LogisticsIncidentManagement from './pages/logistics/IncidentManagement';
import LogisticsReturnsManagement from './pages/retail/RMAManagement';
import LogisticsAdvancedAnalytics from './pages/logistics/AdvancedAnalytics';
import LogisticsDriverMobileApp from './pages/logistics/DriverMobileApp';

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

// University Pages
import UniDashboard from './pages/university/UniDashboard';
import UniStudents from './pages/university/UniStudents';
import UniFaculties from './pages/university/UniFaculties';
import UniCourses from './pages/university/UniCourses';
import UniAdmissions from './pages/university/UniAdmissions';
import UniFinance from './pages/university/UniFinance';
import UniEnrollment from './pages/university/UniEnrollment';
import UniRevenue from './pages/university/UniRevenue';
import UniResearchActivity from './pages/university/UniResearchActivity';
import UniGraduationStats from './pages/university/UniGraduationStats';
import UniAcademicStructure from './pages/university/UniAcademicStructure';
import UniRegistration from './pages/university/UniRegistration';
import UniLMS from './pages/university/UniLMS';
import UniExams from './pages/university/UniExams';
import UniHostel from './pages/university/UniHostel';
import UniLibrary from './pages/university/UniLibrary';
import UniCareerAlumni from './pages/university/UniCareerAlumni';

// ----- Logistics Features -----
import DispatchBoard from './pages/logistics/DispatchBoard';
import Warehouse from './pages/logistics/Warehouse';

// Vocational Pages
import VDashboard from './pages/vocational/VDashboard';
import VTrades from './pages/vocational/VTrades';
import VCourses from './pages/vocational/VCourses';
import VWorkshops from './pages/vocational/VWorkshops';
import VPracticalModules from './pages/vocational/VPracticalModules';
import VTraineeProfiles from './pages/vocational/VTraineeProfiles';
import VTrainingProgress from './pages/vocational/VTrainingProgress';
import VWorkshopAssessments from './pages/vocational/VWorkshopAssessments';
import VPracticalExams from './pages/vocational/VPracticalExams';
import VSkillDemonstrations from './pages/vocational/VSkillDemonstrations';
import VCompetencyTracking from './pages/vocational/VCompetencyTracking';
import VEquipmentInventory from './pages/vocational/VEquipmentInventory';
import VEquipmentReservations from './pages/vocational/VEquipmentReservations';
import VMaintenance from './pages/vocational/VMaintenance';
import VInternshipTracking from './pages/vocational/VInternshipTracking';
import VIndustrialAttachments from './pages/vocational/VIndustrialAttachments';
import VEmployerEvaluations from './pages/vocational/VEmployerEvaluations';
import VCertificates from './pages/vocational/VCertificates';
import VSkillBadges from './pages/vocational/VSkillBadges';
import VQualificationTracking from './pages/vocational/VQualificationTracking';
import VJobOpportunities from './pages/vocational/VJobOpportunities';
import VEmployers from './pages/vocational/VEmployers';
import VPlacementReports from './pages/vocational/VPlacementReports';
import VCertificationRates from './pages/vocational/VCertificationRates';
import VEmploymentRates from './pages/vocational/VEmploymentRates';
import VCoursePerformance from './pages/vocational/VCoursePerformance';

// Online Learning Pages
import OnlineDashboard from './pages/online/OnlineDashboard';
import OnlineLearners from './pages/online/OnlineLearners';
import OnlineCourses from './pages/online/OnlineCourses';
import OnlineSales from './pages/online/OnlineSales';
import OnlineMarketplace from './pages/online/OnlineMarketplace';
import CourseDetails from './pages/online/CourseDetails';
import InstructorProfile from './pages/online/InstructorProfile';
import OnlineBuilder from './pages/online/OnlineBuilder';
import LessonBuilder from './pages/online/LessonBuilder';
import AssessmentBuilder from './pages/online/AssessmentBuilder';
import MediaManager from './pages/online/MediaManager';
import LearningPlayer from './pages/online/LearningPlayer';
import StudentDashboard from './pages/online/StudentDashboard';
import LearnerProfile from './pages/online/LearnerProfile';
import NotesCenter from './pages/online/NotesCenter';
import OnlineAssessments from './pages/online/OnlineAssessments';
import OnlineCertificates from './pages/online/OnlineCertificates';
import OnlineLive from './pages/online/OnlineLive';
import Checkout from './pages/online/Checkout';
import OnlineSubscriptions from './pages/online/OnlineSubscriptions';
import OnlineAffiliates from './pages/online/OnlineAffiliates';
import CorporateDashboard from './pages/online/CorporateDashboard';
import OnlineCommunity from './pages/online/OnlineCommunity';
import OrbitAIAssistant from './pages/online/OrbitAIAssistant';

// High School Pages
import SHSClasses from './pages/highschool/SHSClasses';
import SHSStudents from './pages/highschool/SHSStudents';
import SHSProgrammes from './pages/highschool/SHSProgrammes';
import SHSHouses from './pages/highschool/SHSHouses';
import SHSTimetable from './pages/highschool/SHSTimetable';
import SHSAdmissions from './pages/highschool/SHSAdmissions';
import SHSGrades from './pages/highschool/SHSGrades';
import SHSFees from './pages/highschool/SHSFees';
import SHSDashboard from './pages/highschool/SHSDashboard';
import SHSStudentProfiles from './pages/highschool/SHSStudentProfiles';
import SHSStudentPromotion from './pages/highschool/SHSStudentPromotion';
import SHSStudentTransfers from './pages/highschool/SHSStudentTransfers';
import SHSDisciplineRecords from './pages/highschool/SHSDisciplineRecords';
import SHSMedicalRecords from './pages/highschool/SHSMedicalRecords';
import SHSApplicantReview from './pages/highschool/SHSApplicantReview';
import SHSAdmissionDecisions from './pages/highschool/SHSAdmissionDecisions';
import SHSEnrollment from './pages/highschool/SHSEnrollment';
import SHSStreams from './pages/highschool/SHSStreams';
import SHSSubjects from './pages/highschool/SHSSubjects';
import SHSElectives from './pages/highschool/SHSElectives';
import SHSAcademicCalendar from './pages/highschool/SHSAcademicCalendar';
import SHSDailyAttendance from './pages/highschool/SHSDailyAttendance';
import SHSClassAttendance from './pages/highschool/SHSClassAttendance';
import SHSTeacherAttendance from './pages/highschool/SHSTeacherAttendance';
import SHSAttendanceReports from './pages/highschool/SHSAttendanceReports';
import SHSInternalExams from './pages/highschool/SHSInternalExams';
import SHSMockExams from './pages/highschool/SHSMockExams';
import SHSContinuousAssessment from './pages/highschool/SHSContinuousAssessment';
import SHSResultsProcessing from './pages/highschool/SHSResultsProcessing';
import SHSReportCards from './pages/highschool/SHSReportCards';
import SHSDormitories from './pages/highschool/SHSDormitories';
import SHSRoomAllocation from './pages/highschool/SHSRoomAllocation';
import SHSHouseMasters from './pages/highschool/SHSHouseMasters';
import SHSBoardingAttendance from './pages/highschool/SHSBoardingAttendance';
import SHSParentProgress from './pages/highschool/SHSParentProgress';
import SHSParentAttendance from './pages/highschool/SHSParentAttendance';
import SHSParentFees from './pages/highschool/SHSParentFees';
import SHSParentComms from './pages/highschool/SHSParentComms';
import SHSInvoices from './pages/highschool/SHSInvoices';
import SHSPayments from './pages/highschool/SHSPayments';
import SHSScholarships from './pages/highschool/SHSScholarships';
import SHSFinancialReports from './pages/highschool/SHSFinancialReports';
import SHSBooks from './pages/highschool/SHSBooks';
import SHSBorrowing from './pages/highschool/SHSBorrowing';
import SHSReturns from './pages/highschool/SHSReturns';
import SHSDigitalResources from './pages/highschool/SHSDigitalResources';
import SHSBuses from './pages/highschool/SHSBuses';
import OrbitBuildPage from './pages/OrbitBuildPage';
import SHSRoutes from './pages/highschool/SHSRoutes';
import SHSStudentAssignments from './pages/highschool/SHSStudentAssignments';
import SHSNotices from './pages/highschool/SHSNotices';
import SHSSMS from './pages/highschool/SHSSMS';
import SHSWhatsApp from './pages/highschool/SHSWhatsApp';
import SHSEmailComms from './pages/highschool/SHSEmailComms';
import SHSAcademicAnalytics from './pages/highschool/SHSAcademicAnalytics';
import SHSAttendanceAnalytics from './pages/highschool/SHSAttendanceAnalytics';
import SHSFinancialAnalytics from './pages/highschool/SHSFinancialAnalytics';

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
import GenericModulePage from './pages/GenericModulePage';
import CreateModulePage from './pages/CreateModulePage';
import Marketplace from './pages/Marketplace';

// Admin Ecosystem Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminFirms from './pages/admin/AdminFirms';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBilling from './pages/admin/AdminBilling';
import SuperAdminBilling from './components/orbitbolt/SuperAdminBilling';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminBroadcasts from './pages/admin/AdminBroadcasts';
import AdminIntelligence from './pages/admin/AdminIntelligence';
import AdminRollout from './pages/admin/AdminRollout';
import AdminQuotas from './pages/admin/AdminQuotas';
import AdminEnterpriseRequests from './pages/admin/AdminEnterpriseRequests';
import AdminPartners from './pages/admin/AdminPartners';
import NotificationsInbox from './pages/NotificationsInbox';

function PlatformRoutes() {
  return (
    <>
      {/* Core / Shared Pages */}
      <Route path="/ob/:pageName" element={<OrbitBuildPage />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/super-admin" element={<GlobalAnalyticsDashboard />} />
      <Route path="/enterprise-admin" element={<EnterpriseDashboard />} />
      <Route path="/intelligence" element={<Intelligence />} />
      <Route path="/cases" element={<UnivProject />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/invoices" element={<UnivInvoice />} />
      <Route path="/tasks" element={<UnivKanban />} />
      <Route path="/documents" element={<UnivDocument />} />
      <Route path="/team" element={<UnivHREmployee />} />
      <Route path="/settings" element={<Settings />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/departments" element={<Departments />} />

      <Route path="/settings/custom-fields" element={<CustomFieldsSettings />} />
      <Route path="/integrations" element={<AppIntegrations />} />
      <Route path="/automations" element={<Automations />} />
      <Route path="/notifications" element={<NotificationsInbox />} />
      <Route path="/client-portal" element={<ClientPortal />} />
      <Route path="/cases/:id" element={<CaseDetail />} />
      <Route path="/my-dashboard" element={<StaffDashboard />} />
      <Route path="/leads" element={<UnivCRM />} />
      <Route path="/billing" element={<BillingDashboard />} />
      <Route path="/pipeline" element={<CasePipelinePage />} />
      <Route path="/research" element={<LegalResearch />} />
      <Route path="/audit" element={<AuditLog />} />
      <Route path="/leave" element={<UnivLeaveManagement />} />
      <Route path="/performance" element={<PerformanceDashboard />} />
      <Route path="/outcomes" element={<CaseOutcomes />} />
      <Route path="/conflict-check" element={<ConflictChecker />} />
      <Route path="/email-inbox" element={<EmailInbox />} />
      <Route path="/reports" element={<ReportsDashboard />} />
      <Route path="/export" element={<DataExport />} />
      <Route path="/whatsapp" element={<WhatsAppMessenger />} />
      <Route path="/hr" element={<UnivHRSystem />} />
      <Route path="/recruitment" element={<UnivRecruitment />} />
      <Route path="/inventory" element={<UnivInventory />} />
      <Route path="/payroll" element={<UnivPayroll />} />
      <Route path="/attendance" element={<UnivAttendance />} />
      <Route path="/leave-mgmt" element={<UnivLeaveManagement />} />
      <Route path="/payments" element={<UnivPayment />} />
      <Route path="/assets" element={<UnivAssetManagement />} />
      <Route path="/procurement" element={<UnivProcurement />} />
      <Route path="/analytics" element={<UnivAnalytics />} />
      <Route path="/bom" element={<UnivBOM />} />
      <Route path="/boq" element={<UnivBOQ />} />
      <Route path="/bookings" element={<UnivBooking />} />
      <Route path="/univ-calendar" element={<UnivCalendar />} />
      <Route path="/case-mgmt" element={<UnivCaseManagement />} />
      <Route path="/class-attendance" element={<UnivClassAttendance />} />
      <Route path="/portal" element={<MasterPortalRouter />} />
      <Route path="/contractors" element={<UnivContractor />} />
      <Route path="/courses" element={<UnivCourse />} />
      <Route path="/court" element={<UnivCourtCalendar />} />
      <Route path="/univ-dashboard" element={<UnivDashboard />} />
      <Route path="/datagrid" element={<UnivDataGrid />} />
      <Route path="/delivery" element={<UnivDelivery />} />
      <Route path="/dining" element={<UnivDining />} />
      <Route path="/dispatch" element={<UnivDispatch />} />
      <Route path="/emr" element={<UnivEMR />} />
      <Route path="/faculty" element={<UnivFaculty />} />
      <Route path="/fleet" element={<UnivFleet />} />
      <Route path="/form" element={<UnivForm />} />
      <Route path="/gradebook" element={<UnivGradebook />} />
      <Route path="/univ-housekeeping" element={<UnivHousekeeping />} />
      <Route path="/lms" element={<UnivLMS />} />
      <Route path="/lab" element={<UnivLab />} />
      <Route path="/legal-docs" element={<UnivLegalDocument />} />
      <Route path="/univ-appointments" element={<UnivAppointments />} />
      <Route path="/univ-machines" element={<UnivMachine />} />
      <Route path="/univ-menus" element={<UnivMenu />} />
      <Route path="/univ-messaging" element={<UnivMessaging />} />
      <Route path="/univ-notifications" element={<UnivNotification />} />
      <Route path="/univ-parent-portal" element={<UnivParentPortal />} />
      <Route path="/univ-patients" element={<UnivPatient />} />
      <Route path="/univ-pos" element={<UnivPOS />} />
      <Route path="/univ-prescriptions" element={<UnivPrescription />} />
      <Route path="/univ-production" element={<UnivProduction />} />
      <Route path="/univ-quality-control" element={<UnivQualityControl />} />
      <Route path="/univ-rooms" element={<UnivRoom />} />
      <Route path="/univ-routes" element={<UnivRoute />} />
      <Route path="/univ-safety" element={<UnivSafety />} />
      <Route path="/univ-search" element={<UnivSearch />} />
      <Route path="/univ-site-inspections" element={<UnivSiteInspection />} />
      <Route path="/univ-students" element={<UnivStudent />} />
      <Route path="/univ-subscriptions" element={<UnivSubscription />} />
      <Route path="/univ-telemedicine" element={<UnivTelemedicine />} />
      <Route path="/univ-timelines" element={<UnivTimeline />} />
      <Route path="/univ-wards" element={<UnivWard />} />
      <Route path="/univ-warehouses" element={<UnivWarehouse />} />
      <Route path="/firm-setup" element={<OnboardingWizard />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/board" element={<Board />} />
                          <Route path="/join/:roomId" element={<JoinMeeting />} />
      <Route path="/pages/:pageId" element={<CustomPageViewer />} />

      {/* Orbit Component Tester (Super Admin Only) */}
      <Route path="/orbit-test/:componentName" element={<OrbitComponentTester />} />

      {/* School Routes */}
      <Route path="/students" element={<SchoolStudents />} />
      <Route path="/students/:id" element={<StudentProfile />} />
      <Route path="/parents" element={<SchoolParents />} />
      <Route path="/teachers" element={<SchoolTeachers />} />
      <Route path="/complaints" element={<SchoolComplaints />} />
      <Route path="/support-center" element={<SchoolSupportCenter />} />

      <Route path="/institution-settings" element={<SchoolInstitutionSettings />} />
      <Route path="/o/learner/:id" element={<LearnerProfile />} />
      <Route path="/o/notes" element={<NotesCenter />} />
      <Route path="/o/assessments" element={<OnlineAssessments />} />
      <Route path="/o/certificates" element={<OnlineCertificates />} />
      <Route path="/o/live" element={<OnlineLive />} />

      <Route path="/canteen-pos" element={<SchoolCanteenPOS />} />
      <Route path="/classes" element={<SchoolClasses />} />
      <Route path="/timetable" element={<SchoolTimetable />} />
      <Route path="/assignments" element={<SchoolAssignments />} />
      <Route path="/attendance" element={<SchoolAttendance />} />
      <Route path="/grades" element={<SchoolGrades />} />
      <Route path="/exams" element={<SchoolExams />} />
      <Route path="/discipline" element={<SchoolDiscipline />} />
      <Route path="/fees" element={<SchoolFees />} />
      <Route path="/library" element={<SchoolLibrary />} />
      <Route path="/transport" element={<SchoolTransport />} />
      <Route path="/hostel" element={<SchoolHostel />} />
      <Route path="/notices" element={<SchoolNotices />} />
      <Route path="/student-portal" element={<SchoolStudentPortal />} />
      <Route path="/parent-portal" element={<SchoolParentPortal />} />

      <Route path="/gamification" element={<SchoolGamification />} />
      <Route path="/teacher-evaluations" element={<SchoolTeacherEvaluations />} />

      {/* University Suite Routes */}
      <Route path="/u/" element={<UniDashboard />} />
      <Route path="/u/students" element={<UniStudents />} />
      <Route path="/u/faculties" element={<UniFaculties />} />
      <Route path="/u/courses" element={<UniCourses />} />
      <Route path="/u/admissions" element={<UniAdmissions />} />
      <Route path="/u/finance" element={<UniFinance />} />
      <Route path="/u/enrollment" element={<UniEnrollment />} />
      <Route path="/u/revenue" element={<UniRevenue />} />
      <Route path="/u/research-activity" element={<UniResearchActivity />} />
      <Route path="/u/graduation-stats" element={<UniGraduationStats />} />
      <Route path="/u/academic-structure" element={<UniAcademicStructure />} />
      <Route path="/u/registration" element={<UniRegistration />} />
      <Route path="/u/lms" element={<UniLMS />} />
      <Route path="/u/exams" element={<UniExams />} />
      <Route path="/u/hostel" element={<UniHostel />} />
      <Route path="/u/library" element={<UniLibrary />} />
      <Route path="/u/career-alumni" element={<UniCareerAlumni />} />

      {/* Vocational Suite Routes */}
      <Route path="/v/" element={<VDashboard />} />
      <Route path="/v/trades" element={<VTrades />} />
      <Route path="/v/courses" element={<VCourses />} />
      <Route path="/v/workshops" element={<VWorkshops />} />
      <Route path="/v/practical-modules" element={<VPracticalModules />} />
      <Route path="/v/trainee-profiles" element={<VTraineeProfiles />} />
      <Route path="/v/training-progress" element={<VTrainingProgress />} />
      <Route path="/v/workshop-assessments" element={<VWorkshopAssessments />} />
      <Route path="/v/practical-exams" element={<VPracticalExams />} />
      <Route path="/v/skill-demonstrations" element={<VSkillDemonstrations />} />
      <Route path="/v/competency-tracking" element={<VCompetencyTracking />} />
      <Route path="/v/equipment-inventory" element={<VEquipmentInventory />} />
      <Route path="/v/equipment-reservations" element={<VEquipmentReservations />} />
      <Route path="/v/maintenance" element={<VMaintenance />} />
      <Route path="/v/internship-tracking" element={<VInternshipTracking />} />
      <Route path="/v/industrial-attachments" element={<VIndustrialAttachments />} />
      <Route path="/v/employer-evaluations" element={<VEmployerEvaluations />} />
      <Route path="/v/certificates" element={<VCertificates />} />
      <Route path="/v/skill-badges" element={<VSkillBadges />} />
      <Route path="/v/qualification-tracking" element={<VQualificationTracking />} />
      <Route path="/v/job-opportunities" element={<VJobOpportunities />} />
      <Route path="/v/employers" element={<VEmployers />} />
      <Route path="/v/placement-reports" element={<VPlacementReports />} />
      <Route path="/v/certification-rates" element={<VCertificationRates />} />
      <Route path="/v/employment-rates" element={<VEmploymentRates />} />
      <Route path="/v/course-performance" element={<VCoursePerformance />} />

      {/* Online Learning Suite Routes */}
      <Route path="/o/" element={<OnlineDashboard />} />
      <Route path="/o/learners" element={<OnlineLearners />} />
      <Route path="/o/courses" element={<OnlineCourses />} />
      <Route path="/o/sales" element={<OnlineSales />} />

      <Route path="/o/builder" element={<OnlineBuilder />} />
      <Route path="/o/builder/course/:courseId" element={<OnlineBuilder />} />
      <Route path="/o/builder/lesson/:courseId/:moduleId?" element={<LessonBuilder />} />
      <Route path="/o/builder/assessment/:courseId" element={<AssessmentBuilder />} />
      <Route path="/o/media" element={<MediaManager />} />
      <Route path="/o/learn/:courseId" element={<LearningPlayer />} />
      <Route path="/o/student-dashboard" element={<StudentDashboard />} />
      <Route path="/o/learner/:id" element={<LearnerProfile />} />
      <Route path="/o/notes" element={<NotesCenter />} />
      <Route path="/o/assessments" element={<OnlineAssessments />} />
      <Route path="/o/certificates" element={<OnlineCertificates />} />
      <Route path="/o/live" element={<OnlineLive />} />
      <Route path="/o/checkout/:courseId" element={<Checkout />} />
      <Route path="/o/subscriptions" element={<OnlineSubscriptions />} />
      <Route path="/o/affiliates" element={<OnlineAffiliates />} />
      <Route path="/o/corporate" element={<CorporateDashboard />} />
      <Route path="/o/community" element={<OnlineCommunity />} />
      <Route path="/o/ai" element={<OrbitAIAssistant />} />

      <Route path="/canteen-pos" element={<SchoolCanteenPOS />} />
      <Route path="/complaints" element={<SchoolComplaints />} />
      <Route path="/support-center" element={<SchoolSupportCenter />} />

      <Route path="/campus-marketplace" element={<SchoolCampusMarketplace />} />
      <Route path="/institution-settings" element={<SchoolInstitutionSettings />} />

      {/* Hospital Suite */}
      <Route path="/patients" element={<HospitalPatients />} />
      <Route path="/appointments" element={<HospitalAppointments />} />
      <Route path="/wards" element={<HospitalWards />} />
      <Route path="/prescriptions" element={<HospitalPrescriptions />} />
      <Route path="/lab-results" element={<HospitalLabResults />} />
      <Route path="/pharmacy" element={<HospitalPharmacy />} />
      <Route path="/patient-portal" element={<HospitalPatientPortal />} />
      <Route path="/hospital-billing" element={<HospitalBilling />} />
      <Route path="/hospital-claims" element={<HospitalClaims />} />
      <Route path="/telemedicine" element={<HospitalTelemedicine />} />
      <Route path="/operation-theater" element={<HospitalOperationTheater />} />
      <Route path="/radiology" element={<HospitalRadiology />} />
      <Route path="/ambulance-dispatch" element={<HospitalAmbulanceDispatch />} />
      <Route path="/referrals" element={<HospitalReferrals />} />
      <Route path="/blood-bank" element={<HospitalBloodBank />} />
      <Route path="/queue" element={<HospitalQueue />} />
      <Route path="/staff-roster" element={<HospitalStaffRoster />} />
      <Route path="/infection-control" element={<HospitalInfectionControl />} />


      {/* Hotel Suite */}
      <Route path="/front-desk" element={<HotelFrontDesk />} />
      <Route path="/reservations" element={<HotelReservations />} />
      <Route path="/rooms" element={<HotelRooms />} />
      <Route path="/housekeeping" element={<HotelHousekeeping />} />
      <Route path="/restaurant" element={<HotelRestaurant />} />
      <Route path="/guest-requests" element={<HotelGuestRequests />} />
      <Route path="/guest-portal" element={<HotelGuestPortal />} />
      <Route path="/revenue" element={<HotelRevenueManagement />} />
      <Route path="/loyalty" element={<HotelLoyalty />} />
      <Route path="/guests" element={<HotelGuests />} />

      {/* Real Estate Suite */}
      <Route path="/real-estate" element={<RealEstateDashboard />} />
      <Route path="/real-estate/dashboard" element={<RealEstateDashboard />} />
      <Route path="/real-estate/properties" element={<RealEstateProperties />} />
      <Route path="/real-estate/clients" element={<RealEstateClients />} />
      <Route path="/real-estate/leases" element={<RealEstateLeases />} />
      <Route path="/real-estate/viewings" element={<RealEstateViewings />} />
      <Route path="/real-estate/transactions" element={<RealEstateTransactions />} />
      <Route path="/real-estate/offers" element={<RealEstateOffers />} />
      <Route path="/real-estate/commissions" element={<RealEstateCommissions />} />
      <Route path="/real-estate/rent-payments" element={<RealEstateRentPayments />} />
      <Route path="/real-estate/maintenance" element={<RealEstateMaintenance />} />
      <Route path="/real-estate/crm-leads" element={<RealEstateCRMLeads />} />
      <Route path="/real-estate/agent-metrics" element={<RealEstateAgentMetrics />} />
      <Route path="/real-estate/audit-log" element={<RealEstateAuditLog />} />
      <Route path="/real-estate/client-scoring" element={<RealEstateClientScoring />} />
      <Route path="/real-estate/commission-rules" element={<RealEstateCommissionRules />} />
      <Route path="/real-estate/comparable-properties" element={<RealEstateComparableProperties />} />
      <Route path="/real-estate/contractor-reviews" element={<RealEstateContractorReviews />} />
      <Route path="/real-estate/contractors" element={<RealEstateContractors />} />
      <Route path="/real-estate/counter-offers" element={<RealEstateCounterOffers />} />
      <Route path="/real-estate/document-templates" element={<RealEstateDocumentTemplates />} />
      <Route path="/real-estate/e-signatures" element={<RealEstateESignatures />} />
      <Route path="/real-estate/escrow-accounts" element={<RealEstateEscrowAccounts />} />
      <Route path="/real-estate/lease-renewals" element={<RealEstateLeaseRenewals />} />
      <Route path="/real-estate/market-data" element={<RealEstateMarketData />} />
      <Route path="/real-estate/market-intelligence" element={<RealEstateMarketIntelligence />} />
      <Route path="/real-estate/payment-schedules" element={<RealEstatePaymentSchedules />} />
      <Route path="/real-estate/recommendations" element={<RealEstateRecommendations />} />
      <Route path="/real-estate/team-management" element={<RealEstateTeamManagement />} />
      <Route path="/real-estate/trust-accounting" element={<RealEstateTrustAccounting />} />
      <Route path="/real-estate/analytics" element={<RealEstateAnalytics />} />
      <Route path="/real-estate/agentic" element={<RealEstateAgentic />} />

      {/* Religion Suite */}
      <Route path="/members" element={<Clients />} />
      <Route path="/groups" element={<ReligionGroups />} />
      <Route path="/events" element={<ReligionEvents />} />
      <Route path="/donations" element={<ReligionDonations />} />
      <Route path="/volunteers" element={<ReligionVolunteers />} />
      <Route path="/sermons" element={<ReligionSermons />} />
      <Route path="/small-groups" element={<ReligionSmallGroups />} />
      <Route path="/prayers" element={<ReligionPrayers />} />
      <Route path="/milestones" element={<ReligionMilestones />} />
      <Route path="/member-portal" element={<ReligionMemberPortal />} />

      {/* Insurance Suite */}
      <Route path="/policies" element={<InsurancePolicies />} />
      <Route path="/claims" element={<InsuranceClaims />} />
      <Route path="/insurance-clients" element={<Clients />} />
      <Route path="/policyholder-portal" element={<InsurancePolicyholderPortal />} />
      <Route path="/underwriting" element={<InsuranceUnderwriting />} />
      <Route path="/actuarial" element={<ActuarialDashboard />} />
      <Route path="/reinsurance" element={<Reinsurance />} />
      <Route path="/agent-performance" element={<InsuranceAgentPerformance />} />
      <Route path="/premiums" element={<InsurancePremiums />} />

      {/* Retail Suite */}
      <Route path="/retail" element={<RetailDashboard />} />
      <Route path="/retail-dashboard" element={<RetailDashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/pos" element={<RetailPOS />} />
      <Route path="/shifts" element={<Shifts />} />
      <Route path="/retail-hq" element={<RetailHQDashboard />} />
      <Route path="/barcodes" element={<BarcodeManagement />} />
      <Route path="/rmas" element={<RMAManagement />} />
      <Route path="/store-builder" element={<OnlineStoreBuilder />} />
      <Route path="/marketplaces" element={<OmnichannelMarketplaces />} />
      <Route path="/checkout" element={<UnifiedCheckout />} />
      <Route path="/wms-dashboard" element={<WMSDashboard />} />
      <Route path="/wms-picking" element={<WMSPickingOperations />} />
      <Route path="/b2b-portal" element={<B2BWholesalePortal />} />
      <Route path="/demand-forecast" element={<DemandForecasting />} />
      <Route path="/franchise-manager" element={<FranchiseManager />} />
      <Route path="/purchase-orders" element={<RetailPurchaseOrders />} />
      <Route path="/promotions" element={<RetailPromotions />} />
      <Route path="/retail-inventory" element={<RetailInventory />} />
      <Route path="/sales" element={<RetailSales />} />
      <Route path="/suppliers" element={<RetailSuppliers />} />
      <Route path="/retail-customers" element={<Clients />} />
      <Route path="/customer-portal" element={<RetailCustomerPortal />} />

      {/* Logistics & Supply Chain */}
      <Route path="/smart-docs" element={<SmartDocs />} />
      <Route path="/load-board" element={<LoadBoard />} />
      <Route path="/dispatch-board" element={<DispatchBoard />} />
      <Route path="/warehouse" element={<Warehouse />} />
      <Route path="/ai-routes" element={<RouteOptimization />} />
      <Route path="/geofences" element={<GeofenceAlerts />} />
      <Route path="/shipments" element={<LogisticsShipments />} />
      <Route path="/fleet" element={<LogisticsFleet />} />
      <Route path="/drivers" element={<LogisticsDrivers />} />
      <Route path="/tracking" element={<LogisticsTrackingPortal />} />
      <Route path="/warehouse" element={<LogisticsWarehouse />} />
      <Route path="/routes" element={<LogisticsRouteOptimization />} />
      <Route path="/proof-of-delivery" element={<LogisticsProofOfDelivery />} />
      <Route path="/incidents" element={<LogisticsIncidentManagement />} />
      <Route path="/returns" element={<LogisticsReturnsManagement />} />
      <Route path="/logistics-analytics" element={<LogisticsAdvancedAnalytics />} />
      <Route path="/driver-mobile-app" element={<LogisticsDriverMobileApp />} />

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
      {/* High School (SHS) Routes */}
      <Route path="/s/" element={<SHSDashboard />} />
      <Route path="/s/students" element={<SHSStudents />} />
      <Route path="/s/student-profiles" element={<SHSStudentProfiles />} />
      <Route path="/s/promotion" element={<SHSStudentPromotion />} />
      <Route path="/s/transfers" element={<SHSStudentTransfers />} />
      <Route path="/s/discipline" element={<SHSDisciplineRecords />} />
      <Route path="/s/medical" element={<SHSMedicalRecords />} />
      <Route path="/s/admissions" element={<SHSAdmissions />} />
      <Route path="/s/applicant-review" element={<SHSApplicantReview />} />
      <Route path="/s/admission-decisions" element={<SHSAdmissionDecisions />} />
      <Route path="/s/enrollment" element={<SHSEnrollment />} />
      <Route path="/s/classes" element={<SHSClasses />} />
      <Route path="/s/programmes" element={<SHSProgrammes />} />
      <Route path="/s/houses" element={<SHSHouses />} />
      <Route path="/s/streams" element={<SHSStreams />} />
      <Route path="/s/subjects" element={<SHSSubjects />} />
      <Route path="/s/electives" element={<SHSElectives />} />
      <Route path="/s/academic-calendar" element={<SHSAcademicCalendar />} />
      <Route path="/s/timetable" element={<SHSTimetable />} />
      <Route path="/s/daily-attendance" element={<SHSDailyAttendance />} />
      <Route path="/s/class-attendance" element={<SHSClassAttendance />} />
      <Route path="/s/teacher-attendance" element={<SHSTeacherAttendance />} />
      <Route path="/s/attendance-reports" element={<SHSAttendanceReports />} />
      <Route path="/s/internal-exams" element={<SHSInternalExams />} />
      <Route path="/s/mock-exams" element={<SHSMockExams />} />
      <Route path="/s/assessment" element={<SHSContinuousAssessment />} />
      <Route path="/s/grades" element={<SHSGrades />} />
      <Route path="/s/results" element={<SHSResultsProcessing />} />
      <Route path="/s/report-cards" element={<SHSReportCards />} />
      <Route path="/s/dormitories" element={<SHSDormitories />} />
      <Route path="/s/room-allocation" element={<SHSRoomAllocation />} />
      <Route path="/s/house-masters" element={<SHSHouseMasters />} />
      <Route path="/s/boarding-attendance" element={<SHSBoardingAttendance />} />
      <Route path="/s/parent-progress" element={<SHSParentProgress />} />
      <Route path="/s/parent-attendance" element={<SHSParentAttendance />} />
      <Route path="/s/parent-fees" element={<SHSParentFees />} />
      <Route path="/s/parent-comms" element={<SHSParentComms />} />
      <Route path="/s/fees" element={<SHSFees />} />
      <Route path="/s/invoices" element={<SHSInvoices />} />
      <Route path="/s/payments" element={<SHSPayments />} />
      <Route path="/s/scholarships" element={<SHSScholarships />} />
      <Route path="/s/financial-reports" element={<SHSFinancialReports />} />
      <Route path="/s/books" element={<SHSBooks />} />
      <Route path="/s/borrowing" element={<SHSBorrowing />} />
      <Route path="/s/returns" element={<SHSReturns />} />
      <Route path="/s/digital-resources" element={<SHSDigitalResources />} />
      <Route path="/s/buses" element={<SHSBuses />} />
      <Route path="/s/bus-routes" element={<SHSRoutes />} />
      <Route path="/s/bus-assignments" element={<SHSStudentAssignments />} />
      <Route path="/s/notices" element={<SHSNotices />} />
      <Route path="/s/sms" element={<SHSSMS />} />
      <Route path="/s/whatsapp" element={<SHSWhatsApp />} />
      <Route path="/s/email-comms" element={<SHSEmailComms />} />
      <Route path="/s/academic-analytics" element={<SHSAcademicAnalytics />} />
      <Route path="/s/attendance-analytics" element={<SHSAttendanceAnalytics />} />
      <Route path="/s/financial-analytics" element={<SHSFinancialAnalytics />} />


      
      {/* OrbitBolt & Builder */}
      <Route path="/slate/BOLT" element={<CreateModulePage isBoltOpen={true} />} />
      <Route path="/slate/create" element={<CreateModulePage />} />
      <Route path="/slate/edit/:id" element={<CreateModulePage />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/m/*" element={<GenericModulePage />} />
    </>
  );
}

function GlobalSystemListener() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const handleSuccess = (e) => {
      // Invalidate queries universally so disjointed data dashboards sync instantly
      queryClient.invalidateQueries(); 
      // Disabled global toast to prevent popup spam
    };
    const handleError = (e) => {
      toast({ title: "Action Failed", description: e.detail.error?.message || "An error occurred.", variant: "destructive" });
    };
    const handleHardError = (e) => {
      console.error("Cloud Sync Failed:", e.detail.errorMessage);
    };

    window.addEventListener('db:local-mutation-success', handleSuccess);
    window.addEventListener('db:local-mutation-error', handleError);
    window.addEventListener('sync:hard-error', handleHardError);
    return () => {
      window.removeEventListener('db:local-mutation-success', handleSuccess);
      window.removeEventListener('db:local-mutation-error', handleError);
      window.removeEventListener('sync:hard-error', handleHardError);
    };
  }, [queryClient, toast]);

  return null;
}

function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, user } = useAuth();
  
  // Show spinner while auth is loading OR while auth hasn't been checked yet
  if (isLoadingAuth || !authChecked) {
    return <PageLoader label="Loading Slate" />;
  }
  
  if (!isAuthenticated) {
    // Use React Router Navigate instead of window.location.href to avoid
    // an irreversible hard page reload that cannot be cancelled
    return <Navigate to="/login" replace />;
  }
  
  if (user?.company_status === 'suspended') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900 p-4 font-sans backdrop-blur-sm">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border-[0.5px] border-black/9 dark:border-white/8 border-slate-100 dark:border-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10/10 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight tracking-[-0.02em]">Workspace Suspended</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
            Your workspace access has been temporarily suspended by an administrator. Please contact support to resolve this issue.
          </p>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/login')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-all">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (user?.company_status === 'onboarding' && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
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
    <ImpersonationProvider>
      <AuthProvider>
        <ThemeProvider>
          <VideoProvider>
            <QueryClientProvider client={queryClientInstance}>
            <Router>
              <GlobalSystemListener />
              <ErrorBoundary>
                <React.Suspense fallback={<PageLoader label="Loading Module..." />}>
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
                          <Route path="/admin/intelligence" element={<AdminIntelligence />} />
                          <Route path="/admin/rollout" element={<AdminRollout />} />
                          <Route path="/admin/quotas" element={<AdminQuotas />} />
                          <Route path="/admin/firms" element={<AdminFirms />} />
                          <Route path="/admin/users" element={<AdminUsers />} />
                          <Route path="/admin/billing" element={<AdminBilling />} />
                          <Route path="/admin/pricing" element={<SuperAdminBilling title="Pricing Engine" />} />
                          <Route path="/admin/security" element={<AdminSecurity />} />
                          <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />
                          <Route path="/admin/enterprise-requests" element={<AdminEnterpriseRequests />} />
                          <Route path="/admin/partners" element={<AdminPartners />} />

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
                          <Route path="/admin/intelligence" element={<AdminIntelligence />} />
                          <Route path="/admin/rollout" element={<AdminRollout />} />
                          <Route path="/admin/quotas" element={<AdminQuotas />} />
                          <Route path="/admin/firms" element={<AdminFirms />} />
                          <Route path="/admin/users" element={<AdminUsers />} />
                          <Route path="/admin/billing" element={<AdminBilling />} />
                          <Route path="/admin/pricing" element={<SuperAdminBilling title="Pricing Engine" />} />
                          <Route path="/admin/security" element={<AdminSecurity />} />
                          <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />
                          <Route path="/admin/enterprise-requests" element={<AdminEnterpriseRequests />} />
                          <Route path="/admin/partners" element={<AdminPartners />} />

                          {PlatformRoutes()}
                        </Route>
                        <Route path="/intake" element={<IntakeForm />} />
                        <Route path="/onboarding" element={<OnboardingWizard />} />
                        <Route path="*" element={<PageNotFound />} />
                      </Route>
                    </Routes>
                  )}
                </React.Suspense>
              </ErrorBoundary>
              <Toaster />
              <SonnerToaster />
              <HotToaster position="top-right" />
            </Router>
          </QueryClientProvider>
          </VideoProvider>
        </ThemeProvider>
      </AuthProvider>
    </ImpersonationProvider>
    </HelmetProvider>
    </PowerSyncContext.Provider>
  );
}

export default App;
