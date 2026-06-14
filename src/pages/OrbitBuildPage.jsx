import { supabase} from '@/api/supabaseClient';
import React from 'react';
import { useParams} from 'react-router-dom';
import { useQuery} from '@tanstack/react-query';
import { powerSync} from "@/api/PowerSyncConnector";
import { useCompanyId} from '@/hooks/useCompanyId';
import { Loader2} from 'lucide-react';

// Lazy-load universal components to prevent bloat
const DynamicTable = React.lazy(() => import("@/components/ui/DynamicTable"));
const DynamicDashboard = React.lazy(() => import("@/components/ui/DynamicDashboard"));
const DynamicKanbanView = React.lazy(() => import("@/components/ui/DynamicKanbanView"));
const DynamicCalendarView = React.lazy(() => import("@/components/ui/DynamicCalendarView"));
const DynamicDirectoryView = React.lazy(() => import("@/components/ui/DynamicDirectoryView"));
const DynamicFormWizard = React.lazy(() => import("@/components/ui/DynamicFormWizard"));

// New Universal Components
const UnivCRM = React.lazy(() => import("@/components/universal/UnivCRM"));
const UnivInvoice = React.lazy(() => import("@/components/universal/UnivInvoice"));
const UnivAppointments = React.lazy(() => import("@/components/universal/UnivAppointments"));
const UnivInventory = React.lazy(() => import("@/components/universal/UnivInventory"));
const UnivHREmployee = React.lazy(() => import("@/components/universal/UnivHREmployee"));

// Phase 2 Universal Components
const UnivKnowledgeBase = React.lazy(() => import("@/components/universal/UnivKnowledgeBase"));
const UnivClientPortal = React.lazy(() => import("@/components/universal/UnivClientPortal"));
const UnivCommandPalette = React.lazy(() => import("@/components/universal/UnivCommandPalette"));
const UnivGlobalSearch = React.lazy(() => import("@/components/universal/UnivGlobalSearch"));
const UnivChat = React.lazy(() => import("@/components/universal/UnivChat"));

// Phase 3 Universal Components
const UnivBooking = React.lazy(() => import("@/components/universal/UnivBooking"));
const UnivSOP = React.lazy(() => import("@/components/universal/UnivSOP"));

// Phase 4 Universal Components
const UnivBudgeting = React.lazy(() => import("@/components/universal/UnivBudgeting"));
const UnivRiskManagement = React.lazy(() => import("@/components/universal/UnivRiskManagement"));
const UnivVendorManagement = React.lazy(() => import("@/components/universal/UnivVendorManagement"));
const UnivCompliance = React.lazy(() => import("@/components/universal/UnivCompliance"));
const UnivAuditLog = React.lazy(() => import("@/components/universal/UnivAuditLog"));

// Phase 5 Universal Components
const UnivGoalTracker = React.lazy(() => import("@/components/universal/UnivGoalTracker"));
const UnivTimeTracking = React.lazy(() => import("@/components/universal/UnivTimeTracking"));
const UnivResourceAllocation = React.lazy(() => import("@/components/universal/UnivResourceAllocation"));
const UnivSurvey = React.lazy(() => import("@/components/universal/UnivSurvey"));
const UnivEventManagement = React.lazy(() => import("@/components/universal/UnivEventManagement"));

// Billing Components
const UnivBilling = React.lazy(() => import("@/components/universal/UnivBilling"));
const SuperAdminBilling = React.lazy(() => import("@/components/orbitbolt/SuperAdminBilling"));

const UnivDataGrid = React.lazy(() => import("@/components/universal/UnivDataGrid"));
const UnivKanban = React.lazy(() => import("@/components/universal/UnivKanban"));
const UnivCalendar = React.lazy(() => import("@/components/universal/UnivCalendar"));
const UnivDashboard = React.lazy(() => import("@/components/universal/UnivDashboard"));
const UnivAnalytics = React.lazy(() => import("@/components/universal/UnivAnalytics"));
const UnivForm = React.lazy(() => import("@/components/universal/UnivForm"));
const UnivSearch = React.lazy(() => import("@/components/universal/UnivSearch"));

// Phase 3 Universal Components
const UnivTimeline = React.lazy(() => import("@/components/universal/UnivTimeline"));
const UnivDocument = React.lazy(() => import("@/components/universal/UnivDocument"));
const UnivMessaging = React.lazy(() => import("@/components/universal/UnivMessaging"));
const UnivNotification = React.lazy(() => import("@/components/universal/UnivNotification"));

// Phase 4 Universal Components
const UnivContactManagement = React.lazy(() => import("@/components/universal/UnivContactManagement"));
const UnivPayment = React.lazy(() => import("@/components/universal/UnivPayment"));
const UnivSubscription = React.lazy(() => import("@/components/universal/UnivSubscription"));
const UnivAssetManagement = React.lazy(() => import("@/components/universal/UnivAssetManagement"));
const UnivProcurement = React.lazy(() => import("@/components/universal/UnivProcurement"));
const UnivPOS = React.lazy(() => import("@/components/universal/UnivPOS"));
const UnivAttendance = React.lazy(() => import("@/components/universal/UnivAttendance"));
const UnivPayroll = React.lazy(() => import("@/components/universal/UnivPayroll"));
const UnivRecruitment = React.lazy(() => import("@/components/universal/UnivRecruitment"));
const UnivLeaveManagement = React.lazy(() => import("@/components/universal/UnivLeaveManagement"));

