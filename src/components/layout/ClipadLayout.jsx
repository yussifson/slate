import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import GlobalAIAssistant from '@/components/layout/GlobalAIAssistant';
import ClipadMobileNav from '@/components/clipad/ClipadMobileNav';
import { useChatDock } from '@/hooks/useChatDock';
import ClipadChat from '@/pages/clipad/ClipadChat';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import CliPadCommandPalette from '@/components/clipad/CliPadCommandPalette';

import DockResizer from './DockResizer';

export default function ClipadLayout() {
  const [isAIOpen, setIsAIOpen] = React.useState(false);
  const [injectedContext, setInjectedContext] = React.useState(null);
  const { isChatDocked, setChatDock, dockWidth } = useChatDock();
  const location = useLocation();

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

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-[var(--sat)] pb-[var(--sab)] pl-[var(--sal)] pr-[var(--sar)]">
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-30 page-enter pb-[80px] md:pb-0">
          {location.pathname === '/chat' && isChatDocked ? (
            <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-3">
              <MessageSquare className="w-8 h-8 opacity-50" />
              <p>Chat is currently docked to the right sidebar.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>

        {/* Right Docked Portal for Orbit AI & Chat */}
        <div 
          id="right-docked-panel-portal" 
          className={cn(
            "hidden md:flex shrink-0 h-full relative bg-white dark:bg-[#090E17]",
            isChatDocked ? "border-l-4 border-primary shadow-xl" : "w-0 overflow-hidden border-none"
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
      </div>

      <CliPadCommandPalette />
      <ClipadMobileNav />
    </div>
  );
}
