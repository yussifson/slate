import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import GlobalAIAssistant from '@/components/layout/GlobalAIAssistant';
import ClipadMobileNav from '@/components/clipad/ClipadMobileNav';
import ClipadTopNav from '@/components/clipad/ClipadTopNav';
import { useChatDock } from '@/hooks/useChatDock';
import ClipadChat from '@/pages/clipad/ClipadChat';
import { MessageSquare, Sparkles } from 'lucide-react';
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

  // Hide nav on immersive screens
  const isImmersive = location.pathname.startsWith('/record') || 
                      location.pathname.startsWith('/watch') || 
                      /^\/meetings\/[^\/]+$/.test(location.pathname);

  return (
    <div className="flex flex-row h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 pt-[var(--sat)] pb-[var(--sab)] pl-[var(--sal)] pr-[var(--sar)]">
      
      {/* Main Content Column */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden relative">
        {!isImmersive && <ClipadTopNav />}
        
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-30 page-enter pb-[80px] md:pb-0">
          {location.pathname === '/chat' && isChatDocked ? (
            <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-3">
              <MessageSquare className="w-8 h-8 opacity-50" />
              <p>Chat is currently docked to the right sidebar.</p>
            </div>
          ) : (
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-full w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <Outlet />
            </React.Suspense>
          )}
        </div>
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

      {/* Mobile OrbitFlow FAB */}
      {!isAIOpen && !isImmersive && (
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-clipad-orbit"))}
          className="md:hidden fixed bottom-[80px] right-4 z-50 w-12 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      <CliPadCommandPalette />
      <ClipadMobileNav />
    </div>
  );
}
