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
