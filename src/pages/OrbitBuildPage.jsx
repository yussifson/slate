import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Loader2 } from 'lucide-react';

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
const UnivBooking = React.lazy(() => import("@/components/universal/UnivBooking"));
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
const UnivClientPortal = React.lazy(() => import("@/components/universal/UnivClientPortal"));
const UnivProduction = React.lazy(() => import("@/components/universal/UnivProduction"));
const UnivBOM = React.lazy(() => import("@/components/universal/UnivBOM"));
const UnivMachine = React.lazy(() => import("@/components/universal/UnivMachine"));
const UnivQualityControl = React.lazy(() => import("@/components/universal/UnivQualityControl"));

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
  { name: 'name', field_type: 'text', order_index: 0 },
  { name: 'status', field_type: 'select', order_index: 1 },
  { name: 'date', field_type: 'date', order_index: 2 }
];

export default function OrbitBuildPage() {
  const { pageName } = useParams();
  const companyId = useCompanyId();

  const { data: config, isLoading } = useQuery({
    queryKey: ['orbit_build_config', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('industry_records')
        .select('data')
        .eq('company_id', companyId)
        .eq('industry', 'orbit_build')
        .eq('record_type', 'workspace_config')
        .single();
      return data?.data?.pages || [];
    },
    enabled: !!companyId
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find the page in config
  // The param is lowercase with hyphens, e.g. "pet-records"
  const pageDef = config?.find(p => p.page_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === pageName);

  if (!pageDef) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
        <p>This OrbitBuild page could not be found in your configuration.</p>
      </div>
    );
  }

  // Map the component_id to the actual universal component
  const renderComponent = () => {
            switch (pageDef.component_id) {
      case 'crm':
        return <UnivCRM />;
      case 'invoice':
      case 'payment':
        return <UnivInvoice />;
      case 'appointment':
      case 'calendar':
      case 'booking':
      case 'scheduling':
        return <UnivAppointments />;
      case 'inventory':
      case 'asset_management':
        return <UnivInventory />;
      case 'hr_employee':
      case 'contact_management':
        return <UnivHREmployee />;
        
      // Generic Generic Views (Phase 2)
      case 'dashboard_widgets':
      case 'dashboard':
        return <UnivDashboard />;
      case 'analytics':
      case 'reports':
        return <UnivAnalytics />;
      case 'kanban':
      case 'pipeline':
        return <UnivKanban />;
      case 'form_wizard':
      case 'approval':
      case 'form':
        return <UnivForm />;
      case 'search':
        return <UnivSearch />;
        
      // Phase 3 Components
      case 'timeline':
      case 'project_planning':
      case 'milestones':
        return <UnivTimeline />;
      case 'document':
      case 'files':
      case 'storage':
        return <UnivDocument />;
      case 'messaging':
      case 'chat':
      case 'conversations':
        return <UnivMessaging />;
      case 'notification':
      case 'alerts':
      case 'reminders':
        return <UnivNotification />;
        
      // Phase 4 Components
      case 'contact_management':
      case 'contacts':
        return <UnivContactManagement />;
      case 'payment':
      case 'payments':
      case 'billing':
        return <UnivPayment />;
      case 'subscription':
      case 'subscriptions':
      case 'plans':
        return <UnivSubscription />;
      case 'asset_management':
      case 'assets':
        return <UnivAssetManagement />;
      case 'procurement':
      case 'purchasing':
        return <UnivProcurement />;
      case 'pos':
      case 'point_of_sale':
        return <UnivPOS />;
      case 'attendance':
      case 'time_tracking':
        return <UnivAttendance />;
      case 'payroll':
      case 'salaries':
        return <UnivPayroll />;
      case 'recruitment':
      case 'hiring':
      case 'applicants':
        return <UnivRecruitment />;
      case 'leave_management':
      case 'leaves':
      case 'time_off':
        return <UnivLeaveManagement />;

      // Phase 5 Components (Education Suite)
      case 'student_records':
      case 'students':
        return <UnivStudent />;
      case 'faculty':
      case 'teachers':
        return <UnivFaculty />;
      case 'courses':
      case 'subjects':
      case 'classes':
        return <UnivCourse />;
      case 'gradebook':
      case 'grades':
      case 'results':
        return <UnivGradebook />;
      case 'class_attendance':
        return <UnivClassAttendance />;
      case 'lms':
      case 'lessons':
      case 'assignments':
        return <UnivLMS />;
      case 'parent_portal':
      case 'guardians':
        return <UnivParentPortal />;

      // Phase 6 Components (Healthcare Suite)
      case 'patient_records':
      case 'patients':
        return <UnivPatient />;
      case 'emr':
      case 'medical_records':
      case 'clinical_notes':
        return <UnivEMR />;
      case 'prescriptions':
      case 'medications':
      case 'pharmacy':
        return <UnivPrescription />;
      case 'lab_results':
      case 'labs':
      case 'diagnostics':
        return <UnivLab />;
      case 'ward_management':
      case 'wards':
      case 'beds':
        return <UnivWard />;
      case 'telemedicine':
      case 'video_consult':
      case 'virtual_visit':
        return <UnivTelemedicine />;

      // Phase 7 Components (Hospitality Suite)
      case 'bookings':
      case 'reservations':
        return <UnivBooking />;
      case 'rooms':
      case 'room_inventory':
        return <UnivRoom />;
      case 'housekeeping':
      case 'cleaning':
        return <UnivHousekeeping />;
      case 'menu':
      case 'restaurant_menu':
        return <UnivMenu />;
      case 'dining_orders':
      case 'restaurant_orders':
      case 'pos_orders':
        return <UnivDining />;

      // Phase 8 Components (Logistics & Construction)
      case 'fleet':
      case 'vehicles':
        return <UnivFleet />;
      case 'dispatch':
      case 'driver_dispatch':
        return <UnivDispatch />;
      case 'route_planning':
      case 'routes':
        return <UnivRoute />;
      case 'deliveries':
      case 'delivery_tracking':
        return <UnivDelivery />;
      case 'warehouse':
      case 'storage':
        return <UnivWarehouse />;
      case 'projects':
      case 'construction_projects':
        return <UnivProject />;
      case 'boq':
      case 'bill_of_quantities':
        return <UnivBOQ />;
      case 'site_inspections':
      case 'snag_list':
        return <UnivSiteInspection />;
      case 'safety':
      case 'incidents':
        return <UnivSafety />;
      case 'contractors':
      case 'subcontractors':
        return <UnivContractor />;

      // Phase 9 Components (Legal & Manufacturing)
      case 'cases':
      case 'case_management':
        return <UnivCaseManagement />;
      case 'legal_documents':
      case 'contracts':
        return <UnivLegalDocument />;
      case 'court_calendar':
      case 'hearings':
        return <UnivCourtCalendar />;
      case 'client_portal':
      case 'client_access':
        return <UnivClientPortal />;
      case 'production':
      case 'manufacturing':
      case 'production_runs':
        return <UnivProduction />;
      case 'bom':
      case 'bill_of_materials':
        return <UnivBOM />;
      case 'machines':
      case 'equipment_maintenance':
        return <UnivMachine />;
      case 'quality_control':
      case 'qc':
      case 'inspections':
        return <UnivQualityControl />;

      case 'data_table':
      case 'pos':
      default:
        return <UnivDataGrid title={pageDef.page_name} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm z-10 shrink-0">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{pageDef.page_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{pageDef.description}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
        <React.Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>}>
          {renderComponent()}
        </React.Suspense>
      </div>
    </div>
  );
}
