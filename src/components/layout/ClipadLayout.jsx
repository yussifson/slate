import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import GlobalAIAssistant from '@/components/layout/GlobalAIAssistant';
import ClipadMobileNav from '@/components/clipad/ClipadMobileNav';
import ClipadTopNav from '@/components/clipad/ClipadTopNav';
import ClipadSidebar from '@/components/clipad/ClipadSidebar';
import { useChatDock } from '@/hooks/useChatDock';
const ClipadChat = React.lazy(() => import('@/pages/clipad/ClipadChat'));
import { MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

import PullToRefresh from '@/components/ui/PullToRefresh';

import DockResizer from './DockResizer';

export default function ClipadLayout() {
  const [isAIOpen, setIsAIOpen] = React.useState(false);
  const [injectedContext, setInjectedContext] = React.useState(null);
  const { isChatDocked, setChatDock, dockWidth } = useChatDock();
  const location = useLocation();

  const containerRef = React.useRef(null);
  const [forceMobile, setForceMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setForceMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-undock if we navigate back to the main chat page
  React.useEffect(() => {
    if (location.pathname === '/chat' && isChatDocked) {
      setChatDock(false);
    }
  }, [location.pathname, isChatDocked, setChatDock]);

  // Expose toggle globally for Clipad pages to call it
  React.useEffect(() => {
    const handleToggle = () => setIsAIOpen(prev => !prev);
    const handleOrbitInject = (e) => {
      setIsAIOpen(true);
      if (e.detail) {
        setInjectedContext(e.detail);
      }
    };
    window.addEventListener('toggle-clipad-orbit', handleToggle);
    window.addEventListener('orbit:inject', handleOrbitInject);
    return () => {
      window.removeEventListener('toggle-clipad-orbit', handleToggle);
      window.removeEventListener('orbit:inject', handleOrbitInject);
    };
  }, []);

  // Never hide nav
  const isImmersive = false;

  return (
    <div className="flex flex-row h-[100dvh] w-full overflow-hidden bg-[#00beac] dark:bg-background text-slate-900 dark:text-slate-100 pt-[var(--sat)] pb-[var(--sab)] pl-[var(--sal)] pr-[var(--sar)]">
      
      {/* Premium Sidebar Component */}
      <ClipadSidebar forceMobile={forceMobile} />

      {/* Main Content Column */}
      <div ref={containerRef} className="flex flex-col flex-1 w-0 overflow-hidden relative @container bg-[#00beac] dark:bg-background transition-all">
        {!isImmersive && <ClipadTopNav forceMobile={forceMobile} />}
        <PullToRefresh className="relative z-30 page-enter pb-[80px] md:pb-0 h-full overflow-y-auto overflow-x-hidden">
          {location.pathname === '/chat' && isChatDocked ? (
            <div className="flex items-center justify-center h-full text-white flex-col gap-3">
              <MessageSquare className="w-8 h-8 opacity-50" />
              <p>Chat is currently docked to the right sidebar.</p>
            </div>
          ) : (
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-full w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            }>
              <Outlet />
            </React.Suspense>
          )}
        </PullToRefresh>
      </div>

      {/* Right Docked Portal for Orbit AI & Chat */}
      <div 
        id="right-docked-panel-portal" 
        className={cn(
          "hidden md:flex shrink-0 h-full relative bg-white dark:bg-background z-40",
          isChatDocked ? "border-l border-black/5 dark:border-white/5 shadow-[-8px_0_30px_rgba(0,0,0,0.05)]" : "w-0 overflow-hidden border-none"
        )}
        style={{ width: isChatDocked ? dockWidth : 0 }}
      >
        {isChatDocked && <DockResizer />}
        {isChatDocked && <ClipadChat isDockedMode={true} />}
      </div>

      <GlobalAIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        injectedContext={injectedContext} 
        onContextConsumed={() => setInjectedContext(null)} 
      />

      {/* Global OrbitFlow Button moved to ClipadTopNav */}


      <ClipadMobileNav forceMobile={forceMobile} />
    </div>
  );
}