// Phase 5 Universal Components (Education Suite)
const UnivStudent = React.lazy(() => import("@/components/universal/UnivStudent"));
const UnivFaculty = React.lazy(() => import("@/components/universal/UnivFaculty"));
const UnivCourse = React.lazy(() => import("@/components/universal/UnivCourse"));
const UnivGradebook = React.lazy(() => import("@/components/universal/UnivGradebook"));
const UnivClassAttendance = React.lazy(() => import("@/components/universal/UnivClassAttendance"));
const UnivLMS = React.lazy(() => import("@/components/universal/UnivLMS"));
const UnivParentPortal = React.lazy(() => import("@/components/universal/UnivParentPortal"));

// Phase 6 Universal Components (Healthcare Suite)
const UnivPatient = React.lazy(() => import("@/components/universal/UnivPatient"));
const UnivEMR = React.lazy(() => import("@/components/universal/UnivEMR"));
const UnivPrescription = React.lazy(() => import("@/components/universal/UnivPrescription"));
const UnivLab = React.lazy(() => import("@/components/universal/UnivLab"));
const UnivWard = React.lazy(() => import("@/components/universal/UnivWard"));
const UnivTelemedicine = React.lazy(() => import("@/components/universal/UnivTelemedicine"));

// Phase 7 Universal Components (Hospitality Suite)
const UnivRoom = React.lazy(() => import("@/components/universal/UnivRoom"));
const UnivHousekeeping = React.lazy(() => import("@/components/universal/UnivHousekeeping"));
const UnivMenu = React.lazy(() => import("@/components/universal/UnivMenu"));
const UnivDining = React.lazy(() => import("@/components/universal/UnivDining"));

// Phase 8 Universal Components (Logistics & Construction Suites)
const UnivFleet = React.lazy(() => import("@/components/universal/UnivFleet"));
const UnivDispatch = React.lazy(() => import("@/components/universal/UnivDispatch"));
const UnivRoute = React.lazy(() => import("@/components/universal/UnivRoute"));
const UnivDelivery = React.lazy(() => import("@/components/universal/UnivDelivery"));
const UnivWarehouse = React.lazy(() => import("@/components/universal/UnivWarehouse"));
const UnivProject = React.lazy(() => import("@/components/universal/UnivProject"));
const UnivBOQ = React.lazy(() => import("@/components/universal/UnivBOQ"));
const UnivSiteInspection = React.lazy(() => import("@/components/universal/UnivSiteInspection"));
const UnivSafety = React.lazy(() => import("@/components/universal/UnivSafety"));
const UnivContractor = React.lazy(() => import("@/components/universal/UnivContractor"));

// Phase 9 Universal Components (Legal & Manufacturing Suites)
const UnivCaseManagement = React.lazy(() => import("@/components/universal/UnivCaseManagement"));
const UnivLegalDocument = React.lazy(() => import("@/components/universal/UnivLegalDocument"));
const UnivCourtCalendar = React.lazy(() => import("@/components/universal/UnivCourtCalendar"));
const UnivProduction = React.lazy(() => import("@/components/universal/UnivProduction"));
const UnivBOM = React.lazy(() => import("@/components/universal/UnivBOM"));
const UnivMachine = React.lazy(() => import("@/components/universal/UnivMachine"));
const UnivQualityControl = React.lazy(() => import("@/components/universal/UnivQualityControl"));

// Phase 10 Universal Components (Legal Services Suite)
const UnivConsultation = React.lazy(() => import("@/components/universal/UnivConsultation"));
const UnivRetainer = React.lazy(() => import("@/components/universal/UnivRetainer"));
const UnivEscrow = React.lazy(() => import("@/components/universal/UnivEscrow"));
const UnivTimebilling = React.lazy(() => import("@/components/universal/UnivTimebilling"));
const UnivConflictcheck = React.lazy(() => import("@/components/universal/UnivConflictcheck"));
const UnivArbitration = React.lazy(() => import("@/components/universal/UnivArbitration"));
const UnivTrademark = React.lazy(() => import("@/components/universal/UnivTrademark"));
const UnivClientledger = React.lazy(() => import("@/components/universal/UnivClientledger"));
const UnivExpertwitness = React.lazy(() => import("@/components/universal/UnivExpertwitness"));
const UnivBriefs = React.lazy(() => import("@/components/universal/UnivBriefs"));

// Phase 10 Universal Components (Property Management Suite)
const UnivProperty = React.lazy(() => import("@/components/universal/UnivProperty"));
const UnivTenant = React.lazy(() => import("@/components/universal/UnivTenant"));
const UnivLease = React.lazy(() => import("@/components/universal/UnivLease"));
const UnivMaintenancerequest = React.lazy(() => import("@/components/universal/UnivMaintenancerequest"));
const UnivPropertyinspection = React.lazy(() => import("@/components/universal/UnivPropertyinspection"));
const UnivListing = React.lazy(() => import("@/components/universal/UnivListing"));
const UnivAgentcommission = React.lazy(() => import("@/components/universal/UnivAgentcommission"));
const UnivHoa = React.lazy(() => import("@/components/universal/UnivHoa"));
const UnivUtilitybill = React.lazy(() => import("@/components/universal/UnivUtilitybill"));

// Phase 11 Universal Components (Retail & E-commerce Suite)
const UnivProductCatalog = React.lazy(() => import("@/components/universal/UnivProductCatalog"));
const UnivOrderRegistry = React.lazy(() => import("@/components/universal/UnivOrderRegistry"));
const UnivDiscount = React.lazy(() => import("@/components/universal/UnivDiscount"));
const UnivCustomerReview = React.lazy(() => import("@/components/universal/UnivCustomerReview"));
const UnivSupplierDirectory = React.lazy(() => import("@/components/universal/UnivSupplierDirectory"));
const UnivReturnRefund = React.lazy(() => import("@/components/universal/UnivReturnRefund"));
const UnivGiftCard = React.lazy(() => import("@/components/universal/UnivGiftCard"));
const UnivWishlist = React.lazy(() => import("@/components/universal/UnivWishlist"));
const UnivLoyaltyPoint = React.lazy(() => import("@/components/universal/UnivLoyaltyPoint"));

