import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { useToast } from "@/components/ui/use-toast";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter, HashRouter, Route, Routes, Outlet, Navigate, useLocation } from "react-router-dom";
import { isDesktopApp } from "@/lib/domainUtils";
const Router = isDesktopApp() ? HashRouter : BrowserRouter;
import PageNotFound from "./lib/PageNotFound";
const JoinMeeting = React.lazy(() => import("@/pages/JoinMeeting"));
const StandaloneMeeting = React.lazy(() => import("@/pages/StandaloneMeeting"));
const MeetLandingPage = React.lazy(() => import("@/pages/MeetLandingPage"));
import ClipadLayout from "@/components/layout/ClipadLayout";
const SpaceDashboard = React.lazy(() => import("@/pages/clipad/SpaceDashboard"));
const RecordVideo = React.lazy(() => import("@/pages/clipad/RecordVideo"));
const WatchVideo = React.lazy(() => import("@/pages/clipad/WatchVideo"));
const CliPadSettings = React.lazy(() => import("@/pages/clipad/CliPadSettings"));
const VideoAnalytics = React.lazy(() => import("@/pages/clipad/VideoAnalytics"));
const CliPadEnterpriseDashboard = React.lazy(() => import("@/pages/clipad/admin/EnterpriseDashboard"));
const KnowledgeHealth = React.lazy(() => import("@/pages/clipad/KnowledgeHealth"));
const KnowledgeTimeline = React.lazy(() => import("@/pages/clipad/KnowledgeTimeline"));
const DecisionLedger = React.lazy(() => import("@/pages/clipad/DecisionLedger"));
const KnowledgeGraph = React.lazy(() => import("@/pages/clipad/KnowledgeGraph"));
const ActionItems = React.lazy(() => import("@/pages/clipad/ActionItems"));
const KnowledgeJourney = React.lazy(() => import("@/pages/clipad/KnowledgeJourney"));
const IntegrationAnalytics = React.lazy(() => import("@/pages/clipad/IntegrationAnalytics"));
const CliPadDashboard = React.lazy(() => import("@/pages/clipad/CliPadDashboard"));
const CliPadLogin = React.lazy(() => import("@/pages/clipad/CliPadLogin"));
const CliPadSignUp = React.lazy(() => import("@/pages/clipad/CliPadSignUp"));
const SpacesList = React.lazy(() => import("@/pages/clipad/SpacesList"));
const MeetingRecord = React.lazy(() => import("@/pages/clipad/MeetingRecord"));
const SaveMeetingPage = React.lazy(() => import("@/pages/clipad/SaveMeetingPage"));
const MeetingsList = React.lazy(() => import("@/pages/clipad/MeetingsList"));
const VideosList = React.lazy(() => import("@/pages/clipad/VideosList"));
const CliPadSupport = React.lazy(() => import("@/pages/clipad/CliPadSupport"));
const ClipadChat = React.lazy(() => import("@/pages/clipad/ClipadChat"));
const ClipadAdminLayout = React.lazy(() => import("@/components/layout/ClipadAdminLayout"));
const ClipadAdminOverview = React.lazy(() => import("@/pages/clipad/admin/Overview"));
const CompanyManagement = React.lazy(() => import("@/pages/clipad/admin/CompanyManagement"));
const PricingTags = React.lazy(() => import("@/pages/clipad/admin/PricingTags"));
const AuditMonitor = React.lazy(() => import("@/pages/clipad/admin/AuditMonitor"));
const ClipadLiveSupport = React.lazy(() => import("@/pages/clipad/admin/LiveSupport"));
const AdminAI = React.lazy(() => import("@/pages/clipad/admin/AdminAI"));
const AnalyticsPageRouter = () => {
  const { user } = useAuth();
  const plan = user?.clipad_plan || user?.user_metadata?.clipad_plan || "free";
  if (plan === "enterprise" || user?.role === "super_admin" || user?.role === "admin") {
    return /* @__PURE__ */ jsx(CliPadEnterpriseDashboard, {});
  }
  return /* @__PURE__ */ jsx(VideoAnalytics, {});
};
const IntegrationsHub = React.lazy(() => import("@/pages/clipad/IntegrationsHub"));
const SearchHub = React.lazy(() => import("@/pages/clipad/SearchHub"));
const DecisionReplay = React.lazy(() => import("@/pages/clipad/DecisionReplay"));
const CommitmentIntelligence = React.lazy(() => import("@/pages/clipad/CommitmentIntelligence"));
const PredictiveRisk = React.lazy(() => import("@/pages/clipad/PredictiveRisk"));
const OrgHealthPulse = React.lazy(() => import("@/pages/clipad/OrgHealthPulse"));
const CrossSpaceIntelligence = React.lazy(() => import("@/pages/clipad/CrossSpaceIntelligence"));
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { ImpersonationProvider } from "@/lib/ImpersonationContext";
import { VideoProvider } from "@/lib/VideoContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
const EnterpriseDashboard = React.lazy(() => import("./pages/EnterpriseDashboard"));
import Intelligence from "@/pages/Intelligence";
import { PowerSyncContext } from "@powersync/react";
import { HelmetProvider } from "react-helmet-async";
import { powerSync, initPowerSync } from "./api/PowerSyncConnector";
import { supabase } from "./api/supabaseClient";
import { OrbitLoader, PageLoader } from "@/components/ui/orbit-loader";
const UnivCRM = React.lazy(() => import("@/components/universal/UnivCRM"));
const UnivProject = React.lazy(() => import("@/components/universal/UnivProject"));
const UnivContactManagement = React.lazy(() => import("@/components/universal/UnivContactManagement"));
const UnivKanban = React.lazy(() => import("@/components/universal/UnivKanban"));
const UnivDocument = React.lazy(() => import("@/components/universal/UnivDocument"));
const UnivInventory = React.lazy(() => import("@/components/universal/UnivInventory"));
const UnivHREmployee = React.lazy(() => import("@/components/universal/UnivHREmployee"));
const UnivHRSystem = React.lazy(() => import("@/components/universal/UnivHRSystem"));
const UnivInvoice = React.lazy(() => import("@/components/universal/UnivInvoice"));
const UnivPayroll = React.lazy(() => import("@/components/universal/UnivPayroll"));
const UnivRecruitment = React.lazy(() => import("@/components/universal/UnivRecruitment"));
const UnivAttendance = React.lazy(() => import("@/components/universal/UnivAttendance"));
const UnivLeaveManagement = React.lazy(() => import("@/components/universal/UnivLeaveManagement"));
const UnivPayment = React.lazy(() => import("@/components/universal/UnivPayment"));
const UnivAssetManagement = React.lazy(() => import("@/components/universal/UnivAssetManagement"));
const UnivProcurement = React.lazy(() => import("@/components/universal/UnivProcurement"));
const UnivAnalytics = React.lazy(() => import("@/components/universal/UnivAnalytics"));
const UnivBOM = React.lazy(() => import("@/components/universal/UnivBOM"));
const UnivBOQ = React.lazy(() => import("@/components/universal/UnivBOQ"));
const UnivBooking = React.lazy(() => import("@/components/universal/UnivBooking"));
const UnivCalendar = React.lazy(() => import("@/components/universal/UnivCalendar"));
const UnivCaseManagement = React.lazy(() => import("@/components/universal/UnivCaseManagement"));
const UnivClassAttendance = React.lazy(() => import("@/components/universal/UnivClassAttendance"));
const UnivClientPortal = React.lazy(() => import("@/components/universal/UnivClientPortal"));
const UnivContractor = React.lazy(() => import("@/components/universal/UnivContractor"));
const UnivCourse = React.lazy(() => import("@/components/universal/UnivCourse"));
const UnivCourtCalendar = React.lazy(() => import("@/components/universal/UnivCourtCalendar"));
const UnivDashboard = React.lazy(() => import("@/components/universal/UnivDashboard"));
const UnivDataGrid = React.lazy(() => import("@/components/universal/UnivDataGrid"));
const UnivDelivery = React.lazy(() => import("@/components/universal/UnivDelivery"));
const UnivDining = React.lazy(() => import("@/components/universal/UnivDining"));
const UnivDispatch = React.lazy(() => import("@/components/universal/UnivDispatch"));
const UnivEMR = React.lazy(() => import("@/components/universal/UnivEMR"));
const UnivFaculty = React.lazy(() => import("@/components/universal/UnivFaculty"));
const UnivFleet = React.lazy(() => import("@/components/universal/UnivFleet"));
const UnivForm = React.lazy(() => import("@/components/universal/UnivForm"));
const UnivGradebook = React.lazy(() => import("@/components/universal/UnivGradebook"));
const UnivHousekeeping = React.lazy(() => import("@/components/universal/UnivHousekeeping"));
const UnivLMS = React.lazy(() => import("@/components/universal/UnivLMS"));
const UnivLab = React.lazy(() => import("@/components/universal/UnivLab"));
const UnivLegalDocument = React.lazy(() => import("@/components/universal/UnivLegalDocument"));
const UnivAppointments = React.lazy(() => import("@/components/universal/UnivAppointments"));
const UnivMachine = React.lazy(() => import("@/components/universal/UnivMachine"));
const UnivMenu = React.lazy(() => import("@/components/universal/UnivMenu"));
const UnivMessaging = React.lazy(() => import("@/components/universal/UnivMessaging"));
const UnivNotification = React.lazy(() => import("@/components/universal/UnivNotification"));
const UnivParentPortal = React.lazy(() => import("@/components/universal/UnivParentPortal"));
const UnivPatient = React.lazy(() => import("@/components/universal/UnivPatient"));
const UnivPOS = React.lazy(() => import("@/components/universal/UnivPOS"));
const UnivPrescription = React.lazy(() => import("@/components/universal/UnivPrescription"));
const UnivProduction = React.lazy(() => import("@/components/universal/UnivProduction"));
const UnivQualityControl = React.lazy(() => import("@/components/universal/UnivQualityControl"));
const UnivRoom = React.lazy(() => import("@/components/universal/UnivRoom"));
const UnivRoute = React.lazy(() => import("@/components/universal/UnivRoute"));
const UnivSafety = React.lazy(() => import("@/components/universal/UnivSafety"));
const UnivSearch = React.lazy(() => import("@/components/universal/UnivSearch"));
const UnivSiteInspection = React.lazy(() => import("@/components/universal/UnivSiteInspection"));
const UnivStudent = React.lazy(() => import("@/components/universal/UnivStudent"));
const UnivSubscription = React.lazy(() => import("@/components/universal/UnivSubscription"));
const UnivTelemedicine = React.lazy(() => import("@/components/universal/UnivTelemedicine"));
const UnivTimeline = React.lazy(() => import("@/components/universal/UnivTimeline"));
const UnivWard = React.lazy(() => import("@/components/universal/UnivWard"));
const UnivWarehouse = React.lazy(() => import("@/components/universal/UnivWarehouse"));
const OptavelCommandCenter = React.lazy(() => import("@/pages/optavel/OptavelCommandCenter"));
const OptavelExecutive = React.lazy(() => import("@/pages/optavel/OptavelExecutive"));
const OptavelProductEng = React.lazy(() => import("@/pages/optavel/OptavelProductEng"));
const OptavelMarketing = React.lazy(() => import("@/pages/optavel/OptavelMarketing"));
const OptavelSales = React.lazy(() => import("@/pages/optavel/OptavelSales"));
const OptavelFinance = React.lazy(() => import("@/pages/optavel/OptavelFinance"));
const OptavelHR = React.lazy(() => import("@/pages/optavel/OptavelHR"));
const OptavelSupport = React.lazy(() => import("@/pages/optavel/OptavelSupport"));
const OptavelPartnerships = React.lazy(() => import("@/pages/optavel/OptavelPartnerships"));
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isUpdating: false, updateProgress: 0 };
    this.handleUpdate = this.handleUpdate.bind(this);
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    const isChunkError = error?.message?.includes("Failed to fetch dynamically imported module") || error?.toString()?.includes("Failed to fetch dynamically imported module");
    if (isChunkError) {
      if (!sessionStorage.getItem("chunk-error-reload")) {
        sessionStorage.setItem("chunk-error-reload", "true");
        window.location.href = window.location.pathname + "?v=" + (/* @__PURE__ */ new Date()).getTime();
      }
    }
  }
  handleUpdate() {
    this.setState({ isUpdating: true, updateProgress: 0 });
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        clearInterval(interval);
        this.setState({ updateProgress: 100 });
        if ("caches" in window) {
          caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
        }
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
        }
        sessionStorage.removeItem("chunk-error-reload");
        setTimeout(() => {
          window.location.href = "/dashboard?update=" + (/* @__PURE__ */ new Date()).getTime();
        }, 150);
      } else {
        this.setState({ updateProgress: Math.min(p, 99) });
      }
    }, 150);
  }
  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes("Failed to fetch dynamically imported module") || this.state.error?.toString()?.includes("Failed to fetch dynamically imported module");
      if (isChunkError) {
        return /* @__PURE__ */ jsxs("div", { className: "min-h-[100dvh] bg-[#f0f2f5] dark:bg-background flex flex-col items-center justify-center p-6 font-sans", children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden md:flex bg-white dark:bg-card p-8 md:p-12 rounded-[24px] border border-slate-200 dark:border-border shadow-md flex-col items-center text-center max-w-md w-full relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" }),
            /* @__PURE__ */ jsxs("div", { className: "w-20 h-20 relative flex items-center justify-center mb-6", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5" }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" }),
              (() => {
                let logoSrc = "/optavel-favicon.svg";
                try {
                  const host = window.location.hostname.toLowerCase();
                  if (host.includes("clipad")) logoSrc = "/clipad-logo-green.svg";
                  else if (host.includes("slate") && !host.includes("optavel")) logoSrc = "/slate-favicon.svg";
                } catch (e) {
                }
                return /* @__PURE__ */ jsx("img", { src: logoSrc, alt: "Logo", className: "w-10 h-10 object-contain animate-pulse" });
              })()
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-slate-900 dark:text-white mb-3", children: this.state.isUpdating ? "Applying Update..." : "Updating Workspace" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-muted-foreground mb-8 text-sm font-medium leading-relaxed", children: this.state.isUpdating ? "Please wait while we install the newest features." : "We've just released a new update to improve your experience. Please refresh the page to load the latest version." }),
            this.state.isUpdating ? /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "bg-primary h-2.5 rounded-full transition-all duration-200", style: { width: `${this.state.updateProgress}%` } }) }) : /* @__PURE__ */ jsx(
              "button",
              {
                onClick: this.handleUpdate,
                className: "w-full py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0",
                children: "Refresh Page"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:hidden flex flex-col items-center justify-center w-full max-w-sm mt-auto mb-auto", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-white dark:bg-card rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/5 flex items-center justify-center mb-6 animate-bounce", children: /* @__PURE__ */ jsxs("svg", { className: "w-8 h-8 text-primary animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
              /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
              /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-2 text-center", children: this.state.isUpdating ? "Installing Update..." : "Update Available" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-muted-foreground mb-8 text-sm font-medium leading-relaxed text-center px-4", children: this.state.isUpdating ? "Please wait, do not close the app." : "Tap to update to the newest features and bug fixes." }),
            this.state.isUpdating ? /* @__PURE__ */ jsxs("div", { className: "w-full mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner", children: /* @__PURE__ */ jsx("div", { className: "bg-primary h-3 rounded-full transition-all duration-200", style: { width: `${this.state.updateProgress}%` } }) }),
              /* @__PURE__ */ jsxs("div", { className: "text-center text-xs text-slate-500 font-bold mt-3", children: [
                this.state.updateProgress,
                "%"
              ] })
            ] }) : /* @__PURE__ */ jsx(
              "button",
              {
                onClick: this.handleUpdate,
                className: "w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95",
                children: "Tap to Update Now"
              }
            )
          ] })
        ] });
      }
      return /* @__PURE__ */ jsxs("div", { style: { padding: 20, color: "red", background: "#ffebee", minHeight: "100vh" }, children: [
        /* @__PURE__ */ jsx("h2", { children: "Something went wrong in the UI." }),
        /* @__PURE__ */ jsx("pre", { children: this.state.error?.toString() }),
        /* @__PURE__ */ jsx("pre", { children: this.state.error?.stack }),
        /* @__PURE__ */ jsx("button", { onClick: () => window.location.reload(), style: { padding: "12px 24px", background: "white", color: "red", border: "1px solid red", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginTop: 16 }, children: "Reload App" })
      ] });
    }
    return this.props.children;
  }
}
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Cases = React.lazy(() => import("./pages/Cases.jsx"));
const Clients = React.lazy(() => import("./pages/Clients.jsx"));
const CalendarPage = React.lazy(() => import("./pages/CalendarPage"));
const Invoices = React.lazy(() => import("./pages/Invoices"));
const Tasks = React.lazy(() => import("./pages/Tasks"));
const Documents = React.lazy(() => import("./pages/Documents"));
const HCMSmartDocs = React.lazy(() => import("./pages/SmartDocs"));
const Team = React.lazy(() => import("./pages/Team"));
const Settings = React.lazy(() => import("./pages/Settings"));
const CustomFieldsSettings = React.lazy(() => import("./pages/settings/CustomFields"));
const Roles = React.lazy(() => import("@/pages/Roles"));
const Departments = React.lazy(() => import("@/pages/Departments"));
const ClientPortal = React.lazy(() => import("./pages/ClientPortal"));
const CaseDetail = React.lazy(() => import("./pages/CaseDetail"));
const StaffDashboard = React.lazy(() => import("./pages/StaffDashboard"));
const IntakeForm = React.lazy(() => import("./pages/IntakeForm"));
const NativeOnboarding = React.lazy(() => import("./pages/NativeOnboarding"));
const AppIntegrations = React.lazy(() => import("./pages/Integrations"));
const Automations = React.lazy(() => import("./pages/Automations"));
const Leads = React.lazy(() => import("./pages/Leads"));
const BillingDashboard = React.lazy(() => import("./pages/BillingDashboard"));
const PipelinePage = React.lazy(() => import("./pages/PipelinePage"));
const LegalResearch = React.lazy(() => import("./pages/LegalResearch"));
const AuditLog = React.lazy(() => import("./pages/AuditLog"));
const LeaveManagement = React.lazy(() => import("./pages/LeaveManagement"));
const ATS = React.lazy(() => import("./pages/hr/ATS"));
const Onboarding = React.lazy(() => import("./pages/hr/Onboarding"));
const Benefits = React.lazy(() => import("./pages/hr/Benefits"));
const Expenses = React.lazy(() => import("./pages/hr/Expenses"));
const Intranet = React.lazy(() => import("./pages/hr/Intranet"));
const HRAnalytics = React.lazy(() => import("./pages/hr/HRAnalytics"));
const PerformanceDashboard = React.lazy(() => import("./pages/PerformanceDashboard"));
const CaseOutcomes = React.lazy(() => import("./pages/CaseOutcomes"));
const ConflictChecker = React.lazy(() => import("./pages/ConflictChecker"));
const EmailInbox = React.lazy(() => import("./pages/EmailInbox"));
const ReportsDashboard = React.lazy(() => import("./pages/ReportsDashboard"));
const DataExport = React.lazy(() => import("./pages/DataExport"));
const WhatsAppMessenger = React.lazy(() => import("./pages/WhatsAppMessenger"));
const HRDashboard = React.lazy(() => import("./pages/HRDashboard"));
const Chat = React.lazy(() => import("./pages/Chat"));
const Board = React.lazy(() => import("./pages/Board"));
const CustomPageViewer = React.lazy(() => import("./pages/CustomPageViewer"));
const OrbitComponentTester = React.lazy(() => import("./pages/admin/OrbitComponentTester"));
const TowerManager = React.lazy(() => import("./pages/TowerManager"));
const MasterPortalRouter = React.lazy(() => import("./components/portal/MasterPortalRouter"));
const PortalManagement = React.lazy(() => import("./pages/settings/PortalManagement"));
const TimeTracking = React.lazy(() => import("./pages/TimeTracking"));
const SchoolStudents = React.lazy(() => import("./pages/school/Students"));
const StudentProfile = React.lazy(() => import("./pages/school/StudentProfile"));
const SchoolParents = React.lazy(() => import("./pages/school/Parents"));
const SchoolTeachers = React.lazy(() => import("./pages/school/Teachers"));
const SchoolClasses = React.lazy(() => import("./pages/school/Classes"));
const SchoolTimetable = React.lazy(() => import("./pages/school/Timetable"));
const SchoolAssignments = React.lazy(() => import("./pages/school/Assignments"));
const SchoolDiscipline = React.lazy(() => import("./pages/school/Discipline"));
const SchoolNotices = React.lazy(() => import("./pages/school/Notices"));
const SchoolTransport = React.lazy(() => import("./pages/school/Transport"));
const SchoolHostel = React.lazy(() => import("./pages/school/Hostel"));
const SchoolAttendance = React.lazy(() => import("./pages/school/Attendance"));
const SchoolGrades = React.lazy(() => import("./pages/school/Grades"));
const SchoolExams = React.lazy(() => import("./pages/school/Exams"));
const SchoolFees = React.lazy(() => import("./pages/school/FeeManagement"));
const SchoolLibrary = React.lazy(() => import("./pages/school/Library"));
const SchoolParentPortal = React.lazy(() => import("./pages/school/ParentPortal"));
const SchoolStudentPortal = React.lazy(() => import("./pages/school/StudentPortal"));
const SchoolGamification = React.lazy(() => import("./pages/school/Gamification"));
const SchoolTeacherEvaluations = React.lazy(() => import("./pages/school/TeacherEvaluations"));
const SchoolCanteenPOS = React.lazy(() => import("./pages/school/CanteenPOS"));
const SchoolComplaints = React.lazy(() => import("./pages/school/Complaints"));
const SchoolSupportCenter = React.lazy(() => import("./pages/school/SupportCenter"));
const SchoolCampusMarketplace = React.lazy(() => import("./pages/school/CampusMarketplace"));
const SchoolInstitutionSettings = React.lazy(() => import("./pages/school/InstitutionSettings"));
const HospitalPatients = React.lazy(() => import("./pages/hospital/Patients"));
const HospitalAppointments = React.lazy(() => import("./pages/hospital/Appointments"));
const HospitalWards = React.lazy(() => import("./pages/hospital/Wards"));
const HospitalPrescriptions = React.lazy(() => import("./pages/hospital/Prescriptions"));
const HospitalLabResults = React.lazy(() => import("./pages/hospital/LabResults"));
const HospitalPharmacy = React.lazy(() => import("./pages/hospital/Pharmacy"));
const HospitalPatientPortal = React.lazy(() => import("./pages/hospital/PatientPortal"));
const HospitalBilling = React.lazy(() => import("./pages/hospital/HospitalBilling"));
const HospitalClaims = React.lazy(() => import("./pages/hospital/HospitalClaims"));
const HospitalTelemedicine = React.lazy(() => import("./pages/hospital/Telemedicine"));
const HospitalOperationTheater = React.lazy(() => import("./pages/hospital/OperationTheater"));
const HospitalRadiology = React.lazy(() => import("./pages/hospital/Radiology"));
const HospitalAmbulanceDispatch = React.lazy(() => import("./pages/hospital/AmbulanceDispatch"));
const HospitalReferrals = React.lazy(() => import("./pages/hospital/Referrals"));
const HospitalBloodBank = React.lazy(() => import("./pages/hospital/BloodBank"));
const HospitalQueue = React.lazy(() => import("./pages/hospital/Queue"));
const HospitalStaffRoster = React.lazy(() => import("./pages/hospital/StaffRoster"));
const HospitalInfectionControl = React.lazy(() => import("./pages/hospital/InfectionControl"));
const HotelFrontDesk = React.lazy(() => import("./pages/hotel/FrontDesk"));
const HotelReservations = React.lazy(() => import("./pages/hotel/Reservations"));
const HotelRooms = React.lazy(() => import("./pages/hotel/Rooms"));
const HotelHousekeeping = React.lazy(() => import("./pages/hotel/Housekeeping"));
const HotelRevenueManagement = React.lazy(() => import("./pages/hotel/RevenueManagement"));
const HotelLoyalty = React.lazy(() => import("./pages/hotel/Loyalty"));
const HotelRestaurant = React.lazy(() => import("./pages/hotel/Restaurant"));
const HotelGuestRequests = React.lazy(() => import("./pages/hotel/GuestRequests"));
const HotelGuestPortal = React.lazy(() => import("./pages/hotel/GuestPortal"));
const HotelGuests = React.lazy(() => import("./pages/hotel/Guests"));
const PharmacyDashboard = React.lazy(() => import("./pages/pharmacy/Dashboard"));
const PharmacyPOS = React.lazy(() => import("./pages/pharmacy/POS"));
const PharmacyPrescriptions = React.lazy(() => import("./pages/pharmacy/Prescriptions"));
const PharmacyCustomers = React.lazy(() => import("./pages/pharmacy/Customers"));
const PharmacyDrugs = React.lazy(() => import("./pages/pharmacy/Drugs"));
const PharmacyInventory = React.lazy(() => import("./pages/pharmacy/Inventory"));
const PharmacyClaims = React.lazy(() => import("./pages/pharmacy/Claims"));
const PharmacyReports = React.lazy(() => import("./pages/pharmacy/Reports"));
const RealEstateDashboard = React.lazy(() => import("./pages/real-estate/RealEstateDashboard"));
const RealEstateProperties = React.lazy(() => import("./pages/real-estate/Properties"));
const RealEstateClients = React.lazy(() => import("./pages/real-estate/Clients"));
const RealEstateLeases = React.lazy(() => import("./pages/real-estate/Leases"));
const RealEstateViewings = React.lazy(() => import("./pages/real-estate/Viewings"));
const RealEstateTransactions = React.lazy(() => import("./pages/real-estate/Transactions"));
const RealEstateOffers = React.lazy(() => import("./pages/real-estate/Offers"));
const RealEstateCommissions = React.lazy(() => import("./pages/real-estate/Commissions"));
const RealEstateRentPayments = React.lazy(() => import("./pages/real-estate/RentPayments"));
const RealEstateMaintenance = React.lazy(() => import("./pages/real-estate/Maintenance"));
const RealEstateCRMLeads = React.lazy(() => import("./pages/real-estate/CRMLeads"));
const RealEstateAgentMetrics = React.lazy(() => import("./pages/real-estate/AgentMetrics"));
const RealEstateAuditLog = React.lazy(() => import("./pages/real-estate/AuditLog"));
const RealEstateCommissionRules = React.lazy(() => import("./pages/real-estate/CommissionRules"));
const RealEstateComparableProperties = React.lazy(() => import("./pages/real-estate/ComparableProperties"));
const RealEstateContractorReviews = React.lazy(() => import("./pages/real-estate/ContractorReviews"));
const RealEstateContractors = React.lazy(() => import("./pages/real-estate/Contractors"));
const RealEstateCounterOffers = React.lazy(() => import("./pages/real-estate/CounterOffers"));
const RealEstateDocumentTemplates = React.lazy(() => import("./pages/real-estate/DocumentTemplates"));
const RealEstateESignatures = React.lazy(() => import("./pages/real-estate/ESignatures"));
const RealEstateEscrowAccounts = React.lazy(() => import("./pages/real-estate/EscrowAccounts"));
const RealEstateLeaseRenewals = React.lazy(() => import("./pages/real-estate/LeaseRenewals"));
const RealEstateMarketData = React.lazy(() => import("./pages/real-estate/MarketData"));
const RealEstateMarketIntelligence = React.lazy(() => import("./pages/real-estate/MarketIntelligence"));
const RealEstatePaymentSchedules = React.lazy(() => import("./pages/real-estate/PaymentSchedules"));
const RealEstateRecommendations = React.lazy(() => import("./pages/real-estate/Recommendations"));
const RealEstateTeamManagement = React.lazy(() => import("./pages/real-estate/TeamManagement"));
const RealEstateTrustAccounting = React.lazy(() => import("./pages/real-estate/TrustAccounting"));
const RealEstateAnalytics = React.lazy(() => import("./pages/real-estate/Analytics"));
const JCLLandManagement = React.lazy(() => import("./pages/real-estate-jcl/LandManagement"));
const JCLCustomerTimeline = React.lazy(() => import("./pages/real-estate-jcl/CustomerTimeline"));
const JCLCrmLeadsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLCrmLeads"));
const JCLClientsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLClients"));
const JCLDashboardPage = React.lazy(() => import("./pages/real-estate-jcl/JCLDashboard"));
const JCLPropertiesPage = React.lazy(() => import("./pages/real-estate-jcl/JCLProperties"));
const JCLTransactionsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLTransactions"));
const JCLViewingsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLViewings"));
const JCLLeasesPage = React.lazy(() => import("./pages/real-estate-jcl/JCLLeases"));
const JCLOffersPage = React.lazy(() => import("./pages/real-estate-jcl/JCLOffers"));
const SmartRealEstateDashboard = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLDashboardPage, {});
  return /* @__PURE__ */ jsx(RealEstateDashboard, {});
};
const SmartClientsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLClientsPage, {});
  return /* @__PURE__ */ jsx(RealEstateClients, {});
};
const SmartLeadsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLCrmLeadsPage, {});
  return /* @__PURE__ */ jsx(RealEstateCRMLeads, {});
};
const SmartPropertiesRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLPropertiesPage, {});
  return /* @__PURE__ */ jsx(RealEstateProperties, {});
};
const SmartTransactionsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLTransactionsPage, {});
  return /* @__PURE__ */ jsx(RealEstateTransactions, {});
};
const SmartViewingsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLViewingsPage, {});
  return /* @__PURE__ */ jsx(RealEstateViewings, {});
};
const SmartLeasesRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLLeasesPage, {});
  return /* @__PURE__ */ jsx(RealEstateLeases, {});
};
const JCLTrustAccountingPage = React.lazy(() => import("./pages/real-estate-jcl/JCLTrustAccounting"));
const JCLEscrowAccountsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLEscrowAccounts"));
const JCLDocumentTemplatesPage = React.lazy(() => import("./pages/real-estate-jcl/JCLDocumentTemplates"));
const JCLESignaturesPage = React.lazy(() => import("./pages/real-estate-jcl/JCLESignatures"));
const JCLCommissionRulesPage = React.lazy(() => import("./pages/real-estate-jcl/JCLCommissionRules"));
const JCLAuditLogPage = React.lazy(() => import("./pages/real-estate-jcl/JCLAuditLog"));
const SmartDocumentTemplatesRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLDocumentTemplatesPage, {});
  return /* @__PURE__ */ jsx(RealEstateDocumentTemplates, {});
};
const SmartESignaturesRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLESignaturesPage, {});
  return /* @__PURE__ */ jsx(RealEstateESignatures, {});
};
const SmartCommissionRulesRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLCommissionRulesPage, {});
  return /* @__PURE__ */ jsx(RealEstateCommissionRules, {});
};
const SmartAuditLogRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLAuditLogPage, {});
  return /* @__PURE__ */ jsx(RealEstateAuditLog, {});
};
const JCLContractorsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLContractors"));
const JCLContractorReviewsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLContractorReviews"));
const JCLLeaseRenewalsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLLeaseRenewals"));
const JCLMaintenancePage = React.lazy(() => import("./pages/real-estate-jcl/JCLMaintenance"));
const SmartMaintenanceRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLMaintenancePage, {});
  return /* @__PURE__ */ jsx(RealEstateMaintenance, {});
};
const SmartContractorsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLContractorsPage, {});
  return /* @__PURE__ */ jsx(RealEstateContractors, {});
};
const SmartContractorReviewsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLContractorReviewsPage, {});
  return /* @__PURE__ */ jsx(RealEstateContractorReviews, {});
};
const SmartLeaseRenewalsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLLeaseRenewalsPage, {});
  return /* @__PURE__ */ jsx(RealEstateLeaseRenewals, {});
};
const JCLAnalyticsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLAnalytics"));
const JCLCounterOffersPage = React.lazy(() => import("./pages/real-estate-jcl/JCLCounterOffers"));
const JCLPaymentSchedulesPage = React.lazy(() => import("./pages/real-estate-jcl/JCLPaymentSchedules"));
const JCLRentPaymentsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLRentPayments"));
const SmartOffersRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLOffersPage, {});
  return /* @__PURE__ */ jsx(RealEstateOffers, {});
};
const SmartCounterOffersRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLCounterOffersPage, {});
  return /* @__PURE__ */ jsx(RealEstateCounterOffers, {});
};
const SmartPaymentSchedulesRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLPaymentSchedulesPage, {});
  return /* @__PURE__ */ jsx(RealEstatePaymentSchedules, {});
};
const SmartRentPaymentsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLRentPaymentsPage, {});
  return /* @__PURE__ */ jsx(RealEstateRentPayments, {});
};
const SmartTrustAccountingRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLTrustAccountingPage, {});
  return /* @__PURE__ */ jsx(RealEstateTrustAccounting, {});
};
const SmartEscrowAccountsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLEscrowAccountsPage, {});
  return /* @__PURE__ */ jsx(RealEstateEscrowAccounts, {});
};
const SmartCommissionsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLCommissionsPage, {});
  return /* @__PURE__ */ jsx(RealEstateCommissions, {});
};
const SmartAnalyticsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLAnalyticsPage, {});
  return /* @__PURE__ */ jsx(RealEstateAnalytics, {});
};
const JCLComparablePropertiesPage = React.lazy(() => import("./pages/real-estate-jcl/JCLComparableProperties"));
const JCLMarketDataPage = React.lazy(() => import("./pages/real-estate-jcl/JCLMarketData"));
const JCLTenantPortalPage = React.lazy(() => import("./pages/real-estate-jcl/JCLTenantPortal"));
const JCLLandlordPortalPage = React.lazy(() => import("./pages/real-estate-jcl/JCLLandlordPortal"));
const JCLTeamManagementPage = React.lazy(() => import("./pages/real-estate-jcl/JCLTeamManagement"));
const JCLAgentMetricsPage = React.lazy(() => import("./pages/real-estate-jcl/JCLAgentMetrics"));
const SmartComparablePropertiesRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLComparablePropertiesPage, {});
  return /* @__PURE__ */ jsx(RealEstateComparableProperties, {});
};
const SmartMarketDataRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLMarketDataPage, {});
  return /* @__PURE__ */ jsx(RealEstateMarketData, {});
};
const SmartTenantPortalRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLTenantPortalPage, {});
  return /* @__PURE__ */ jsx(RealEstateTenantPortal, {});
};
const SmartLandlordPortalRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLLandlordPortalPage, {});
  return /* @__PURE__ */ jsx(RealEstateLandlordPortal, {});
};
const SmartTeamManagementRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLTeamManagementPage, {});
  return /* @__PURE__ */ jsx(RealEstateTeamManagement, {});
};
const SmartAgentMetricsRouter = () => {
  const { user } = useAuth();
  const ind = sessionStorage.getItem("slate_industry_override") || user?.company_industry;
  if (ind === "real_estate_jcl") return /* @__PURE__ */ jsx(JCLAgentMetricsPage, {});
  return /* @__PURE__ */ jsx(RealEstateAgentMetrics, {});
};
const ReligionMembers = React.lazy(() => import("./pages/religion/Members"));
const ReligionGroups = React.lazy(() => import("./pages/religion/Groups"));
const ReligionEvents = React.lazy(() => import("./pages/religion/Events"));
const ReligionDonations = React.lazy(() => import("./pages/religion/Donations"));
const ReligionVolunteers = React.lazy(() => import("./pages/religion/Volunteers"));
const ReligionSermons = React.lazy(() => import("./pages/religion/Sermons"));
const ReligionSmallGroups = React.lazy(() => import("./pages/religion/SmallGroups"));
const ReligionPrayers = React.lazy(() => import("./pages/religion/Prayers"));
const ReligionMemberPortal = React.lazy(() => import("./pages/religion/MemberPortal"));
const ReligionMilestones = React.lazy(() => import("./pages/religion/Milestones"));
const InsurancePolicies = React.lazy(() => import("./pages/insurance/Policies"));
const InsuranceClaims = React.lazy(() => import("./pages/insurance/Claims"));
const InsuranceClients = React.lazy(() => import("./pages/insurance/Clients"));
const InsurancePolicyholderPortal = React.lazy(() => import("./pages/insurance/PolicyholderPortal"));
const InsuranceUnderwriting = React.lazy(() => import("./pages/insurance/Underwriting"));
const ActuarialDashboard = React.lazy(() => import("./pages/insurance/ActuarialDashboard"));
const Reinsurance = React.lazy(() => import("./pages/insurance/Reinsurance"));
const InsuranceAgentPerformance = React.lazy(() => import("./pages/insurance/AgentPerformance"));
const InsurancePremiums = React.lazy(() => import("./pages/insurance/Premiums"));
const RetailDashboard = React.lazy(() => import("./pages/retail/RetailDashboard"));
const RetailPurchaseOrders = React.lazy(() => import("./pages/retail/PurchaseOrders"));
const RetailPromotions = React.lazy(() => import("./pages/retail/Promotions"));
const RetailInventory = React.lazy(() => import("./pages/retail/Inventory"));
const RetailPOS = React.lazy(() => import("./pages/retail/POS"));
const RetailSales = React.lazy(() => import("./pages/retail/Sales"));
const RetailSuppliers = React.lazy(() => import("./pages/retail/Suppliers"));
const Products = React.lazy(() => import("./pages/retail/Products"));
const Orders = React.lazy(() => import("./pages/retail/Orders"));
const Loyalty = React.lazy(() => import("./pages/retail/Loyalty"));
const Shifts = React.lazy(() => import("./pages/retail/Shifts"));
const RetailCustomers = React.lazy(() => import("./pages/retail/Customers"));
const RetailCustomerPortal = React.lazy(() => import("./pages/retail/CustomerPortal"));
const BarcodeManagement = React.lazy(() => import("./pages/retail/BarcodeManagement"));
const RMAManagement = React.lazy(() => import("./pages/retail/RMAManagement"));
const OnlineStoreBuilder = React.lazy(() => import("./pages/retail/OnlineStoreBuilder"));
const B2BWholesalePortal = React.lazy(() => import("./pages/retail/B2BWholesalePortal"));
const FranchiseManager = React.lazy(() => import("./pages/retail/FranchiseManager"));
const SmartDocs = React.lazy(() => import("./pages/logistics/SmartDocs"));
const RouteOptimization = React.lazy(() => import("./pages/logistics/RouteOptimization"));
const LoadBoard = React.lazy(() => import("./pages/logistics/LoadBoard"));
const GeofenceAlerts = React.lazy(() => import("./pages/logistics/GeofenceAlerts"));
const LogisticsShipments = React.lazy(() => import("./pages/logistics/Shipments"));
const Pickups = React.lazy(() => import("./pages/logistics/Pickups"));
const LogisticsFleet = React.lazy(() => import("./pages/logistics/Fleet"));
const LogisticsDrivers = React.lazy(() => import("./pages/logistics/Drivers"));
const LogisticsTrackingPortal = React.lazy(() => import("./pages/logistics/TrackingPortal"));
const LogisticsWarehouse = React.lazy(() => import("./pages/logistics/Warehouse"));
const LogisticsRouteOptimization = React.lazy(() => import("./pages/logistics/RouteOptimization"));
const LogisticsProofOfDelivery = React.lazy(() => import("./pages/logistics/ProofOfDelivery"));
const LogisticsIncidentManagement = React.lazy(() => import("./pages/logistics/IncidentManagement"));
const LogisticsReturnsManagement = React.lazy(() => import("./pages/retail/RMAManagement"));
const LogisticsAdvancedAnalytics = React.lazy(() => import("./pages/logistics/AdvancedAnalytics"));
const LogisticsDriverMobileApp = React.lazy(() => import("./pages/logistics/DriverMobileApp"));
const HREmployees = React.lazy(() => import("./pages/hr/Employees"));
const HRRecruitment = React.lazy(() => import("./pages/hr/Recruitment"));
const HRPayroll = React.lazy(() => import("./pages/hr/Payroll"));
const HRLeave = React.lazy(() => import("./pages/hr/Leave"));
const HRDepartments = React.lazy(() => import("./pages/hr/Departments"));
const HRRoles = React.lazy(() => import("./pages/hr/Roles"));
const HRAttendance = React.lazy(() => import("./pages/hr/Attendance"));
const HRPerformance = React.lazy(() => import("./pages/hr/Performance"));
const HRTraining = React.lazy(() => import("./pages/hr/Training"));
const HRComplaints = React.lazy(() => import("./pages/hr/Complaints"));
const HRPromotions = React.lazy(() => import("./pages/hr/Promotions"));
const HRSalary = React.lazy(() => import("./pages/hr/Salary"));
import AppLayout from "./components/layout/AppLayout";
const Login = React.lazy(() => import("./pages/Login"));
const SignUp = React.lazy(() => import("./pages/SignUp"));
const ForceResetPassword = React.lazy(() => import("./pages/ForceResetPassword"));
const SSOGateway = React.lazy(() => import("./pages/auth/SSOGateway"));
const SSOCallback = React.lazy(() => import("./pages/auth/SSOCallback"));
const GoogleCallback = React.lazy(() => import("./pages/auth/GoogleCallback"));
import AccountPortalLayout from "./components/layout/AccountPortalLayout";
const AccountPortal = React.lazy(() => import("./pages/auth/AccountPortal"));
const AccountSecurity = React.lazy(() => import("./pages/auth/AccountSecurity"));
const AccountPersonalInfo = React.lazy(() => import("./pages/auth/AccountPersonalInfo"));
const AccountPayments = React.lazy(() => import("./pages/auth/AccountPayments"));
const AccountDevices = React.lazy(() => import("./pages/auth/AccountDevices"));
const AccountHelp = React.lazy(() => import("./pages/auth/AccountHelp"));
const AccountDocs = React.lazy(() => import("./pages/auth/AccountDocs"));
const AccountTutorials = React.lazy(() => import("./pages/auth/AccountTutorials"));
const SuperAdminDashboard = React.lazy(() => import("./pages/auth/SuperAdminDashboard"));
const AccountLogin = React.lazy(() => import("./pages/auth/AccountLogin"));
const AccountSignUp = React.lazy(() => import("./pages/auth/AccountSignUp"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
import { SiteDomainResolver } from "@/components/sites/SiteRenderer/SiteDomainResolver";
const SlateSites = React.lazy(() => import("./pages/sites/SlateSites"));
const SiteBuilderPage = React.lazy(() => import("./pages/sites/SiteBuilderPage"));
import { getSubdomainAndBase } from "@/lib/domainUtils";
const UniDashboard = React.lazy(() => import("./pages/university/UniDashboard"));
const UniStudents = React.lazy(() => import("./pages/university/UniStudents"));
const UniFaculties = React.lazy(() => import("./pages/university/UniFaculties"));
const UniCourses = React.lazy(() => import("./pages/university/UniCourses"));
const UniAdmissions = React.lazy(() => import("./pages/university/UniAdmissions"));
const UniFinance = React.lazy(() => import("./pages/university/UniFinance"));
const UniEnrollment = React.lazy(() => import("./pages/university/UniEnrollment"));
const UniRevenue = React.lazy(() => import("./pages/university/UniRevenue"));
const UniResearchActivity = React.lazy(() => import("./pages/university/UniResearchActivity"));
const UniGraduationStats = React.lazy(() => import("./pages/university/UniGraduationStats"));
const UniAcademicStructure = React.lazy(() => import("./pages/university/UniAcademicStructure"));
const UniRegistration = React.lazy(() => import("./pages/university/UniRegistration"));
const UniLMS = React.lazy(() => import("./pages/university/UniLMS"));
const UniExams = React.lazy(() => import("./pages/university/UniExams"));
const UniHostel = React.lazy(() => import("./pages/university/UniHostel"));
const UniLibrary = React.lazy(() => import("./pages/university/UniLibrary"));
const UniCareerAlumni = React.lazy(() => import("./pages/university/UniCareerAlumni"));
const DispatchBoard = React.lazy(() => import("./pages/logistics/DispatchBoard"));
const Warehouse = React.lazy(() => import("./pages/logistics/Warehouse"));
const VDashboard = React.lazy(() => import("./pages/vocational/VDashboard"));
const VTrades = React.lazy(() => import("./pages/vocational/VTrades"));
const VCourses = React.lazy(() => import("./pages/vocational/VCourses"));
const VWorkshops = React.lazy(() => import("./pages/vocational/VWorkshops"));
const VPracticalModules = React.lazy(() => import("./pages/vocational/VPracticalModules"));
const VTraineeProfiles = React.lazy(() => import("./pages/vocational/VTraineeProfiles"));
const VTrainingProgress = React.lazy(() => import("./pages/vocational/VTrainingProgress"));
const VWorkshopAssessments = React.lazy(() => import("./pages/vocational/VWorkshopAssessments"));
const VPracticalExams = React.lazy(() => import("./pages/vocational/VPracticalExams"));
const VSkillDemonstrations = React.lazy(() => import("./pages/vocational/VSkillDemonstrations"));
const VCompetencyTracking = React.lazy(() => import("./pages/vocational/VCompetencyTracking"));
const VEquipmentInventory = React.lazy(() => import("./pages/vocational/VEquipmentInventory"));
const VEquipmentReservations = React.lazy(() => import("./pages/vocational/VEquipmentReservations"));
const VMaintenance = React.lazy(() => import("./pages/vocational/VMaintenance"));
const VInternshipTracking = React.lazy(() => import("./pages/vocational/VInternshipTracking"));
const VIndustrialAttachments = React.lazy(() => import("./pages/vocational/VIndustrialAttachments"));
const VEmployerEvaluations = React.lazy(() => import("./pages/vocational/VEmployerEvaluations"));
const VCertificates = React.lazy(() => import("./pages/vocational/VCertificates"));
const VSkillBadges = React.lazy(() => import("./pages/vocational/VSkillBadges"));
const VQualificationTracking = React.lazy(() => import("./pages/vocational/VQualificationTracking"));
const VJobOpportunities = React.lazy(() => import("./pages/vocational/VJobOpportunities"));
const VEmployers = React.lazy(() => import("./pages/vocational/VEmployers"));
const VPlacementReports = React.lazy(() => import("./pages/vocational/VPlacementReports"));
const VCertificationRates = React.lazy(() => import("./pages/vocational/VCertificationRates"));
const VEmploymentRates = React.lazy(() => import("./pages/vocational/VEmploymentRates"));
const VCoursePerformance = React.lazy(() => import("./pages/vocational/VCoursePerformance"));
const OnlineDashboard = React.lazy(() => import("./pages/online/OnlineDashboard"));
const OnlineLearners = React.lazy(() => import("./pages/online/OnlineLearners"));
const OnlineCourses = React.lazy(() => import("./pages/online/OnlineCourses"));
const OnlineSales = React.lazy(() => import("./pages/online/OnlineSales"));
const OnlineMarketplace = React.lazy(() => import("./pages/online/OnlineMarketplace"));
const CourseDetails = React.lazy(() => import("./pages/online/CourseDetails"));
const InstructorProfile = React.lazy(() => import("./pages/online/InstructorProfile"));
const OnlineBuilder = React.lazy(() => import("./pages/online/OnlineBuilder"));
const LessonBuilder = React.lazy(() => import("./pages/online/LessonBuilder"));
const AssessmentBuilder = React.lazy(() => import("./pages/online/AssessmentBuilder"));
const MediaManager = React.lazy(() => import("./pages/online/MediaManager"));
const LearningPlayer = React.lazy(() => import("./pages/online/LearningPlayer"));
const StudentDashboard = React.lazy(() => import("./pages/online/StudentDashboard"));
const LearnerProfile = React.lazy(() => import("./pages/online/LearnerProfile"));
const NotesCenter = React.lazy(() => import("./pages/online/NotesCenter"));
const OnlineAssessments = React.lazy(() => import("./pages/online/OnlineAssessments"));
const OnlineCertificates = React.lazy(() => import("./pages/online/OnlineCertificates"));
const UnifiedInbox = React.lazy(() => import("./pages/UnifiedInbox"));
const OnlineLive = React.lazy(() => import("./pages/online/OnlineLive"));
const Checkout = React.lazy(() => import("./pages/online/Checkout"));
const OnlineSubscriptions = React.lazy(() => import("./pages/online/OnlineSubscriptions"));
const OnlineAffiliates = React.lazy(() => import("./pages/online/OnlineAffiliates"));
const CorporateDashboard = React.lazy(() => import("./pages/online/CorporateDashboard"));
const OnlineCommunity = React.lazy(() => import("./pages/online/OnlineCommunity"));
const OrbitAIAssistant = React.lazy(() => import("./pages/online/OrbitAIAssistant"));
const SHSClasses = React.lazy(() => import("./pages/highschool/SHSClasses"));
const SHSStudents = React.lazy(() => import("./pages/highschool/SHSStudents"));
const SHSProgrammes = React.lazy(() => import("./pages/highschool/SHSProgrammes"));
const SHSHouses = React.lazy(() => import("./pages/highschool/SHSHouses"));
const SHSTimetable = React.lazy(() => import("./pages/highschool/SHSTimetable"));
const SHSAdmissions = React.lazy(() => import("./pages/highschool/SHSAdmissions"));
const SHSGrades = React.lazy(() => import("./pages/highschool/SHSGrades"));
const SHSFees = React.lazy(() => import("./pages/highschool/SHSFees"));
const SHSDashboard = React.lazy(() => import("./pages/highschool/SHSDashboard"));
const SHSStudentProfiles = React.lazy(() => import("./pages/highschool/SHSStudentProfiles"));
const SHSStudentPromotion = React.lazy(() => import("./pages/highschool/SHSStudentPromotion"));
const SHSStudentTransfers = React.lazy(() => import("./pages/highschool/SHSStudentTransfers"));
const SHSDisciplineRecords = React.lazy(() => import("./pages/highschool/SHSDisciplineRecords"));
const SHSMedicalRecords = React.lazy(() => import("./pages/highschool/SHSMedicalRecords"));
const SHSApplicantReview = React.lazy(() => import("./pages/highschool/SHSApplicantReview"));
const SHSAdmissionDecisions = React.lazy(() => import("./pages/highschool/SHSAdmissionDecisions"));
const SHSEnrollment = React.lazy(() => import("./pages/highschool/SHSEnrollment"));
const SHSStreams = React.lazy(() => import("./pages/highschool/SHSStreams"));
const SHSSubjects = React.lazy(() => import("./pages/highschool/SHSSubjects"));
const SHSElectives = React.lazy(() => import("./pages/highschool/SHSElectives"));
const SHSAcademicCalendar = React.lazy(() => import("./pages/highschool/SHSAcademicCalendar"));
const SHSDailyAttendance = React.lazy(() => import("./pages/highschool/SHSDailyAttendance"));
const SHSClassAttendance = React.lazy(() => import("./pages/highschool/SHSClassAttendance"));
const SHSTeacherAttendance = React.lazy(() => import("./pages/highschool/SHSTeacherAttendance"));
const SHSAttendanceReports = React.lazy(() => import("./pages/highschool/SHSAttendanceReports"));
const SHSInternalExams = React.lazy(() => import("./pages/highschool/SHSInternalExams"));
const SHSMockExams = React.lazy(() => import("./pages/highschool/SHSMockExams"));
const SHSContinuousAssessment = React.lazy(() => import("./pages/highschool/SHSContinuousAssessment"));
const SHSResultsProcessing = React.lazy(() => import("./pages/highschool/SHSResultsProcessing"));
const SHSReportCards = React.lazy(() => import("./pages/highschool/SHSReportCards"));
const SHSDormitories = React.lazy(() => import("./pages/highschool/SHSDormitories"));
const SHSRoomAllocation = React.lazy(() => import("./pages/highschool/SHSRoomAllocation"));
const SHSHouseMasters = React.lazy(() => import("./pages/highschool/SHSHouseMasters"));
const SHSBoardingAttendance = React.lazy(() => import("./pages/highschool/SHSBoardingAttendance"));
const SHSParentProgress = React.lazy(() => import("./pages/highschool/SHSParentProgress"));
const SHSParentAttendance = React.lazy(() => import("./pages/highschool/SHSParentAttendance"));
const SHSParentFees = React.lazy(() => import("./pages/highschool/SHSParentFees"));
const SHSParentComms = React.lazy(() => import("./pages/highschool/SHSParentComms"));
const SHSInvoices = React.lazy(() => import("./pages/highschool/SHSInvoices"));
const SHSPayments = React.lazy(() => import("./pages/highschool/SHSPayments"));
const SHSScholarships = React.lazy(() => import("./pages/highschool/SHSScholarships"));
const SHSFinancialReports = React.lazy(() => import("./pages/highschool/SHSFinancialReports"));
const SHSBooks = React.lazy(() => import("./pages/highschool/SHSBooks"));
const SHSBorrowing = React.lazy(() => import("./pages/highschool/SHSBorrowing"));
const SHSReturns = React.lazy(() => import("./pages/highschool/SHSReturns"));
const SHSDigitalResources = React.lazy(() => import("./pages/highschool/SHSDigitalResources"));
const SHSBuses = React.lazy(() => import("./pages/highschool/SHSBuses"));
const OrbitBuildPage = React.lazy(() => import("./pages/OrbitBuildPage"));
const SHSRoutes = React.lazy(() => import("./pages/highschool/SHSRoutes"));
const SHSStudentAssignments = React.lazy(() => import("./pages/highschool/SHSStudentAssignments"));
const SHSNotices = React.lazy(() => import("./pages/highschool/SHSNotices"));
const SHSSMS = React.lazy(() => import("./pages/highschool/SHSSMS"));
const SHSWhatsApp = React.lazy(() => import("./pages/highschool/SHSWhatsApp"));
const SHSEmailComms = React.lazy(() => import("./pages/highschool/SHSEmailComms"));
const SHSAcademicAnalytics = React.lazy(() => import("./pages/highschool/SHSAcademicAnalytics"));
const SHSAttendanceAnalytics = React.lazy(() => import("./pages/highschool/SHSAttendanceAnalytics"));
const SHSFinancialAnalytics = React.lazy(() => import("./pages/highschool/SHSFinancialAnalytics"));
import MarketingLayout from "./components/layout/MarketingLayout";
const Home = React.lazy(() => import("./pages/marketing/Home"));
const Features = React.lazy(() => import("./pages/marketing/Features"));
const Pricing = React.lazy(() => import("./pages/marketing/Pricing"));
const About = React.lazy(() => import("./pages/marketing/About"));
const Contact = React.lazy(() => import("./pages/marketing/Contact"));
const EnterpriseContact = React.lazy(() => import("./pages/marketing/EnterpriseContact"));
const Integrations = React.lazy(() => import("./pages/marketing/Integrations"));
const Changelog = React.lazy(() => import("./pages/marketing/Changelog"));
const Customers = React.lazy(() => import("./pages/marketing/Customers"));
const Security = React.lazy(() => import("./pages/marketing/Security"));
const Solutions = React.lazy(() => import("./pages/marketing/Solutions"));
const RoiCalculator = React.lazy(() => import("./pages/marketing/RoiCalculator"));
const Partners = React.lazy(() => import("./pages/marketing/Partners"));
const LegalDocs = React.lazy(() => import("./pages/marketing/LegalDocs"));
const OnboardingWizard = React.lazy(() => import("./pages/OnboardingWizard"));
const GenericModulePage = React.lazy(() => import("./pages/GenericModulePage"));
const CreateModulePage = React.lazy(() => import("./pages/CreateModulePage"));
const Marketplace = React.lazy(() => import("./pages/Marketplace"));
const AdminOverview = React.lazy(() => import("./pages/admin/AdminOverview"));
const AdminFirms = React.lazy(() => import("./pages/admin/AdminFirms"));
const AdminUsers = React.lazy(() => import("./pages/admin/AdminUsers"));
const AdminBilling = React.lazy(() => import("./pages/admin/AdminBilling"));
import SuperAdminBilling from "./components/orbitbolt/SuperAdminBilling";
const AdminSecurity = React.lazy(() => import("./pages/admin/AdminSecurity"));
const AdminBroadcasts = React.lazy(() => import("./pages/admin/AdminBroadcasts"));
const AdminIntelligence = React.lazy(() => import("./pages/admin/AdminIntelligence"));
const AdminRollout = React.lazy(() => import("./pages/admin/AdminRollout"));
const AdminQuotas = React.lazy(() => import("./pages/admin/AdminQuotas"));
const AdminEnterpriseRequests = React.lazy(() => import("./pages/admin/AdminEnterpriseRequests"));
const AdminPartners = React.lazy(() => import("./pages/admin/AdminPartners"));
const NotificationsInbox = React.lazy(() => import("./pages/NotificationsInbox"));
const FeatureLab = React.lazy(() => import("./pages/FeatureLab"));
const FeatureVault = React.lazy(() => import("./pages/FeatureVault"));
const AdminFeatureInsider = React.lazy(() => import("./pages/admin/AdminFeatureInsider"));
function PlatformRoutes() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/ob/:pageName", element: /* @__PURE__ */ jsx(OrbitBuildPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(Dashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel", element: /* @__PURE__ */ jsx(OptavelCommandCenter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel/executive", element: /* @__PURE__ */ jsx(OptavelExecutive, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel/product", element: /* @__PURE__ */ jsx(OptavelProductEng, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel/marketing", element: /* @__PURE__ */ jsx(OptavelMarketing, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel/sales", element: /* @__PURE__ */ jsx(OptavelSales, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel/finance", element: /* @__PURE__ */ jsx(OptavelFinance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel/hr", element: /* @__PURE__ */ jsx(OptavelHR, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel/support", element: /* @__PURE__ */ jsx(OptavelSupport, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/optavel/partnerships", element: /* @__PURE__ */ jsx(OptavelPartnerships, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/intelligence", element: /* @__PURE__ */ jsx(Intelligence, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/cases", element: /* @__PURE__ */ jsx(UnivProject, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/clients", element: /* @__PURE__ */ jsx(Clients, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/calendar", element: /* @__PURE__ */ jsx(CalendarPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/invoices", element: /* @__PURE__ */ jsx(UnivInvoice, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/tasks", element: /* @__PURE__ */ jsx(Tasks, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/documents", element: /* @__PURE__ */ jsx(Navigate, { to: "/smart-docs", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/smart-docs", element: /* @__PURE__ */ jsx(HCMSmartDocs, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/team", element: /* @__PURE__ */ jsx(UnivHREmployee, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/settings", element: /* @__PURE__ */ jsx(Settings, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/portal", element: /* @__PURE__ */ jsx(PortalManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/settings/custom-fields", element: /* @__PURE__ */ jsx(CustomFieldsSettings, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/roles", element: /* @__PURE__ */ jsx(Roles, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/departments", element: /* @__PURE__ */ jsx(Departments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/integrations", element: /* @__PURE__ */ jsx(AppIntegrations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/automations", element: /* @__PURE__ */ jsx(Automations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/notifications", element: /* @__PURE__ */ jsx(NotificationsInbox, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/sites", element: /* @__PURE__ */ jsx(SlateSites, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/sites/builder", element: /* @__PURE__ */ jsx(SiteBuilderPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/client-portal", element: /* @__PURE__ */ jsx(ClientPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/cases/:id", element: /* @__PURE__ */ jsx(CaseDetail, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/my-dashboard", element: /* @__PURE__ */ jsx(StaffDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/leads", element: /* @__PURE__ */ jsx(UnivCRM, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/billing", element: /* @__PURE__ */ jsx(BillingDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pipeline", element: /* @__PURE__ */ jsx(PipelinePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/research", element: /* @__PURE__ */ jsx(LegalResearch, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/audit", element: /* @__PURE__ */ jsx(AuditLog, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/leave", element: /* @__PURE__ */ jsx(UnivLeaveManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/performance", element: /* @__PURE__ */ jsx(PerformanceDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/outcomes", element: /* @__PURE__ */ jsx(CaseOutcomes, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/conflict-check", element: /* @__PURE__ */ jsx(ConflictChecker, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/email-inbox", element: /* @__PURE__ */ jsx(EmailInbox, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/reports", element: /* @__PURE__ */ jsx(ReportsDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/export", element: /* @__PURE__ */ jsx(DataExport, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/whatsapp", element: /* @__PURE__ */ jsx(WhatsAppMessenger, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr", element: /* @__PURE__ */ jsx(UnivHRSystem, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/ats", element: /* @__PURE__ */ jsx(ATS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/onboarding", element: /* @__PURE__ */ jsx(Onboarding, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/benefits", element: /* @__PURE__ */ jsx(Benefits, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/expenses", element: /* @__PURE__ */ jsx(Expenses, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/intranet", element: /* @__PURE__ */ jsx(Intranet, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr-analytics", element: /* @__PURE__ */ jsx(HRAnalytics, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/recruitment", element: /* @__PURE__ */ jsx(UnivRecruitment, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/inventory", element: /* @__PURE__ */ jsx(UnivInventory, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/payroll", element: /* @__PURE__ */ jsx(UnivPayroll, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/attendance", element: /* @__PURE__ */ jsx(UnivAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/leave-mgmt", element: /* @__PURE__ */ jsx(UnivLeaveManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/payments", element: /* @__PURE__ */ jsx(UnivPayment, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/assets", element: /* @__PURE__ */ jsx(UnivAssetManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/procurement", element: /* @__PURE__ */ jsx(UnivProcurement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/analytics", element: /* @__PURE__ */ jsx(UnivAnalytics, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/bom", element: /* @__PURE__ */ jsx(UnivBOM, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/boq", element: /* @__PURE__ */ jsx(UnivBOQ, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/bookings", element: /* @__PURE__ */ jsx(UnivBooking, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-calendar", element: /* @__PURE__ */ jsx(UnivCalendar, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/case-mgmt", element: /* @__PURE__ */ jsx(UnivCaseManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/class-attendance", element: /* @__PURE__ */ jsx(UnivClassAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/portal", element: /* @__PURE__ */ jsx(MasterPortalRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/contractors", element: /* @__PURE__ */ jsx(UnivContractor, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/courses", element: /* @__PURE__ */ jsx(UnivCourse, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/court", element: /* @__PURE__ */ jsx(UnivCourtCalendar, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-dashboard", element: /* @__PURE__ */ jsx(UnivDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/datagrid", element: /* @__PURE__ */ jsx(UnivDataGrid, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/delivery", element: /* @__PURE__ */ jsx(UnivDelivery, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/dining", element: /* @__PURE__ */ jsx(UnivDining, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/dispatch", element: /* @__PURE__ */ jsx(UnivDispatch, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/emr", element: /* @__PURE__ */ jsx(UnivEMR, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/faculty", element: /* @__PURE__ */ jsx(UnivFaculty, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/fleet", element: /* @__PURE__ */ jsx(UnivFleet, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/form", element: /* @__PURE__ */ jsx(UnivForm, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/gradebook", element: /* @__PURE__ */ jsx(UnivGradebook, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-housekeeping", element: /* @__PURE__ */ jsx(UnivHousekeeping, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/lms", element: /* @__PURE__ */ jsx(UnivLMS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/lab", element: /* @__PURE__ */ jsx(UnivLab, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/legal-docs", element: /* @__PURE__ */ jsx(UnivLegalDocument, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-appointments", element: /* @__PURE__ */ jsx(UnivAppointments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-machines", element: /* @__PURE__ */ jsx(UnivMachine, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-menus", element: /* @__PURE__ */ jsx(UnivMenu, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-messaging", element: /* @__PURE__ */ jsx(UnivMessaging, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-notifications", element: /* @__PURE__ */ jsx(UnivNotification, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-parent-portal", element: /* @__PURE__ */ jsx(UnivParentPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-patients", element: /* @__PURE__ */ jsx(UnivPatient, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-pos", element: /* @__PURE__ */ jsx(UnivPOS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-prescriptions", element: /* @__PURE__ */ jsx(UnivPrescription, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-production", element: /* @__PURE__ */ jsx(UnivProduction, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-quality-control", element: /* @__PURE__ */ jsx(UnivQualityControl, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-rooms", element: /* @__PURE__ */ jsx(UnivRoom, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-routes", element: /* @__PURE__ */ jsx(UnivRoute, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-safety", element: /* @__PURE__ */ jsx(UnivSafety, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-search", element: /* @__PURE__ */ jsx(UnivSearch, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-site-inspections", element: /* @__PURE__ */ jsx(UnivSiteInspection, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-students", element: /* @__PURE__ */ jsx(UnivStudent, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-subscriptions", element: /* @__PURE__ */ jsx(UnivSubscription, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-telemedicine", element: /* @__PURE__ */ jsx(UnivTelemedicine, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-timelines", element: /* @__PURE__ */ jsx(UnivTimeline, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-wards", element: /* @__PURE__ */ jsx(UnivWard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/univ-warehouses", element: /* @__PURE__ */ jsx(UnivWarehouse, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/firm-setup", element: /* @__PURE__ */ jsx(OnboardingWizard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/unified-inbox", element: /* @__PURE__ */ jsx(UnifiedInbox, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/chat", element: /* @__PURE__ */ jsx(Chat, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/board", element: /* @__PURE__ */ jsx(Board, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/join/:roomId", element: /* @__PURE__ */ jsx(JoinMeeting, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pages/:pageId", element: /* @__PURE__ */ jsx(CustomPageViewer, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/orbit-test/:componentName", element: /* @__PURE__ */ jsx(OrbitComponentTester, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/students", element: /* @__PURE__ */ jsx(SchoolStudents, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/students/:id", element: /* @__PURE__ */ jsx(StudentProfile, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/parents", element: /* @__PURE__ */ jsx(SchoolParents, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/teachers", element: /* @__PURE__ */ jsx(SchoolTeachers, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/complaints", element: /* @__PURE__ */ jsx(SchoolComplaints, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/support-center", element: /* @__PURE__ */ jsx(SchoolSupportCenter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/institution-settings", element: /* @__PURE__ */ jsx(SchoolInstitutionSettings, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/learner/:id", element: /* @__PURE__ */ jsx(LearnerProfile, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/notes", element: /* @__PURE__ */ jsx(NotesCenter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/assessments", element: /* @__PURE__ */ jsx(OnlineAssessments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/certificates", element: /* @__PURE__ */ jsx(OnlineCertificates, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/live", element: /* @__PURE__ */ jsx(OnlineLive, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/canteen-pos", element: /* @__PURE__ */ jsx(SchoolCanteenPOS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/classes", element: /* @__PURE__ */ jsx(SchoolClasses, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/timetable", element: /* @__PURE__ */ jsx(SchoolTimetable, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/assignments", element: /* @__PURE__ */ jsx(SchoolAssignments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/attendance", element: /* @__PURE__ */ jsx(SchoolAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/grades", element: /* @__PURE__ */ jsx(SchoolGrades, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/exams", element: /* @__PURE__ */ jsx(SchoolExams, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/discipline", element: /* @__PURE__ */ jsx(SchoolDiscipline, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/fees", element: /* @__PURE__ */ jsx(SchoolFees, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/library", element: /* @__PURE__ */ jsx(SchoolLibrary, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/transport", element: /* @__PURE__ */ jsx(SchoolTransport, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hostel", element: /* @__PURE__ */ jsx(SchoolHostel, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/notices", element: /* @__PURE__ */ jsx(SchoolNotices, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/student-portal", element: /* @__PURE__ */ jsx(SchoolStudentPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/parent-portal", element: /* @__PURE__ */ jsx(SchoolParentPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/gamification", element: /* @__PURE__ */ jsx(SchoolGamification, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/teacher-evaluations", element: /* @__PURE__ */ jsx(SchoolTeacherEvaluations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/", element: /* @__PURE__ */ jsx(UniDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/students", element: /* @__PURE__ */ jsx(UniStudents, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/faculties", element: /* @__PURE__ */ jsx(UniFaculties, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/courses", element: /* @__PURE__ */ jsx(UniCourses, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/admissions", element: /* @__PURE__ */ jsx(UniAdmissions, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/finance", element: /* @__PURE__ */ jsx(UniFinance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/enrollment", element: /* @__PURE__ */ jsx(UniEnrollment, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/revenue", element: /* @__PURE__ */ jsx(UniRevenue, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/research-activity", element: /* @__PURE__ */ jsx(UniResearchActivity, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/graduation-stats", element: /* @__PURE__ */ jsx(UniGraduationStats, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/academic-structure", element: /* @__PURE__ */ jsx(UniAcademicStructure, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/registration", element: /* @__PURE__ */ jsx(UniRegistration, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/lms", element: /* @__PURE__ */ jsx(UniLMS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/exams", element: /* @__PURE__ */ jsx(UniExams, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/hostel", element: /* @__PURE__ */ jsx(UniHostel, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/library", element: /* @__PURE__ */ jsx(UniLibrary, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/u/career-alumni", element: /* @__PURE__ */ jsx(UniCareerAlumni, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/", element: /* @__PURE__ */ jsx(VDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/trades", element: /* @__PURE__ */ jsx(VTrades, {}) }),
    /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(ClipadLayout, {}), children: [
      /* @__PURE__ */ jsx(Route, { path: "/clipad/space/:spaceId", element: /* @__PURE__ */ jsx(SpaceDashboard, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/record", element: /* @__PURE__ */ jsx(RecordVideo, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/watch/:videoId", element: /* @__PURE__ */ jsx(WatchVideo, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/meeting/:id", element: /* @__PURE__ */ jsx(MeetingRecord, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/save-meeting/:id", element: /* @__PURE__ */ jsx(SaveMeetingPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/settings", element: /* @__PURE__ */ jsx(CliPadSettings, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/integrations", element: /* @__PURE__ */ jsx(IntegrationsHub, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/search", element: /* @__PURE__ */ jsx(SearchHub, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/analytics", element: /* @__PURE__ */ jsx(VideoAnalytics, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/enterprise", element: /* @__PURE__ */ jsx(CliPadEnterpriseDashboard, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/health", element: /* @__PURE__ */ jsx(KnowledgeHealth, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/integration-analytics", element: /* @__PURE__ */ jsx(IntegrationAnalytics, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/timeline", element: /* @__PURE__ */ jsx(KnowledgeTimeline, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/decisions", element: /* @__PURE__ */ jsx(DecisionLedger, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/decisions/:decisionId/replay", element: /* @__PURE__ */ jsx(DecisionReplay, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/knowledge-graph", element: /* @__PURE__ */ jsx(KnowledgeGraph, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/action-items", element: /* @__PURE__ */ jsx(ActionItems, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/journey", element: /* @__PURE__ */ jsx(KnowledgeJourney, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/commitments", element: /* @__PURE__ */ jsx(CommitmentIntelligence, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/risk", element: /* @__PURE__ */ jsx(PredictiveRisk, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/pulse", element: /* @__PURE__ */ jsx(OrgHealthPulse, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/cross-space", element: /* @__PURE__ */ jsx(CrossSpaceIntelligence, {}) })
    ] }),
    /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(ClipadAdminLayout, {}), children: [
      /* @__PURE__ */ jsx(Route, { path: "/clipad/admin", element: /* @__PURE__ */ jsx(ClipadAdminOverview, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/admin/companies", element: /* @__PURE__ */ jsx(CompanyManagement, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/admin/pricing", element: /* @__PURE__ */ jsx(PricingTags, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/admin/audit", element: /* @__PURE__ */ jsx(AuditMonitor, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/clipad/admin/ai", element: /* @__PURE__ */ jsx(AdminAI, {}) })
    ] }),
    /* @__PURE__ */ jsx(Route, { path: "/v/courses", element: /* @__PURE__ */ jsx(VCourses, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/workshops", element: /* @__PURE__ */ jsx(VWorkshops, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/practical-modules", element: /* @__PURE__ */ jsx(VPracticalModules, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/trainee-profiles", element: /* @__PURE__ */ jsx(VTraineeProfiles, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/training-progress", element: /* @__PURE__ */ jsx(VTrainingProgress, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/workshop-assessments", element: /* @__PURE__ */ jsx(VWorkshopAssessments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/practical-exams", element: /* @__PURE__ */ jsx(VPracticalExams, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/skill-demonstrations", element: /* @__PURE__ */ jsx(VSkillDemonstrations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/competency-tracking", element: /* @__PURE__ */ jsx(VCompetencyTracking, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/equipment-inventory", element: /* @__PURE__ */ jsx(VEquipmentInventory, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/equipment-reservations", element: /* @__PURE__ */ jsx(VEquipmentReservations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/maintenance", element: /* @__PURE__ */ jsx(VMaintenance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/internship-tracking", element: /* @__PURE__ */ jsx(VInternshipTracking, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/industrial-attachments", element: /* @__PURE__ */ jsx(VIndustrialAttachments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/employer-evaluations", element: /* @__PURE__ */ jsx(VEmployerEvaluations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/certificates", element: /* @__PURE__ */ jsx(VCertificates, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/skill-badges", element: /* @__PURE__ */ jsx(VSkillBadges, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/qualification-tracking", element: /* @__PURE__ */ jsx(VQualificationTracking, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/job-opportunities", element: /* @__PURE__ */ jsx(VJobOpportunities, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/employers", element: /* @__PURE__ */ jsx(VEmployers, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/placement-reports", element: /* @__PURE__ */ jsx(VPlacementReports, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/certification-rates", element: /* @__PURE__ */ jsx(VCertificationRates, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/employment-rates", element: /* @__PURE__ */ jsx(VEmploymentRates, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/v/course-performance", element: /* @__PURE__ */ jsx(VCoursePerformance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/", element: /* @__PURE__ */ jsx(OnlineDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/learners", element: /* @__PURE__ */ jsx(OnlineLearners, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/courses", element: /* @__PURE__ */ jsx(OnlineCourses, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/sales", element: /* @__PURE__ */ jsx(OnlineSales, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/builder", element: /* @__PURE__ */ jsx(OnlineBuilder, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/builder/course/:courseId", element: /* @__PURE__ */ jsx(OnlineBuilder, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/builder/lesson/:courseId/:moduleId?", element: /* @__PURE__ */ jsx(LessonBuilder, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/builder/assessment/:courseId", element: /* @__PURE__ */ jsx(AssessmentBuilder, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/media", element: /* @__PURE__ */ jsx(MediaManager, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/learn/:courseId", element: /* @__PURE__ */ jsx(LearningPlayer, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/student-dashboard", element: /* @__PURE__ */ jsx(StudentDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/learner/:id", element: /* @__PURE__ */ jsx(LearnerProfile, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/notes", element: /* @__PURE__ */ jsx(NotesCenter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/assessments", element: /* @__PURE__ */ jsx(OnlineAssessments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/certificates", element: /* @__PURE__ */ jsx(OnlineCertificates, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/live", element: /* @__PURE__ */ jsx(OnlineLive, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/checkout/:courseId", element: /* @__PURE__ */ jsx(Checkout, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/subscriptions", element: /* @__PURE__ */ jsx(OnlineSubscriptions, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/affiliates", element: /* @__PURE__ */ jsx(OnlineAffiliates, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/corporate", element: /* @__PURE__ */ jsx(CorporateDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/community", element: /* @__PURE__ */ jsx(OnlineCommunity, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/o/ai", element: /* @__PURE__ */ jsx(OrbitAIAssistant, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/canteen-pos", element: /* @__PURE__ */ jsx(SchoolCanteenPOS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/complaints", element: /* @__PURE__ */ jsx(SchoolComplaints, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/support-center", element: /* @__PURE__ */ jsx(SchoolSupportCenter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/branch-manager", element: /* @__PURE__ */ jsx(TowerManager, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/campus-marketplace", element: /* @__PURE__ */ jsx(SchoolCampusMarketplace, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/institution-settings", element: /* @__PURE__ */ jsx(SchoolInstitutionSettings, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/patients", element: /* @__PURE__ */ jsx(HospitalPatients, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/appointments", element: /* @__PURE__ */ jsx(HospitalAppointments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/wards", element: /* @__PURE__ */ jsx(HospitalWards, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/prescriptions", element: /* @__PURE__ */ jsx(HospitalPrescriptions, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/lab-results", element: /* @__PURE__ */ jsx(HospitalLabResults, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy", element: /* @__PURE__ */ jsx(HospitalPharmacy, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/patient-portal", element: /* @__PURE__ */ jsx(HospitalPatientPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hospital-billing", element: /* @__PURE__ */ jsx(HospitalBilling, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hospital-claims", element: /* @__PURE__ */ jsx(HospitalClaims, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/telemedicine", element: /* @__PURE__ */ jsx(HospitalTelemedicine, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/operation-theater", element: /* @__PURE__ */ jsx(HospitalOperationTheater, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/radiology", element: /* @__PURE__ */ jsx(HospitalRadiology, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/ambulance-dispatch", element: /* @__PURE__ */ jsx(HospitalAmbulanceDispatch, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/referrals", element: /* @__PURE__ */ jsx(HospitalReferrals, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/blood-bank", element: /* @__PURE__ */ jsx(HospitalBloodBank, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/queue", element: /* @__PURE__ */ jsx(HospitalQueue, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/staff-roster", element: /* @__PURE__ */ jsx(HospitalStaffRoster, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/infection-control", element: /* @__PURE__ */ jsx(HospitalInfectionControl, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/front-desk", element: /* @__PURE__ */ jsx(HotelFrontDesk, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/reservations", element: /* @__PURE__ */ jsx(HotelReservations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/rooms", element: /* @__PURE__ */ jsx(HotelRooms, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/housekeeping", element: /* @__PURE__ */ jsx(HotelHousekeeping, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/restaurant", element: /* @__PURE__ */ jsx(HotelRestaurant, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/guest-requests", element: /* @__PURE__ */ jsx(HotelGuestRequests, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/guest-portal", element: /* @__PURE__ */ jsx(HotelGuestPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/revenue", element: /* @__PURE__ */ jsx(HotelRevenueManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/loyalty", element: /* @__PURE__ */ jsx(HotelLoyalty, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/guests", element: /* @__PURE__ */ jsx(HotelGuests, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy/dashboard", element: /* @__PURE__ */ jsx(PharmacyDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy/pos", element: /* @__PURE__ */ jsx(PharmacyPOS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy/prescriptions", element: /* @__PURE__ */ jsx(PharmacyPrescriptions, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy/customers", element: /* @__PURE__ */ jsx(PharmacyCustomers, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy/drugs", element: /* @__PURE__ */ jsx(PharmacyDrugs, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy/inventory", element: /* @__PURE__ */ jsx(PharmacyInventory, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy/claims", element: /* @__PURE__ */ jsx(PharmacyClaims, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pharmacy/reports", element: /* @__PURE__ */ jsx(PharmacyReports, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate", element: /* @__PURE__ */ jsx(SmartRealEstateDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/dashboard", element: /* @__PURE__ */ jsx(SmartRealEstateDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/land", element: /* @__PURE__ */ jsx(JCLLandManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/customer-timeline", element: /* @__PURE__ */ jsx(JCLCustomerTimeline, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/properties", element: /* @__PURE__ */ jsx(SmartPropertiesRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/clients", element: /* @__PURE__ */ jsx(SmartClientsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/leases", element: /* @__PURE__ */ jsx(SmartLeasesRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/viewings", element: /* @__PURE__ */ jsx(SmartViewingsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/transactions", element: /* @__PURE__ */ jsx(SmartTransactionsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/offers", element: /* @__PURE__ */ jsx(SmartOffersRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/commissions", element: /* @__PURE__ */ jsx(SmartCommissionsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/rent-payments", element: /* @__PURE__ */ jsx(SmartRentPaymentsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/maintenance", element: /* @__PURE__ */ jsx(SmartMaintenanceRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/crm-leads", element: /* @__PURE__ */ jsx(SmartLeadsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/agent-metrics", element: /* @__PURE__ */ jsx(RealEstateAgentMetrics, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/audit-log", element: /* @__PURE__ */ jsx(SmartAuditLogRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/commission-rules", element: /* @__PURE__ */ jsx(SmartCommissionRulesRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/comparable-properties", element: /* @__PURE__ */ jsx(RealEstateComparableProperties, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/contractor-reviews", element: /* @__PURE__ */ jsx(SmartContractorReviewsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/contractors", element: /* @__PURE__ */ jsx(SmartContractorsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/counter-offers", element: /* @__PURE__ */ jsx(SmartCounterOffersRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/document-templates", element: /* @__PURE__ */ jsx(SmartDocumentTemplatesRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/e-signatures", element: /* @__PURE__ */ jsx(SmartESignaturesRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/escrow-accounts", element: /* @__PURE__ */ jsx(SmartEscrowAccountsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/escrow", element: /* @__PURE__ */ jsx(SmartEscrowAccountsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/lease-renewals", element: /* @__PURE__ */ jsx(SmartLeaseRenewalsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/market-data", element: /* @__PURE__ */ jsx(RealEstateMarketData, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/market-intelligence", element: /* @__PURE__ */ jsx(RealEstateMarketIntelligence, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/payment-schedules", element: /* @__PURE__ */ jsx(SmartPaymentSchedulesRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/recommendations", element: /* @__PURE__ */ jsx(RealEstateRecommendations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/team-management", element: /* @__PURE__ */ jsx(RealEstateTeamManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/trust-accounting", element: /* @__PURE__ */ jsx(SmartTrustAccountingRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/real-estate/analytics", element: /* @__PURE__ */ jsx(SmartAnalyticsRouter, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/members", element: /* @__PURE__ */ jsx(Clients, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/groups", element: /* @__PURE__ */ jsx(ReligionGroups, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/events", element: /* @__PURE__ */ jsx(ReligionEvents, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/donations", element: /* @__PURE__ */ jsx(ReligionDonations, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/volunteers", element: /* @__PURE__ */ jsx(ReligionVolunteers, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/sermons", element: /* @__PURE__ */ jsx(ReligionSermons, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/small-groups", element: /* @__PURE__ */ jsx(ReligionSmallGroups, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/prayers", element: /* @__PURE__ */ jsx(ReligionPrayers, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/milestones", element: /* @__PURE__ */ jsx(ReligionMilestones, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/member-portal", element: /* @__PURE__ */ jsx(ReligionMemberPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/policies", element: /* @__PURE__ */ jsx(InsurancePolicies, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/claims", element: /* @__PURE__ */ jsx(InsuranceClaims, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/insurance-clients", element: /* @__PURE__ */ jsx(Clients, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/policyholder-portal", element: /* @__PURE__ */ jsx(InsurancePolicyholderPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/underwriting", element: /* @__PURE__ */ jsx(InsuranceUnderwriting, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/actuarial", element: /* @__PURE__ */ jsx(ActuarialDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/reinsurance", element: /* @__PURE__ */ jsx(Reinsurance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/agent-performance", element: /* @__PURE__ */ jsx(InsuranceAgentPerformance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/premiums", element: /* @__PURE__ */ jsx(InsurancePremiums, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/retail", element: /* @__PURE__ */ jsx(RetailDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/retail-dashboard", element: /* @__PURE__ */ jsx(RetailDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/products", element: /* @__PURE__ */ jsx(Products, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pos", element: /* @__PURE__ */ jsx(RetailPOS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/shifts", element: /* @__PURE__ */ jsx(Shifts, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/barcodes", element: /* @__PURE__ */ jsx(BarcodeManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/rmas", element: /* @__PURE__ */ jsx(RMAManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/store-builder", element: /* @__PURE__ */ jsx(OnlineStoreBuilder, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/b2b-portal", element: /* @__PURE__ */ jsx(B2BWholesalePortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/franchise-manager", element: /* @__PURE__ */ jsx(FranchiseManager, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/purchase-orders", element: /* @__PURE__ */ jsx(RetailPurchaseOrders, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/promotions", element: /* @__PURE__ */ jsx(RetailPromotions, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/retail-inventory", element: /* @__PURE__ */ jsx(RetailInventory, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/sales", element: /* @__PURE__ */ jsx(RetailSales, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/suppliers", element: /* @__PURE__ */ jsx(RetailSuppliers, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/retail-customers", element: /* @__PURE__ */ jsx(Clients, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/customer-portal", element: /* @__PURE__ */ jsx(RetailCustomerPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/smart-docs", element: /* @__PURE__ */ jsx(SmartDocs, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/load-board", element: /* @__PURE__ */ jsx(LoadBoard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/dispatch-board", element: /* @__PURE__ */ jsx(DispatchBoard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/warehouse", element: /* @__PURE__ */ jsx(Warehouse, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/ai-routes", element: /* @__PURE__ */ jsx(RouteOptimization, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/geofences", element: /* @__PURE__ */ jsx(GeofenceAlerts, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/shipments", element: /* @__PURE__ */ jsx(LogisticsShipments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/fleet", element: /* @__PURE__ */ jsx(LogisticsFleet, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/drivers", element: /* @__PURE__ */ jsx(LogisticsDrivers, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/tracking", element: /* @__PURE__ */ jsx(LogisticsTrackingPortal, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/warehouse", element: /* @__PURE__ */ jsx(LogisticsWarehouse, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/routes", element: /* @__PURE__ */ jsx(LogisticsRouteOptimization, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/proof-of-delivery", element: /* @__PURE__ */ jsx(LogisticsProofOfDelivery, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/incidents", element: /* @__PURE__ */ jsx(LogisticsIncidentManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/returns", element: /* @__PURE__ */ jsx(LogisticsReturnsManagement, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/logistics-analytics", element: /* @__PURE__ */ jsx(LogisticsAdvancedAnalytics, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/driver-mobile-app", element: /* @__PURE__ */ jsx(LogisticsDriverMobileApp, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/employees", element: /* @__PURE__ */ jsx(HREmployees, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/departments", element: /* @__PURE__ */ jsx(HRDepartments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/roles", element: /* @__PURE__ */ jsx(HRRoles, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/leave", element: /* @__PURE__ */ jsx(HRLeave, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/attendance", element: /* @__PURE__ */ jsx(HRAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/payroll", element: /* @__PURE__ */ jsx(HRPayroll, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/performance", element: /* @__PURE__ */ jsx(HRPerformance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/training", element: /* @__PURE__ */ jsx(HRTraining, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/recruitment", element: /* @__PURE__ */ jsx(HRRecruitment, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/complaints", element: /* @__PURE__ */ jsx(HRComplaints, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/promotions", element: /* @__PURE__ */ jsx(HRPromotions, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr/salary", element: /* @__PURE__ */ jsx(HRSalary, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/employees", element: /* @__PURE__ */ jsx(HREmployees, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/recruitment", element: /* @__PURE__ */ jsx(HRRecruitment, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/payroll", element: /* @__PURE__ */ jsx(HRPayroll, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/hr-leave", element: /* @__PURE__ */ jsx(HRLeave, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/products", element: /* @__PURE__ */ jsx(Products, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/org-chart", element: /* @__PURE__ */ jsx(GenericModulePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/disciplinary", element: /* @__PURE__ */ jsx(GenericModulePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/dispatch", element: /* @__PURE__ */ jsx(GenericModulePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/shifts", element: /* @__PURE__ */ jsx(Shifts, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/fleet", element: /* @__PURE__ */ jsx(GenericModulePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/pickups", element: /* @__PURE__ */ jsx(Pickups, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/training", element: /* @__PURE__ */ jsx(GenericModulePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(Login, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/signup", element: /* @__PURE__ */ jsx(SignUp, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/sso", element: /* @__PURE__ */ jsx(SSOGateway, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/auth/callback", element: /* @__PURE__ */ jsx(SSOCallback, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/auth/google-callback", element: /* @__PURE__ */ jsx(GoogleCallback, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/reset-password", element: /* @__PURE__ */ jsx(ResetPassword, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/loyalty", element: /* @__PURE__ */ jsx(Loyalty, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/orders", element: /* @__PURE__ */ jsx(Orders, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/time-tracking", element: /* @__PURE__ */ jsx(TimeTracking, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/", element: /* @__PURE__ */ jsx(SHSDashboard, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/students", element: /* @__PURE__ */ jsx(SHSStudents, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/student-profiles", element: /* @__PURE__ */ jsx(SHSStudentProfiles, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/promotion", element: /* @__PURE__ */ jsx(SHSStudentPromotion, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/transfers", element: /* @__PURE__ */ jsx(SHSStudentTransfers, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/discipline", element: /* @__PURE__ */ jsx(SHSDisciplineRecords, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/medical", element: /* @__PURE__ */ jsx(SHSMedicalRecords, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/admissions", element: /* @__PURE__ */ jsx(SHSAdmissions, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/applicant-review", element: /* @__PURE__ */ jsx(SHSApplicantReview, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/admission-decisions", element: /* @__PURE__ */ jsx(SHSAdmissionDecisions, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/enrollment", element: /* @__PURE__ */ jsx(SHSEnrollment, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/classes", element: /* @__PURE__ */ jsx(SHSClasses, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/programmes", element: /* @__PURE__ */ jsx(SHSProgrammes, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/houses", element: /* @__PURE__ */ jsx(SHSHouses, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/streams", element: /* @__PURE__ */ jsx(SHSStreams, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/subjects", element: /* @__PURE__ */ jsx(SHSSubjects, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/electives", element: /* @__PURE__ */ jsx(SHSElectives, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/academic-calendar", element: /* @__PURE__ */ jsx(SHSAcademicCalendar, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/timetable", element: /* @__PURE__ */ jsx(SHSTimetable, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/daily-attendance", element: /* @__PURE__ */ jsx(SHSDailyAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/class-attendance", element: /* @__PURE__ */ jsx(SHSClassAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/teacher-attendance", element: /* @__PURE__ */ jsx(SHSTeacherAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/attendance-reports", element: /* @__PURE__ */ jsx(SHSAttendanceReports, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/internal-exams", element: /* @__PURE__ */ jsx(SHSInternalExams, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/mock-exams", element: /* @__PURE__ */ jsx(SHSMockExams, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/assessment", element: /* @__PURE__ */ jsx(SHSContinuousAssessment, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/grades", element: /* @__PURE__ */ jsx(SHSGrades, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/results", element: /* @__PURE__ */ jsx(SHSResultsProcessing, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/report-cards", element: /* @__PURE__ */ jsx(SHSReportCards, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/dormitories", element: /* @__PURE__ */ jsx(SHSDormitories, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/room-allocation", element: /* @__PURE__ */ jsx(SHSRoomAllocation, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/house-masters", element: /* @__PURE__ */ jsx(SHSHouseMasters, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/boarding-attendance", element: /* @__PURE__ */ jsx(SHSBoardingAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/parent-progress", element: /* @__PURE__ */ jsx(SHSParentProgress, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/parent-attendance", element: /* @__PURE__ */ jsx(SHSParentAttendance, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/parent-fees", element: /* @__PURE__ */ jsx(SHSParentFees, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/parent-comms", element: /* @__PURE__ */ jsx(SHSParentComms, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/fees", element: /* @__PURE__ */ jsx(SHSFees, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/invoices", element: /* @__PURE__ */ jsx(SHSInvoices, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/payments", element: /* @__PURE__ */ jsx(SHSPayments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/scholarships", element: /* @__PURE__ */ jsx(SHSScholarships, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/financial-reports", element: /* @__PURE__ */ jsx(SHSFinancialReports, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/books", element: /* @__PURE__ */ jsx(SHSBooks, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/borrowing", element: /* @__PURE__ */ jsx(SHSBorrowing, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/returns", element: /* @__PURE__ */ jsx(SHSReturns, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/digital-resources", element: /* @__PURE__ */ jsx(SHSDigitalResources, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/buses", element: /* @__PURE__ */ jsx(SHSBuses, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/bus-routes", element: /* @__PURE__ */ jsx(SHSRoutes, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/bus-assignments", element: /* @__PURE__ */ jsx(SHSStudentAssignments, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/notices", element: /* @__PURE__ */ jsx(SHSNotices, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/sms", element: /* @__PURE__ */ jsx(SHSSMS, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/whatsapp", element: /* @__PURE__ */ jsx(SHSWhatsApp, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/email-comms", element: /* @__PURE__ */ jsx(SHSEmailComms, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/academic-analytics", element: /* @__PURE__ */ jsx(SHSAcademicAnalytics, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/attendance-analytics", element: /* @__PURE__ */ jsx(SHSAttendanceAnalytics, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/s/financial-analytics", element: /* @__PURE__ */ jsx(SHSFinancialAnalytics, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/slate/BOLT", element: /* @__PURE__ */ jsx(CreateModulePage, { isBoltOpen: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/slate/create", element: /* @__PURE__ */ jsx(CreateModulePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/slate/edit/:id", element: /* @__PURE__ */ jsx(CreateModulePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/marketplace", element: /* @__PURE__ */ jsx(Marketplace, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/m/*", element: /* @__PURE__ */ jsx(GenericModulePage, {}) })
  ] });
}
const AppPageSkeleton = () => /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-background p-4 sm:p-6 md:p-8 animate-pulse w-full min-h-screen", children: [
  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-8", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "h-8 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-2" }),
      /* @__PURE__ */ jsx("div", { className: "h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-10 bg-slate-200 dark:bg-slate-800 rounded w-32" })
  ] }),
  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [...Array(4)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/5 rounded-2xl h-32" }, i)) }),
  /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/5 rounded-2xl h-64 mb-8" })
] });
function GlobalSystemListener() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useEffect(() => {
    const handleSuccess = (e) => {
      queryClient.invalidateQueries();
    };
    const handleError = (e) => {
      toast({ title: "Action Failed", description: e.detail.error?.message || "An error occurred.", variant: "destructive" });
    };
    const handleHardError = (e) => {
      console.error("Cloud Sync Failed:", e.detail.errorMessage);
    };
    window.addEventListener("db:local-mutation-success", handleSuccess);
    window.addEventListener("db:local-mutation-error", handleError);
    window.addEventListener("sync:hard-error", handleHardError);
    return () => {
      window.removeEventListener("db:local-mutation-success", handleSuccess);
      window.removeEventListener("db:local-mutation-error", handleError);
      window.removeEventListener("sync:hard-error", handleHardError);
    };
  }, [queryClient, toast]);
  return null;
}
function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, user, authStep } = useAuth();
  if (isLoadingAuth || !authChecked) {
    return /* @__PURE__ */ jsx(PageLoader, { label: "" });
  }
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsx(Navigate, { to: `/login?continue=${encodeURIComponent(window.location.pathname + window.location.search)}`, replace: true });
  }
  if (user?.company_status === "suspended") {
    return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/50 dark:bg-background p-4 font-sans backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-white dark:bg-secondary rounded-3xl p-8 text-center border-[0.5px] border-black/9 dark:border-white/8 border-slate-100 dark:border-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-red-50 dark:bg-red-500/10/10 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight tracking-[-0.02em]", children: "Workspace Suspended" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-muted-foreground mb-8 leading-relaxed font-medium", children: "Your workspace access has been temporarily suspended by an administrator. Please contact support to resolve this issue." }),
      /* @__PURE__ */ jsx("button", { onClick: () => supabase.auth.signOut().then(() => window.location.href = "/login"), className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-all", children: "Return to Login" })
    ] }) });
  }
  const isAccountDomain = window.location.hostname.startsWith("account.") || window.location.hostname === "account.localhost";
  if (!user?.company_id && user?.role !== "super_admin" && !window.location.pathname.startsWith("/onboarding") && !isAccountDomain) {
    return /* @__PURE__ */ jsx(Navigate, { to: "/onboarding", replace: true });
  }
  if (user?.user_metadata?.force_password_reset && window.location.pathname !== "/force-reset-password") {
    return /* @__PURE__ */ jsx(Navigate, { to: "/force-reset-password", replace: true });
  }
  const PORTAL_ROLES = [
    "client",
    "patient",
    "student",
    "parent",
    "guardian",
    "tenant",
    "landlord",
    "owner",
    "guest",
    "member",
    "policyholder",
    "trainee",
    "learner",
    "employee",
    "portal_user"
  ];
  const isPortalUser = user?.role && PORTAL_ROLES.includes(user.role.toLowerCase());
  const isOnPortalRoute = window.location.pathname.startsWith("/portal");
  if (isPortalUser && !isOnPortalRoute) {
    return /* @__PURE__ */ jsx(Navigate, { to: "/portal", replace: true });
  }
  return /* @__PURE__ */ jsx(Outlet, {});
}
function SuperAdminRoute() {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return null;
  const role = user?.role || user?.user_metadata?.role;
  if (role !== "super_admin") {
    return /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true });
  }
  return /* @__PURE__ */ jsx(Outlet, {});
}
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
function CapacitorKeyboardFixer() {
  const location = useLocation();
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide().catch(() => {
      });
    }
  }, [location.pathname]);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => Keyboard.hide().catch(() => {
      }), 500);
      setTimeout(() => Keyboard.hide().catch(() => {
      }), 1500);
    }
  }, []);
  return null;
}
function App() {
  const { currentSubdomain } = getSubdomainAndBase();
  const isNativeApp = isDesktopApp();
  const isBaseDomain = currentSubdomain === null;
  const isMeetDomain = window.location.hostname.startsWith("clipad.");
  const isAccountDomain = window.location.hostname.startsWith("account.");
  useEffect(() => {
    initPowerSync().catch(console.error);
    if (isNativeApp) {
      CapacitorUpdater.notifyAppReady().catch(console.error);
    }
    if (window.location.hash && window.location.hash.includes("type=recovery")) {
      if (window.location.pathname !== "/reset-password") {
        window.location.href = `/reset-password${window.location.hash}`;
      }
    }
  }, [isNativeApp]);
  return /* @__PURE__ */ jsx(PowerSyncContext.Provider, { value: powerSync, children: /* @__PURE__ */ jsx(HelmetProvider, { children: /* @__PURE__ */ jsx(ImpersonationProvider, { children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(ThemeProvider, { children: /* @__PURE__ */ jsx(VideoProvider, { children: /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClientInstance, children: /* @__PURE__ */ jsxs(Router, { children: [
    /* @__PURE__ */ jsx(CapacitorKeyboardFixer, {}),
    /* @__PURE__ */ jsxs(SiteDomainResolver, { children: [
      /* @__PURE__ */ jsx(GlobalSystemListener, {}),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: isMeetDomain ? (
        /* â”€â”€ MEET DOMAIN: completely isolated Suspense â€” NO Slate loader â”€â”€ */
        /* @__PURE__ */ jsx(React.Suspense, { fallback: null, children: /* @__PURE__ */ jsxs(Routes, { children: [
          /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(MeetLandingPage, {}) }),
          /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(CliPadLogin, {}) }),
          /* @__PURE__ */ jsx(Route, { path: "/signup", element: /* @__PURE__ */ jsx(CliPadSignUp, {}) }),
          /* @__PURE__ */ jsx(Route, { path: "/auth/callback", element: /* @__PURE__ */ jsx(SSOCallback, {}) }),
          /* @__PURE__ */ jsx(Route, { path: "/auth/google-callback", element: /* @__PURE__ */ jsx(GoogleCallback, {}) }),
          /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(ClipadLayout, {}), children: [
            /* @__PURE__ */ jsx(Route, { path: "/join/:roomId", element: /* @__PURE__ */ jsx(StandaloneMeeting, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/watch/:videoId", element: /* @__PURE__ */ jsx(WatchVideo, {}) })
          ] }),
          /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(ClipadLayout, {}), children: [
            /* @__PURE__ */ jsx(Route, { path: "/dashboard", element: /* @__PURE__ */ jsx(CliPadDashboard, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/analytics", element: /* @__PURE__ */ jsx(AnalyticsPageRouter, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/enterprise", element: /* @__PURE__ */ jsx(CliPadEnterpriseDashboard, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/spaces", element: /* @__PURE__ */ jsx(SpacesList, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/spaces/:spaceId", element: /* @__PURE__ */ jsx(SpaceDashboard, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/health", element: /* @__PURE__ */ jsx(KnowledgeHealth, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/timeline", element: /* @__PURE__ */ jsx(KnowledgeTimeline, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/decisions", element: /* @__PURE__ */ jsx(DecisionLedger, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/decisions/:decisionId/replay", element: /* @__PURE__ */ jsx(DecisionReplay, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/knowledge-graph", element: /* @__PURE__ */ jsx(KnowledgeGraph, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/action-items", element: /* @__PURE__ */ jsx(ActionItems, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/journey", element: /* @__PURE__ */ jsx(KnowledgeJourney, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/integration-analytics", element: /* @__PURE__ */ jsx(IntegrationAnalytics, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/record", element: /* @__PURE__ */ jsx(RecordVideo, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/record/:id", element: /* @__PURE__ */ jsx(RecordVideo, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/meetings", element: /* @__PURE__ */ jsx(MeetingsList, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/videos", element: /* @__PURE__ */ jsx(VideosList, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/meetings/:meetingId", element: /* @__PURE__ */ jsx(MeetingRecord, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/save-meeting/:id", element: /* @__PURE__ */ jsx(SaveMeetingPage, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/settings", element: /* @__PURE__ */ jsx(CliPadSettings, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/integrations", element: /* @__PURE__ */ jsx(IntegrationsHub, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/search", element: /* @__PURE__ */ jsx(SearchHub, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/support", element: /* @__PURE__ */ jsx(CliPadSupport, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/chat", element: /* @__PURE__ */ jsx(ClipadChat, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/chat/:roomId", element: /* @__PURE__ */ jsx(ClipadChat, {}) }),
            /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(SuperAdminRoute, {}), children: [
              /* @__PURE__ */ jsx(Route, { path: "/commitments", element: /* @__PURE__ */ jsx(CommitmentIntelligence, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/risk", element: /* @__PURE__ */ jsx(PredictiveRisk, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/pulse", element: /* @__PURE__ */ jsx(OrgHealthPulse, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/cross-space", element: /* @__PURE__ */ jsx(CrossSpaceIntelligence, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/admin", element: /* @__PURE__ */ jsx(SuperAdminDashboard, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/admin/firms", element: /* @__PURE__ */ jsx(AdminFirms, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/admin/users", element: /* @__PURE__ */ jsx(AdminUsers, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/admin/pricing", element: /* @__PURE__ */ jsx(SuperAdminBilling, { title: "Pricing Engine" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) })
        ] }) })
      ) : isAccountDomain ? (
        /* ── ACCOUNT DOMAIN: Global Identity Portal ── */
        /* @__PURE__ */ jsx(React.Suspense, { fallback: /* @__PURE__ */ jsx(AppPageSkeleton, {}), children: /* @__PURE__ */ jsxs(Routes, { children: [
          /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(AccountLogin, {}) }),
          /* @__PURE__ */ jsx(Route, { path: "/signup", element: /* @__PURE__ */ jsx(AccountSignUp, {}) }),
          /* @__PURE__ */ jsx(Route, { path: "/sso", element: /* @__PURE__ */ jsx(SSOGateway, {}) }),
          /* @__PURE__ */ jsx(Route, { path: "/auth/callback", element: /* @__PURE__ */ jsx(SSOCallback, {}) }),
          /* @__PURE__ */ jsx(Route, { path: "/auth/google-callback", element: /* @__PURE__ */ jsx(GoogleCallback, {}) }),
          /* @__PURE__ */ jsx(Route, { element: /* @__PURE__ */ jsx(ProtectedRoute, {}), children: /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(AccountPortalLayout, {}), children: [
            /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(AccountPortal, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/security", element: /* @__PURE__ */ jsx(AccountSecurity, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/personal-info", element: /* @__PURE__ */ jsx(AccountPersonalInfo, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/subscriptions", element: /* @__PURE__ */ jsx(AccountPayments, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/devices", element: /* @__PURE__ */ jsx(AccountDevices, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/help", element: /* @__PURE__ */ jsx(AccountHelp, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/docs", element: /* @__PURE__ */ jsx(AccountDocs, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/tutorials", element: /* @__PURE__ */ jsx(AccountTutorials, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/admin", element: /* @__PURE__ */ jsx(SuperAdminDashboard, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/admin/firms", element: /* @__PURE__ */ jsx(AdminFirms, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/admin/users", element: /* @__PURE__ */ jsx(AdminUsers, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) })
          ] }) })
        ] }) })
      ) : (
        /* ── ALL OTHER DOMAINS: workspace / marketing / app routes ── */
        /* @__PURE__ */ jsx(React.Suspense, { fallback: /* @__PURE__ */ jsx(AppPageSkeleton, {}), children: isBaseDomain ? (
          /* Storefront Routes for the Base Domain */
          /* @__PURE__ */ jsxs(Routes, { children: [
            /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(MarketingLayout, { children: /* @__PURE__ */ jsx(Outlet, {}) }), children: [
              /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(Home, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/features", element: /* @__PURE__ */ jsx(Features, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/pricing", element: /* @__PURE__ */ jsx(Pricing, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/about", element: /* @__PURE__ */ jsx(About, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/contact", element: /* @__PURE__ */ jsx(Contact, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/enterprise-contact", element: /* @__PURE__ */ jsx(EnterpriseContact, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/integrations", element: /* @__PURE__ */ jsx(Integrations, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/changelog", element: /* @__PURE__ */ jsx(Changelog, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/customers", element: /* @__PURE__ */ jsx(Customers, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/security", element: /* @__PURE__ */ jsx(Security, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/solutions", element: /* @__PURE__ */ jsx(Solutions, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/roi-calculator", element: /* @__PURE__ */ jsx(RoiCalculator, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/partners", element: /* @__PURE__ */ jsx(Partners, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/legal", element: /* @__PURE__ */ jsx(LegalDocs, {}) })
            ] }),
            /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(Login, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/signup", element: /* @__PURE__ */ jsx(SignUp, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/sso", element: /* @__PURE__ */ jsx(SSOGateway, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/auth/callback", element: /* @__PURE__ */ jsx(SSOCallback, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/auth/google-callback", element: /* @__PURE__ */ jsx(GoogleCallback, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/welcome", element: /* @__PURE__ */ jsx(NativeOnboarding, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/forgot-password", element: /* @__PURE__ */ jsx(ForgotPassword, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/reset-password", element: /* @__PURE__ */ jsx(ResetPassword, {}) }),
            /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(ProtectedRoute, {}), children: [
              /* @__PURE__ */ jsx(Route, { path: "/force-reset-password", element: /* @__PURE__ */ jsx(ForceResetPassword, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/onboarding", element: /* @__PURE__ */ jsx(OnboardingWizard, {}) }),
              /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(AppLayout, {}), children: [
                /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(SuperAdminRoute, {}), children: [
                  /* @__PURE__ */ jsx(Route, { path: "/admin", element: /* @__PURE__ */ jsx(AdminOverview, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/intelligence", element: /* @__PURE__ */ jsx(AdminIntelligence, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/rollout", element: /* @__PURE__ */ jsx(AdminRollout, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/quotas", element: /* @__PURE__ */ jsx(AdminQuotas, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/firms", element: /* @__PURE__ */ jsx(AdminFirms, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/users", element: /* @__PURE__ */ jsx(AdminUsers, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/billing", element: /* @__PURE__ */ jsx(AdminBilling, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/pricing", element: /* @__PURE__ */ jsx(SuperAdminBilling, { title: "Pricing Engine" }) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/security", element: /* @__PURE__ */ jsx(AdminSecurity, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/broadcasts", element: /* @__PURE__ */ jsx(AdminBroadcasts, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/enterprise-requests", element: /* @__PURE__ */ jsx(AdminEnterpriseRequests, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/partners", element: /* @__PURE__ */ jsx(AdminPartners, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/feature-insider", element: /* @__PURE__ */ jsx(AdminFeatureInsider, {}) })
                ] }),
                PlatformRoutes()
              ] })
            ] }),
            /* @__PURE__ */ jsx(Route, { path: "/intake", element: /* @__PURE__ */ jsx(IntakeForm, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(PageNotFound, {}) })
          ] })
        ) : (
          /* App Routes for Subdomains */
          /* @__PURE__ */ jsxs(Routes, { children: [
            /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(Login, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/signup", element: /* @__PURE__ */ jsx(SignUp, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/sso", element: /* @__PURE__ */ jsx(SSOGateway, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/auth/callback", element: /* @__PURE__ */ jsx(SSOCallback, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/auth/google-callback", element: /* @__PURE__ */ jsx(GoogleCallback, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/welcome", element: /* @__PURE__ */ jsx(NativeOnboarding, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/forgot-password", element: /* @__PURE__ */ jsx(ForgotPassword, {}) }),
            /* @__PURE__ */ jsx(Route, { path: "/reset-password", element: /* @__PURE__ */ jsx(ResetPassword, {}) }),
            /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(ProtectedRoute, {}), children: [
              /* @__PURE__ */ jsx(Route, { path: "/force-reset-password", element: /* @__PURE__ */ jsx(ForceResetPassword, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "/onboarding", element: /* @__PURE__ */ jsx(OnboardingWizard, {}) }),
              /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(AppLayout, {}), children: [
                /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(SuperAdminRoute, {}), children: [
                  /* @__PURE__ */ jsx(Route, { path: "/admin", element: /* @__PURE__ */ jsx(AdminOverview, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/intelligence", element: /* @__PURE__ */ jsx(AdminIntelligence, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/rollout", element: /* @__PURE__ */ jsx(AdminRollout, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/quotas", element: /* @__PURE__ */ jsx(AdminQuotas, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/firms", element: /* @__PURE__ */ jsx(AdminFirms, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/users", element: /* @__PURE__ */ jsx(AdminUsers, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/billing", element: /* @__PURE__ */ jsx(AdminBilling, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/pricing", element: /* @__PURE__ */ jsx(SuperAdminBilling, { title: "Pricing Engine" }) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/security", element: /* @__PURE__ */ jsx(AdminSecurity, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/broadcasts", element: /* @__PURE__ */ jsx(AdminBroadcasts, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/enterprise-requests", element: /* @__PURE__ */ jsx(AdminEnterpriseRequests, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/partners", element: /* @__PURE__ */ jsx(AdminPartners, {}) }),
                  /* @__PURE__ */ jsx(Route, { path: "/admin/feature-insider", element: /* @__PURE__ */ jsx(AdminFeatureInsider, {}) })
                ] }),
                /* @__PURE__ */ jsx(Route, { path: "/enterprise-admin", element: /* @__PURE__ */ jsx(EnterpriseDashboard, {}) }),
                /* @__PURE__ */ jsx(Route, { path: "/feature-insider", element: /* @__PURE__ */ jsx(FeatureLab, {}) }),
                /* @__PURE__ */ jsx(Route, { path: "/feature-vault", element: /* @__PURE__ */ jsx(FeatureVault, {}) }),
                PlatformRoutes()
              ] }),
              /* @__PURE__ */ jsx(Route, { path: "/intake", element: /* @__PURE__ */ jsx(IntakeForm, {}) }),
              /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(PageNotFound, {}) })
            ] })
          ] })
        ) })
      ) })
    ] }),
    /* @__PURE__ */ jsx(Toaster, {}),
    /* @__PURE__ */ jsx(SonnerToaster, {}),
    /* @__PURE__ */ jsx(HotToaster, { position: "top-right" })
  ] }) }) }) }) }) }) }) });
}
export default App;
