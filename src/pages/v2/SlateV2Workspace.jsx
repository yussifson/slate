import BusinessCommandCenter from '@/pages/v2/BusinessCommandCenter';
import CrmWorkspace from '@/pages/v2/CrmWorkspace';
import React, { useState } from 'react';
import AppLayoutV2 from '@/components/layout/v2/AppLayoutV2';
import CorePartyDirectory from '@/pages/v2/CorePartyDirectory';
import FinanceWorkspace from '@/pages/v2/FinanceWorkspace';
import AdaptiveDashboard from '@/pages/omnicore/AdaptiveDashboard';
import BusinessBlueprintWizard from '@/components/blueprint/BusinessBlueprintWizard';
import UnifiedActionCenterView from '@/components/actioncenter/UnifiedActionCenterView';
import SlateWorkflowEngineManager from '@/components/workflow/SlateWorkflowEngineManager';
import IndustryExtensionHub from '@/components/industry/IndustryExtensionHub';
import UniversalIntelligenceDashboard from '@/components/intelligence/UniversalIntelligenceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Layers, Activity } from 'lucide-react';

export default function SlateV2Workspace() {
  const [activeView, setActiveView] = useState('parties_all');

  const renderActiveCanvas = () => {
    switch (activeView) {
      case 'ops_command':
      case 'ops_projects':
      case 'ops_tasks':
      case 'ops_teams':
        return <BusinessCommandCenter />;
      case 'crm_pipeline':
      case 'crm_leads':
      case 'crm_activities':
        return <CrmWorkspace initialTab={activeView === 'crm_activities' ? 'activities' : activeView === 'crm_leads' ? 'opportunities' : 'pipeline'} />;
      case 'parties_all':
        return <CorePartyDirectory filterRole="all" />;
      case 'parties_clients':
        return <CorePartyDirectory filterRole="client" />;
      case 'parties_vendors':
        return <CorePartyDirectory filterRole="vendor" />;
      case 'fin_ledger':
      case 'fin_invoices':
      case 'fin_tax':
        return <FinanceWorkspace />;
      case 'action_center':
        return <UnifiedActionCenterView />;
      case 'intelligence_dashboard':
        return <UniversalIntelligenceDashboard />;
      case 'industry_hub':
        return <IndustryExtensionHub onNavigateToIndustry={(id) => setActiveView(`ind_${id}`)} />;
      case 'blueprint_wizard':
        return <BusinessBlueprintWizard onComplete={() => setActiveView('parties_all')} />;
      case 'workflows':
        return <SlateWorkflowEngineManager />;
      case 'dashboard':
      case 'default_overview':
        return <AdaptiveDashboard />;
      default:
        return (
          <div className="space-y-4">
            <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Modular Business Canvas ({activeView})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--slate-v2-text-secondary)]">
                  This modular workspace capability is active and backed by the V2 Platform Foundation.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <AppLayoutV2 activeView={activeView} onSelectView={setActiveView}>
      {renderActiveCanvas()}
    </AppLayoutV2>
  );
}