// Phase 11 Universal Components (Finance & Accounting Suite)
const UnivGeneralLedger = React.lazy(() => import("@/components/universal/UnivGeneralLedger"));
const UnivExpenseReport = React.lazy(() => import("@/components/universal/UnivExpenseReport"));
const UnivTaxFiling = React.lazy(() => import("@/components/universal/UnivTaxFiling"));
const UnivAuditTrail = React.lazy(() => import("@/components/universal/UnivAuditTrail"));

// Phase 11 Universal Components (Events, Travel & Hospitality)
const UnivEventPlanner = React.lazy(() => import("@/components/universal/UnivEventPlanner"));
const UnivTicketSales = React.lazy(() => import("@/components/universal/UnivTicketSales"));
const UnivCarRental = React.lazy(() => import("@/components/universal/UnivCarRental"));
const UnivTourPackage = React.lazy(() => import("@/components/universal/UnivTourPackage"));
const UnivLuggageClaim = React.lazy(() => import("@/components/universal/UnivLuggageClaim"));
const UnivFeedbackSurvey = React.lazy(() => import("@/components/universal/UnivFeedbackSurvey"));
const UnivTableReservation = React.lazy(() => import("@/components/universal/UnivTableReservation"));
const UnivHotelReview = React.lazy(() => import("@/components/universal/UnivHotelReview"));

// Phase 11 Universal Components (Logistics & Warehousing Extended)
const UnivPalletTracker = React.lazy(() => import("@/components/universal/UnivPalletTracker"));

// Phase 12 Universal Components (Nonprofit & HR Extended)
const UnivDonorProfile = React.lazy(() => import("@/components/universal/UnivDonorProfile"));
const UnivDonationLog = React.lazy(() => import("@/components/universal/UnivDonationLog"));
const UnivVolunteerRoster = React.lazy(() => import("@/components/universal/UnivVolunteerRoster"));
const UnivCampaignMetric = React.lazy(() => import("@/components/universal/UnivCampaignMetric"));
const UnivBeneficiaryList = React.lazy(() => import("@/components/universal/UnivBeneficiaryList"));
const UnivPledge = React.lazy(() => import("@/components/universal/UnivPledge"));
const UnivSponsorship = React.lazy(() => import("@/components/universal/UnivSponsorship"));
const UnivAdvocacy = React.lazy(() => import("@/components/universal/UnivAdvocacy"));
const UnivInKindDonation = React.lazy(() => import("@/components/universal/UnivInKindDonation"));
const UnivExpenseClaim = React.lazy(() => import("@/components/universal/UnivExpenseClaim"));
const UnivTimeSheet = React.lazy(() => import("@/components/universal/UnivTimeSheet"));
const UnivOrgChart = React.lazy(() => import("@/components/universal/UnivOrgChart"));
const UnivDisciplinary = React.lazy(() => import("@/components/universal/UnivDisciplinary"));
const UnivOnboardingTask = React.lazy(() => import("@/components/universal/UnivOnboardingTask"));
const UnivExitInterview = React.lazy(() => import("@/components/universal/UnivExitInterview"));
const UnivBenefitElection = React.lazy(() => import("@/components/universal/UnivBenefitElection"));

// Phase 12 Universal Components (Marketing Suite)
const UnivCommissionStructure = React.lazy(() => import("@/components/universal/UnivCommissionStructure"));
const UnivCampaignSchedule = React.lazy(() => import("@/components/universal/UnivCampaignSchedule"));
const UnivAdSpend = React.lazy(() => import("@/components/universal/UnivAdSpend"));
const UnivNewsletter = React.lazy(() => import("@/components/universal/UnivNewsletter"));
const UnivCompetitorPrice = React.lazy(() => import("@/components/universal/UnivCompetitorPrice"));
const UnivLeadMagnet = React.lazy(() => import("@/components/universal/UnivLeadMagnet"));

// Phase 12 Universal Components (Customer Success & IT)
const UnivSupportTicket = React.lazy(() => import("@/components/universal/UnivSupportTicket"));
const UnivKbArticle = React.lazy(() => import("@/components/universal/UnivKbArticle"));
const UnivSlaAgreement = React.lazy(() => import("@/components/universal/UnivSlaAgreement"));
const UnivChurnRisk = React.lazy(() => import("@/components/universal/UnivChurnRisk"));
const UnivFeatureRequest = React.lazy(() => import("@/components/universal/UnivFeatureRequest"));
const UnivChatTranscript = React.lazy(() => import("@/components/universal/UnivChatTranscript"));
const UnivCustomerJourney = React.lazy(() => import("@/components/universal/UnivCustomerJourney"));
const UnivCallLog = React.lazy(() => import("@/components/universal/UnivCallLog"));
const UnivIncidentReport = React.lazy(() => import("@/components/universal/UnivIncidentReport"));
const UnivServerMetric = React.lazy(() => import("@/components/universal/UnivServerMetric"));
const UnivIpAddress = React.lazy(() => import("@/components/universal/UnivIpAddress"));
const UnivAccessControl = React.lazy(() => import("@/components/universal/UnivAccessControl"));
const UnivSslCertificate = React.lazy(() => import("@/components/universal/UnivSslCertificate"));
const UnivGdprRequest = React.lazy(() => import("@/components/universal/UnivGdprRequest"));
const UnivSoftwareLicense = React.lazy(() => import("@/components/universal/UnivSoftwareLicense"));
const UnivVulnerability = React.lazy(() => import("@/components/universal/UnivVulnerability"));
const UnivDataBackup = React.lazy(() => import("@/components/universal/UnivDataBackup"));

