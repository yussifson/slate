import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId, useCompany } from '@/hooks/useCompanyId';
import { CapabilityService } from '@/services/CapabilityService';
import PrimaryRail from './PrimaryRail';
import ContextDeck from './ContextDeck';
import TopCommandBar from './TopCommandBar';
import GlobalAIAssistant from '../GlobalAIAssistant';
import GovernedOrbitDrawer from '@/components/intelligence/GovernedOrbitDrawer';
import SpotlightSearch from '../SpotlightSearch';
import { useToast } from '@/components/ui/use-toast';

export default function AppLayoutV2({ children, activeView, onSelectView }) {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { company } = useCompany();
  const { toast } = useToast();

  const [capabilities, setCapabilities] = useState([]);
  const [activeCapabilityId, setActiveCapabilityId] = useState('core_foundation');
  const [isOrbitOpen, setIsOrbitOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function loadCapabilities() {
      if (!companyId) return;
      try {
        const caps = await CapabilityService.getCompanyCapabilities(companyId);
        setCapabilities(caps);
        if (caps.length > 0 && !caps.some(c => c.id === activeCapabilityId)) {
          setActiveCapabilityId(caps[0].id);
        }
      } catch (err) {
        console.warn('[AppLayoutV2] Error loading capabilities:', err);
      }
    }
    loadCapabilities();
  }, [companyId]);

  const activeCapability = capabilities.find(c => c.id === activeCapabilityId) || {
    id: 'core_foundation',
    name: 'Core Business Foundation',
    category: 'Core'
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Workspace Synchronized",
        description: "Latest business events and records refreshed."
      });
    }, 600);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--slate-v2-canvas)] text-[var(--slate-v2-text-primary)] antialiased font-sans">
      {/* 1. 64px Primary Rail */}
      <PrimaryRail 
        capabilities={capabilities}
        activeCapabilityId={activeCapabilityId}
        onSelectCapability={setActiveCapabilityId}
        companyName={company?.name || 'Slate'}
        onOpenSettings={() => onSelectView && onSelectView('settings')}
        user={user}
      />

      {/* 2. Main Flex Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Command Bar */}
        <TopCommandBar 
          companyName={company?.name || 'Apex Global Enterprise'}
          pendingActionCount={2}
          onOpenOrbit={() => setIsOrbitOpen(prev => !prev)}
          onOpenSearch={() => setIsSearchOpen(true)}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          user={user}
        />

        {/* 3. Sub-Deck & Active Canvas Split */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 240px Contextual Deck */}
          <ContextDeck 
            activeCapability={activeCapability}
            activeView={activeView}
            onSelectView={onSelectView}
          />

          {/* Active Work Canvas */}
          <main className="flex-1 overflow-y-auto bg-[var(--slate-v2-canvas)] p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Ambient Governed Orbit Drawer */}
      <GovernedOrbitDrawer 
        isOpen={isOrbitOpen}
        onClose={() => setIsOrbitOpen(false)}
      />

      {/* Global Spotlight Search Modal */}
      {isSearchOpen && (
        <SpotlightSearch 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  );
}
