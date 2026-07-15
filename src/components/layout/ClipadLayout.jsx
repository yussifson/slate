import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import GlobalAIAssistant from '@/components/layout/GlobalAIAssistant';
import ClipadMobileNav from '@/components/clipad/ClipadMobileNav';
import { useChatDock } from '@/hooks/useChatDock';
import ClipadChat from '@/pages/clipad/ClipadChat';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import CliPadCommandPalette from '@/components/clipad/CliPadCommandPalette';

export default function ClipadLayout() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [injectedContext, setInjectedContext] = useState(null);
  const { isChatDocked, setChatDock } = useChatDock();
  const location = useLocation();

  // Auto-undock if we navigate back to the main chat page
  React.useEffect(() => {
    if (location.pathname === '/clipad/chat' && isChatDocked) {
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
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-30 page-enter pb-[80px] md:pb-0">
          {location.pathname === '/clipad/chat' && isChatDocked ? (
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
            "flex shrink-0 h-full relative bg-white dark:bg-[#090E17] transition-all duration-300",
            isChatDocked ? "w-[400px] xl:w-[450px] border-l border-primary/40 shadow-xl" : "w-0 overflow-hidden border-none"
          )}
        >
          {isChatDocked && <ClipadChat isDockedMode={true} />}
        </div>

      </div>

      <GlobalAIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        injectedContext={injectedContext} 
        onContextConsumed={() => setInjectedContext(null)} 
      />
      <CliPadCommandPalette />
      <ClipadMobileNav />
    </div>
  );
}