// Phase 13 Final 15 Components (Reaching 200 Total)
const UnivRiskRegister = React.lazy(() => import("@/components/universal/UnivRiskRegister"));
const UnivContractManagement = React.lazy(() => import("@/components/universal/UnivContractManagement"));
const UnivMeetingMinutes = React.lazy(() => import("@/components/universal/UnivMeetingMinutes"));
const UnivKpiTracker = React.lazy(() => import("@/components/universal/UnivKpiTracker"));
const UnivBudgetForecast = React.lazy(() => import("@/components/universal/UnivBudgetForecast"));
const UnivChangeRequest = React.lazy(() => import("@/components/universal/UnivChangeRequest"));
const UnivProjectMilestone = React.lazy(() => import("@/components/universal/UnivProjectMilestone"));
const UnivEmployeePerformance = React.lazy(() => import("@/components/universal/UnivEmployeePerformance"));
const UnivTrainingRecord = React.lazy(() => import("@/components/universal/UnivTrainingRecord"));
const UnivHealthSafety = React.lazy(() => import("@/components/universal/UnivHealthSafety"));
const UnivSalesTarget = React.lazy(() => import("@/components/universal/UnivSalesTarget"));
const UnivProductionSchedule = React.lazy(() => import("@/components/universal/UnivProductionSchedule"));
const UnivCustomerSegment = React.lazy(() => import("@/components/universal/UnivCustomerSegment"));
const UnivDigitalAsset = React.lazy(() => import("@/components/universal/UnivDigitalAsset"));
const UnivApiIntegration = React.lazy(() => import("@/components/universal/UnivApiIntegration"));
const UnivWorkflowBuilder = React.lazy(() => import("@/components/universal/UnivWorkflowBuilder"));
const UnivApprovalEngine = React.lazy(() => import("@/components/universal/UnivApprovalEngine"));

// Basic dummy data generator for these components since they might not be hooked to real tables yet if they are purely UI templates in OrbitBuild
const DUMMY_DATA = Array(5).fill(0).map((_, i) => ({
 id: `id-${i}`,
 data: {
 name: `Sample Record ${i + 1}`,
 status: i % 2 === 0 ? 'Active' : 'Pending',
 date: new Date().toISOString().split('T')[0]
}
}));

const DUMMY_FIELDS = [
 { name: 'name', field_type: 'text', order_index: 0},
 { name: 'status', field_type: 'select', order_index: 1},
 { name: 'date', field_type: 'date', order_index: 2}
];

import { useQueryClient} from '@tanstack/react-query';
import { 
 Layout, 
 Table, 
 Kanban as KanbanIcon, 
 Calendar as CalendarIcon, 
 Clock, 
 Image as GalleryIcon, 
 BarChart3, 
 FileText as FormIcon,
 Search,
 Plus
} from 'lucide-react';
import { toast} from 'react-hot-toast';

