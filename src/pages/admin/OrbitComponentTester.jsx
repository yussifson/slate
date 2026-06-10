import React, { Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader2, Component } from 'lucide-react';

const components = {
  UnivAnalytics: React.lazy(() => import('@/components/universal/UnivAnalytics')),
  UnivAppointments: React.lazy(() => import('@/components/universal/UnivAppointments')),
  UnivAssetManagement: React.lazy(() => import('@/components/universal/UnivAssetManagement')),
  UnivAttendance: React.lazy(() => import('@/components/universal/UnivAttendance')),
  UnivBOM: React.lazy(() => import('@/components/universal/UnivBOM')),
  UnivBooking: React.lazy(() => import('@/components/universal/UnivBooking')),
  UnivBOQ: React.lazy(() => import('@/components/universal/UnivBOQ')),
  UnivCalendar: React.lazy(() => import('@/components/universal/UnivCalendar')),
  UnivCaseManagement: React.lazy(() => import('@/components/universal/UnivCaseManagement')),
  UnivClassAttendance: React.lazy(() => import('@/components/universal/UnivClassAttendance')),
  UnivClientPortal: React.lazy(() => import('@/components/universal/UnivClientPortal')),
  UnivContactManagement: React.lazy(() => import('@/components/universal/UnivContactManagement')),
  UnivContractor: React.lazy(() => import('@/components/universal/UnivContractor')),
  UnivCourse: React.lazy(() => import('@/components/universal/UnivCourse')),
  UnivCourtCalendar: React.lazy(() => import('@/components/universal/UnivCourtCalendar')),
  UnivCRM: React.lazy(() => import('@/components/universal/UnivCRM')),
  UnivDashboard: React.lazy(() => import('@/components/universal/UnivDashboard')),
  UnivDataGrid: React.lazy(() => import('@/components/universal/UnivDataGrid')),
  UnivDelivery: React.lazy(() => import('@/components/universal/UnivDelivery')),
  UnivDining: React.lazy(() => import('@/components/universal/UnivDining')),
  UnivDispatch: React.lazy(() => import('@/components/universal/UnivDispatch')),
  UnivDocument: React.lazy(() => import('@/components/universal/UnivDocument')),
  UnivEMR: React.lazy(() => import('@/components/universal/UnivEMR')),
  UnivFaculty: React.lazy(() => import('@/components/universal/UnivFaculty')),
  UnivFleet: React.lazy(() => import('@/components/universal/UnivFleet')),
  UnivForm: React.lazy(() => import('@/components/universal/UnivForm')),
  UnivGradebook: React.lazy(() => import('@/components/universal/UnivGradebook')),
  UnivHousekeeping: React.lazy(() => import('@/components/universal/UnivHousekeeping')),
  UnivHREmployee: React.lazy(() => import('@/components/universal/UnivHREmployee')),
  UnivInventory: React.lazy(() => import('@/components/universal/UnivInventory')),
  UnivInvoice: React.lazy(() => import('@/components/universal/UnivInvoice')),
  UnivKanban: React.lazy(() => import('@/components/universal/UnivKanban')),
  UnivLab: React.lazy(() => import('@/components/universal/UnivLab')),
  UnivLeaveManagement: React.lazy(() => import('@/components/universal/UnivLeaveManagement')),
  UnivLegalDocument: React.lazy(() => import('@/components/universal/UnivLegalDocument')),
  UnivLMS: React.lazy(() => import('@/components/universal/UnivLMS')),
  UnivMachine: React.lazy(() => import('@/components/universal/UnivMachine')),
  UnivMenu: React.lazy(() => import('@/components/universal/UnivMenu')),
  UnivMessaging: React.lazy(() => import('@/components/universal/UnivMessaging')),
  UnivNotification: React.lazy(() => import('@/components/universal/UnivNotification')),
  UnivParentPortal: React.lazy(() => import('@/components/universal/UnivParentPortal')),
  UnivPatient: React.lazy(() => import('@/components/universal/UnivPatient')),
  UnivPayment: React.lazy(() => import('@/components/universal/UnivPayment')),
  UnivPayroll: React.lazy(() => import('@/components/universal/UnivPayroll')),
  UnivPOS: React.lazy(() => import('@/components/universal/UnivPOS')),
  UnivPrescription: React.lazy(() => import('@/components/universal/UnivPrescription')),
  UnivProcurement: React.lazy(() => import('@/components/universal/UnivProcurement')),
  UnivProduction: React.lazy(() => import('@/components/universal/UnivProduction')),
  UnivProject: React.lazy(() => import('@/components/universal/UnivProject')),
  UnivQualityControl: React.lazy(() => import('@/components/universal/UnivQualityControl')),
  UnivRecruitment: React.lazy(() => import('@/components/universal/UnivRecruitment')),
  UnivRoom: React.lazy(() => import('@/components/universal/UnivRoom')),
  UnivRoute: React.lazy(() => import('@/components/universal/UnivRoute')),
  UnivSafety: React.lazy(() => import('@/components/universal/UnivSafety')),
  UnivSearch: React.lazy(() => import('@/components/universal/UnivSearch')),
  UnivSiteInspection: React.lazy(() => import('@/components/universal/UnivSiteInspection')),
  UnivStudent: React.lazy(() => import('@/components/universal/UnivStudent')),
  UnivSubscription: React.lazy(() => import('@/components/universal/UnivSubscription')),
  UnivTelemedicine: React.lazy(() => import('@/components/universal/UnivTelemedicine')),
  UnivTimeline: React.lazy(() => import('@/components/universal/UnivTimeline')),
  UnivWard: React.lazy(() => import('@/components/universal/UnivWard')),
  UnivWarehouse: React.lazy(() => import('@/components/universal/UnivWarehouse'))
};

export const ORBIT_COMPONENTS_LIST = Object.keys(components);

export default function OrbitComponentTester() {
  const { componentName } = useParams();

  if (!componentName || !components[componentName]) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold">Component Not Found</h2>
        <p className="text-muted-foreground mt-2">Please select a valid component from the Orbit Build dropdown.</p>
      </div>
    );
  }

  const ComponentToRender = components[componentName];

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ComponentToRender pageName={componentName} title={componentName} />
    </Suspense>
  );
}