// Dynamic Gallery View component for visual card representation
function DynamicGalleryView({ companyId, pageDef, cleanId, tableName}) {
 const [records, setRecords] = React.useState([]);
 const [loading, setLoading] = React.useState(true);
 const [search, setSearch] = React.useState('');

 React.useEffect(() => {
 const fetchRecords = async () => {
 setLoading(true);
 try {
 const { data, error} = await supabase
 .from(tableName)
 .select('*')
 .eq('company_id', companyId);
 
 if (error && error.code !== '42P01') throw error;
 setRecords(data || []);
} catch (err) {
 console.error("Failed to load gallery data:", err);
} finally {
 setLoading(false);
}
};
 if (companyId) fetchRecords();
}, [companyId, tableName]);

 const filtered = records.filter(r => 
 Object.values(r).some(val => 
 String(val).toLowerCase().includes(search.toLowerCase())
 )
 );

 if (loading) {
 return <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
}

 return (
 <div className="flex flex-col gap-4 w-full">
 <div className="flex justify-between items-center gap-4 shrink-0">
 <div className="relative flex-1 max-w-md">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search gallery..." 
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full h-10 pl-9 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"
 />
 </div>
 </div>

 {filtered.length === 0 ? (
 <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-card/50">
 <GalleryIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
 <p className="font-medium">No items found in visual gallery.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {filtered.map((item) => (
 <div key={item.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between min-h-[160px]">
 <div>
 <div className="flex justify-between items-start mb-2">
 <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
 {item.status || item.type || item.category || 'Record'}
 </span>
 </div>
 <h4 className="font-bold text-foreground text-base line-clamp-1">
 {item.name || item.title || item.employee_name || item.client_name || item.room_number || item.id.slice(0, 8)}
 </h4>
 <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
 {item.description || item.notes || item.reason || item.amenities || item.email || item.job_title || 'No additional details available.'}
 </p>
 </div>
 <div className="border-t border-border/50 pt-3 mt-3 flex justify-between items-center text-xs text-muted-foreground">
 <span>{item.date || item.created_at?.split('T')[0] || 'N/A'}</span>
 {item.price_per_night && <span className="font-black text-foreground">${item.price_per_night}/nt</span>}
 {item.net_pay && <span className="font-black text-foreground">${item.net_pay}</span>}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

export default function OrbitBuildPage() {
 const { pageName} = useParams();
 const companyId = useCompanyId();
 const queryClient = useQueryClient();

 const { data: config, isLoading} = useQuery({
 queryKey: ['orbit_build_config', companyId],
 queryFn: async () => {
 const { data} = await supabase
 .from('industry_records')
 .select('data')
 .eq('company_id', companyId)
 .eq('industry', 'orbit_build')
 .eq('record_type', 'workspace_config')
 .order('created_at', { ascending: false})
 .limit(1)
 .maybeSingle();
 return data?.data || null;
},
 enabled: !!companyId
});

 // Query to fetch user-toggled viewpoints for all pages
 const { data: viewpoints = {}, refetch: refetchViewpoints} = useQuery({
 queryKey: ['ui_viewpoints', companyId],
 queryFn: async () => {
 const { data} = await supabase
 .from('industry_records')
 .select('data')
 .eq('company_id', companyId)
 .eq('record_type', 'ui_viewpoints')
 .maybeSingle();
 return data?.data?.page_viewpoints || {};
},
 enabled: !!companyId
});

 // Compute cleanId and tableName here (before any early returns) to satisfy React's Rules of Hooks
 const rawComponentId = config?.pages?.find(
 p => p.page_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === pageName
 )?.component_id || '';

 const cleanId = rawComponentId
 .toLowerCase()
 .trim()
 .replace(/^univ_/, '')
 .replace(/^univ/, '')
 .replace(/[^a-z0-9]/g, '');

 const tableName = React.useMemo(() => {
 if (cleanId === 'hremployee' || cleanId === 'employee' || cleanId === 'staff') return 'univ_hr_employees';
 if (cleanId === 'studentrecords' || cleanId === 'student') return 'univ_students';
 if (cleanId === 'patientrecords' || cleanId === 'patient') return 'univ_patients';
 if (cleanId === 'leavemanagement') return 'univ_leaves';
 if (cleanId === 'assetmanagement') return 'univ_assets';
 if (!cleanId) return 'industry_records';
 return `univ_${cleanId}s`;
}, [cleanId]);

 if (isLoading) {
 return (
 <div className="flex h-screen items-center justify-center">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 </div>
 );
}

 // Find the page in config (pageDef was already used above for cleanId/tableName derivation)
 const pageDef = config?.pages?.find(p => p.page_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === pageName);

 if (!pageDef) {
 return (
 <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
 <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
 <p>This OrbitBuild page could not be found in your configuration.</p>
 </div>
 );
}

 const currentViewpoint = viewpoints[pageName] || 'default';

 const changeViewpoint = async (newView) => {
 const updatedViewpoints = { ...viewpoints, [pageName]: newView};
 queryClient.setQueryData(['ui_viewpoints', companyId], updatedViewpoints);

 try {
 const { data: existing} = await supabase
 .from('industry_records')
 .select('id')
 .eq('company_id', companyId)
 .eq('record_type', 'ui_viewpoints')
 .maybeSingle();

 const recordId = existing?.id || crypto.randomUUID();

 await (async () => {
 const _p = {
 id: recordId,
 company_id: companyId,
 industry: 'core',
 record_type: 'ui_viewpoints',
 data: { page_viewpoints: updatedViewpoints},
 created_at: new Date().toISOString()
};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO industry_records (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')}) ON CONFLICT(id) DO UPDATE SET ${_k.map(k=>k+' = excluded.'+k).join(', ')}`, _v);
})();
 toast.success(`Switched to ${newView} view`);
 refetchViewpoints();
} catch (e) {
 console.error("Failed to save viewpoint:", e);
 toast.error("Failed to persist viewpoint preference");
}
};

 // Map the component_id to the actual universal component, respecting the currentViewpoint override
 const renderComponent = () => {
 // Intercept with user-toggled viewpoint overrides
 if (currentViewpoint === 'grid') {
 return <UnivDataGrid title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
}
 if (currentViewpoint === 'kanban') {
 return <UnivKanban companyId={companyId} pageName={pageDef.page_name} title={pageDef.page_name} tableName={tableName} />;
}
 if (currentViewpoint === 'calendar') {
 return <UnivCalendar companyId={companyId} pageName={pageDef.page_name} title={pageDef.page_name} tableName={tableName} />;
}
 if (currentViewpoint === 'timeline') {
 return <UnivTimeline companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
}
 if (currentViewpoint === 'gallery') {
 return <DynamicGalleryView companyId={companyId} pageDef={pageDef} cleanId={cleanId} tableName={tableName} />;
}
 if (currentViewpoint === 'analytics') {
 return <UnivAnalytics companyId={companyId} pageName={pageDef.page_name} title={pageDef.page_name} tableName={tableName} />;
}
 if (currentViewpoint === 'form') {
 return <UnivForm companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
}

 // Default matching case
 switch (cleanId) {
 case 'crm':
 case 'leads':
 return <UnivCRM />;
 case 'invoice':
 case 'invoices':
 return <UnivInvoice />;
 case 'appointment':
 case 'appointments':
 return <UnivAppointments />;
 case 'inventory':
 return <UnivInventory />;
 case 'hremployee':
 case 'employee':
 case 'employees':
 case 'staff':
 return <UnivHREmployee />;
 case 'datagrid':
 case 'grid':
 case 'table':
 return <UnivDataGrid title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} />;
 case 'kanban':
 case 'tasks':
 case 'board':
 return <UnivKanban companyId={companyId} pageName={pageDef.page_name} title={pageDef.page_name} />;
 case 'calendar':
 return <UnivCalendar companyId={companyId} pageName={pageDef.page_name} title={pageDef.page_name} />;
 case 'dashboard':
 case 'dashboardwidgets':
 return <UnivDashboard companyId={companyId} pageName={pageDef.page_name} title={pageDef.page_name} />;
 case 'analytics':
 case 'reports':
 return <UnivAnalytics companyId={companyId} pageName={pageDef.page_name} title={pageDef.page_name} />;
 case 'formwizard':
 case 'form':
 case 'approval':
 return <UnivForm />;
 case 'search':
 return <UnivSearch />;
 case 'globalsearch':
 return <UnivGlobalSearch title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'commandpalette':
 case 'command':
 case 'palette':
 // Note: UnivCommandPalette is ideally mounted app-wide but can be here too
 return <UnivCommandPalette companyId={companyId} workspaceConfig={{ pages: [pageDef]}} />;
 case 'knowledgebase':
 case 'knowledge':
 case 'kb':
 case 'wiki':
 return <UnivKnowledgeBase title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'clientportal':
 case 'portal':
 return <UnivClientPortal title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'timeline':
 return <UnivTimeline />;
 case 'documentmanager':
 case 'document':
 case 'documents':
 case 'filemanager':
 return <UnivDocument companyId={companyId} pageName={pageDef.page_name} title={pageDef.page_name} />;
 case 'chat':
 case 'internalchat':
 case 'messages':
 return <UnivChat title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'messaging':
 return <UnivMessaging />;
 case 'booking':
 case 'bookings':
 case 'reservations':
 return <UnivBooking title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'appointments':
 case 'scheduling':
 case 'schedule':
 return <UnivAppointments title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'assetmanagement':
 case 'assets':
 case 'inventory':
 case 'equipment':
 return <UnivAssetManagement title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'supportticket':
 case 'support':
 case 'tickets':
 case 'helpdesk':
 return <UnivSupportTicket title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'sop':
 case 'sops':
 case 'procedures':
 case 'manuals':
 return <UnivSOP title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'budgeting':
 case 'budgets':
 case 'finance':
 return <UnivBudgeting title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'riskmanagement':
 case 'risks':
 case 'risk':
 return <UnivRiskManagement title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'vendormanagement':
 case 'vendors':
 case 'suppliers':
 return <UnivVendorManagement title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'compliance':
 case 'certifications':
 case 'audit':
 return <UnivCompliance title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'auditlog':
 case 'logs':
 case 'systemlogs':
 return <UnivAuditLog title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'goals':
 case 'okrs':
 case 'goaltracker':
 return <UnivGoalTracker title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'time':
 case 'timetracking':
 case 'timesheets':
 return <UnivTimeTracking title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'resources':
 case 'capacity':
 case 'resourceallocation':
 return <UnivResourceAllocation title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'surveys':
 case 'feedback':
 case 'pulse':
 return <UnivSurvey title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'events':
 case 'webinars':
 case 'eventmanagement':
 return <UnivEventManagement title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
 case 'billing':
 case 'subscription':
 case 'plans':
 return <UnivBilling title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} />;
 case 'superadminbilling':
 case 'revenue':
 return <SuperAdminBilling title={pageDef.page_name} />;
 case 'notification':
 case 'notifications':
 return <UnivNotification />;
 case 'contactmanagement':
 case 'contacts':
 return <UnivContactManagement />;
 case 'payment':
 case 'payments':
 case 'billing':
 return <UnivPayment />;
 case 'subscription':
 case 'purchasing':
 return <UnivProcurement />;
 case 'pos':
 case 'pointofsale':
 return <UnivPOS />;
 case 'attendance':
 case 'timetracking':
 return <UnivAttendance />;
 case 'payroll':
 case 'salaries':
 return <UnivPayroll />;
 case 'recruitment':
 case 'hiring':
 case 'applicants':
 return <UnivRecruitment />;
 case 'leavemanagement':
 case 'leaves':
 case 'timeoff':
 return <UnivLeaveManagement />;
 case 'studentrecords':
 case 'student':
 case 'students':
 return <UnivStudent />;
 case 'faculty':
 case 'teachers':
 return <UnivFaculty />;
 case 'course':
 case 'courses':
 case 'subjects':
 case 'classes':
 return <UnivCourse />;
 case 'gradebook':
 case 'grades':
 case 'results':
 return <UnivGradebook />;
 case 'classattendance':
 return <UnivClassAttendance />;
 case 'lms':
 case 'lessons':
 case 'assignments':
 return <UnivLMS />;
 case 'parentportal':
 case 'guardians':
 return <UnivParentPortal />;
 case 'patientrecords':
 case 'patient':
 case 'patients':
 return <UnivPatient />;
 case 'emr':
 case 'medicalrecords':
 case 'clinicalnotes':
 return <UnivEMR />;
 case 'prescription':
 case 'prescriptions':
 case 'medications':
 case 'pharmacy':
 return <UnivPrescription />;
 case 'labresults':
 case 'lab':
 case 'labs':
 case 'diagnostics':
 return <UnivLab />;
 case 'wardmanagement':
 case 'ward':
 case 'wards':
 case 'beds':
 return <UnivWard />;
 case 'telemedicine':
 case 'videoconsult':
 case 'virtualvisit':
 return <UnivTelemedicine />;
 case 'booking':
 case 'bookings':
 case 'reservation':
 case 'reservations':
 return <UnivBooking />;
 case 'room':
 case 'rooms':
 case 'roominventory':
 return <UnivRoom />;
 case 'housekeeping':
 case 'cleaning':
 return <UnivHousekeeping />;
 case 'menu':
 case 'restaurantmenu':
 return <UnivMenu />;
 case 'diningorders':
 case 'dining':
 case 'restaurantorders':
 case 'posorders':
 return <UnivDining />;
 case 'fleet':
 case 'vehicles':
 return <UnivFleet />;
 case 'dispatch':
 case 'driverdispatch':
 return <UnivDispatch />;
 case 'routeplanning':
 case 'route':
 case 'routes':
 return <UnivRoute />;
 case 'delivery':
 case 'deliveries':
 case 'deliverytracking':
 return <UnivDelivery />;
 case 'warehouse':
 case 'storage':
 return <UnivWarehouse />;
 case 'project':
 case 'projects':
 case 'constructionprojects':
 return <UnivProject />;
 case 'boq':
 case 'billofquantities':
 return <UnivBOQ />;
 case 'siteinspections':
 case 'siteinspection':
 case 'snaglist':
 return <UnivSiteInspection />;
 case 'safety':
 case 'incidents':
 return <UnivSafety />;
 case 'contractor':
 case 'contractors':
 case 'subcontractors':
 return <UnivContractor />;
 case 'case':
 case 'cases':
 case 'casemanagement':
 return <UnivCaseManagement />;
 case 'legaldocuments':
 case 'legaldocument':
 case 'contracts':
 return <UnivLegalDocument />;
 case 'courtcalendar':
 case 'court':
 case 'hearings':
 return <UnivCourtCalendar />;
 case 'clientportal':
 case 'clientaccess':
 return <UnivClientPortal />;
 case 'production':
 case 'manufacturing':
 case 'productionruns':
 return <UnivProduction />;
 case 'bom':
 case 'billofmaterials':
 return <UnivBOM />;
 case 'machine':
 case 'machines':
 case 'equipmentmaintenance':
 return <UnivMachine />;
 case 'qualitycontrol':
 case 'qc':
 case 'inspections':
 return <UnivQualityControl />;

 // Legal Services Suite
 case 'consultation': return <UnivConsultation />;
 case 'retainer': return <UnivRetainer />;
 case 'escrow': return <UnivEscrow />;
 case 'timebilling': return <UnivTimebilling />;
 case 'conflictcheck': return <UnivConflictcheck />;
 case 'arbitration': return <UnivArbitration />;
 case 'trademark': return <UnivTrademark />;
 case 'clientledger': return <UnivClientledger />;
 case 'expertwitness': return <UnivExpertwitness />;
 case 'briefs': return <UnivBriefs />;

 // Property Management Suite
 case 'property': return <UnivProperty />;
 case 'tenant': case 'tenants': return <UnivTenant />;
 case 'lease': case 'leases': return <UnivLease />;
 case 'maintenancerequest': case 'maintenance': return <UnivMaintenancerequest />;
 case 'propertyinspection': return <UnivPropertyinspection />;
 case 'listing': case 'listings': return <UnivListing />;
 case 'agentcommission': return <UnivAgentcommission />;
 case 'hoa': return <UnivHoa />;
 case 'utilitybill': case 'utilities': return <UnivUtilitybill />;

 // Retail & E-commerce Suite
 case 'productcatalog': case 'products': return <UnivProductCatalog />;
 case 'orderregistry': case 'orders': return <UnivOrderRegistry />;
 case 'discount': case 'coupons': return <UnivDiscount />;
 case 'customerreview': case 'reviews': return <UnivCustomerReview />;
 case 'supplierdirectory': case 'suppliers': return <UnivSupplierDirectory />;
 case 'returnrefund': case 'returns': return <UnivReturnRefund />;
 case 'giftcard': case 'giftcards': return <UnivGiftCard />;
 case 'wishlist': case 'wishlists': return <UnivWishlist />;
 case 'loyaltypoint': case 'loyalty': return <UnivLoyaltyPoint />;

 // Finance & Accounting Suite
 case 'generalledger': case 'ledger': return <UnivGeneralLedger />;
 case 'expensereport': case 'expenses': return <UnivExpenseReport />;
 case 'taxfiling': case 'tax': return <UnivTaxFiling />;
 case 'audittrail': case 'audit': return <UnivAuditTrail />;

 // Events, Travel & Hospitality Extended
 case 'eventplanner': case 'events': return <UnivEventPlanner />;
 case 'ticketsales': case 'tickets': return <UnivTicketSales />;
 case 'carrental': case 'cars': return <UnivCarRental />;
 case 'tourpackage': case 'tours': return <UnivTourPackage />;
 case 'luggageclaim': return <UnivLuggageClaim />;
 case 'feedbacksurvey': case 'surveys': return <UnivFeedbackSurvey />;
 case 'tablereservation': return <UnivTableReservation />;
 case 'hotelreview': return <UnivHotelReview />;

 // Logistics Extended
 case 'pallettracker': case 'pallets': return <UnivPalletTracker />;

 // Nonprofit & HR Extended Suite
 case 'donorprofile': case 'donors': return <UnivDonorProfile />;
 case 'donationlog': case 'donations': return <UnivDonationLog />;
 case 'volunteerroster': case 'volunteers': return <UnivVolunteerRoster />;
 case 'campaignmetric': return <UnivCampaignMetric />;
 case 'beneficiarylist': case 'beneficiaries': return <UnivBeneficiaryList />;
 case 'pledge': case 'pledges': return <UnivPledge />;
 case 'sponsorship': case 'sponsorships': return <UnivSponsorship />;
 case 'advocacy': return <UnivAdvocacy />;
 case 'inkinddonation': return <UnivInKindDonation />;
 case 'expenseclaim': return <UnivExpenseClaim />;
 case 'timesheet': return <UnivTimeSheet />;
 case 'orgchart': return <UnivOrgChart />;
 case 'disciplinary': return <UnivDisciplinary />;
 case 'onboardingtask': case 'onboarding': return <UnivOnboardingTask />;
 case 'exitinterview': return <UnivExitInterview />;
 case 'benefitelection': return <UnivBenefitElection />;

 // Marketing Suite
 case 'commissionstructure': return <UnivCommissionStructure />;
 case 'campaignschedule': return <UnivCampaignSchedule />;
 case 'adspend': return <UnivAdSpend />;
 case 'newsletter': case 'newsletters': return <UnivNewsletter />;
 case 'competitorprice': return <UnivCompetitorPrice />;
 case 'leadmagnet': return <UnivLeadMagnet />;

 // Customer Success & Support Suite
 case 'supportticket': case 'helpdesk': return <UnivSupportTicket />;
 case 'kbarticle': case 'knowledgebase': return <UnivKbArticle />;
 case 'slaagreement': case 'sla': return <UnivSlaAgreement />;
 case 'churnrisk': return <UnivChurnRisk />;
 case 'featurerequest': return <UnivFeatureRequest />;
 case 'chattranscript': return <UnivChatTranscript />;
 case 'customerjourney': return <UnivCustomerJourney />;
 case 'calllog': return <UnivCallLog />;
 case 'incidentreport': return <UnivIncidentReport />;

 // IT & Security Suite
 case 'servermetric': case 'servers': return <UnivServerMetric />;
 case 'ipaddress': return <UnivIpAddress />;
 case 'accesscontrol': return <UnivAccessControl />;
 case 'sslcertificate': case 'ssl': return <UnivSslCertificate />;
 case 'gdprrequest': case 'gdpr': return <UnivGdprRequest />;
 case 'softwarelicense': case 'licenses': return <UnivSoftwareLicense />;
 case 'vulnerability': case 'vulnerabilities': return <UnivVulnerability />;
 case 'databackup': case 'backups': return <UnivDataBackup />;

 // Final 15 Extended Enterprise Suite
 case 'riskregister': case 'risks': return <UnivRiskRegister />;
 case 'contractmanagement': case 'contracts': return <UnivContractManagement />;
 case 'meetingminutes': case 'meetings': return <UnivMeetingMinutes />;
 case 'kpitracker': case 'kpis': return <UnivKpiTracker />;
 case 'budgetforecast': case 'budgets': return <UnivBudgetForecast />;
 case 'changerequest': case 'changes': return <UnivChangeRequest />;
 case 'projectmilestone': case 'milestones': return <UnivProjectMilestone />;
 case 'employeeperformance': case 'performance': return <UnivEmployeePerformance />;
 case 'trainingrecord': case 'training': return <UnivTrainingRecord />;
 case 'healthsafety': case 'safety': return <UnivHealthSafety />;
 case 'salestarget': case 'targets': return <UnivSalesTarget />;
 case 'productionschedule': case 'production': return <UnivProductionSchedule />;
 case 'customersegment': case 'segments': return <UnivCustomerSegment />;
 case 'digitalasset': case 'assets': return <UnivDigitalAsset />;
 case 'apiintegration': case 'integrations': return <UnivApiIntegration />;
 
 // Batch 1 Specialized
 case 'workflowbuilder': case 'workflows': return <UnivWorkflowBuilder companyId={companyId} />;
 case 'approvalengine': case 'approvals': return <UnivApprovalEngine companyId={companyId} />;

 default:
 return <UnivDataGrid title={pageDef.page_name} companyId={companyId} pageName={pageDef.page_name} tableName={tableName} />;
}
};

 const toolbarViews = [
 { id: 'default', label: 'Default Layout', icon: <Layout className="w-4 h-4" />},
 { id: 'grid', label: 'Grid View', icon: <Table className="w-4 h-4" />},
 { id: 'kanban', label: 'Kanban Board', icon: <KanbanIcon className="w-4 h-4" />},
 { id: 'calendar', label: 'Calendar Scheduler', icon: <CalendarIcon className="w-4 h-4" />},
 { id: 'timeline', label: 'Timeline roadmap', icon: <Clock className="w-4 h-4" />},
 { id: 'gallery', label: 'Gallery Grid', icon: <GalleryIcon className="w-4 h-4" />},
 { id: 'analytics', label: 'Analytics Chart', icon: <BarChart3 className="w-4 h-4" />},
 { id: 'form', label: 'Form Questionnaire', icon: <FormIcon className="w-4 h-4" />},
 ];

 const hideViewpointSwitcher = ['analytics', 'reports', 'workflowbuilder', 'workflows', 'approvalengine', 'approvals'].includes(cleanId);

 return (
 <div className="w-full min-h-[calc(100vh-4rem)] p-6 bg-background flex flex-col gap-4">
 {/* Viewpoint persistence switcher control */}
 {!hideViewpointSwitcher && (
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-card/60 border border-border/80 backdrop-blur-md rounded-2xl gap-3 shrink-0">
 <div className="px-2">
 <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Active Viewpoint</span>
 <span className="text-sm font-bold text-foreground capitalize">{currentViewpoint} View</span>
 </div>
 <div className="flex flex-wrap items-center bg-muted/40 p-1 rounded-xl border border-border/50">
 {toolbarViews.map((view) => (
 <button
 key={view.id}
 onClick={() => changeViewpoint(view.id)}
 title={view.label}
 className={`p-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-semibold ${
 currentViewpoint === view.id
 ? 'bg-primary text-white '
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
}`}
 >
 {view.icon}
 <span className="hidden md:inline">{view.id === 'default' ? 'Default' : view.id}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 <div className="flex-1">
 <React.Suspense fallback={<div className="p-8 text-center flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
 {renderComponent()}
 </React.Suspense>
 </div>
 </div>
 );
}
