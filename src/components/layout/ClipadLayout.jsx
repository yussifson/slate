import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AiAssistant from '@/components/AiAssistant';

export default function ClipadLayout() {
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Expose toggle globally for Clipad pages to call it
  React.useEffect(() => {
    const handleToggle = () => setIsAIOpen(prev => !prev);
    window.addEventListener('toggle-clipad-orbit', handleToggle);
    return () => window.removeEventListener('toggle-clipad-orbit', handleToggle);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-30 page-enter">
          <Outlet />
        </div>

        {/* Right Docked Portal for Orbit AI */}
        <div 
          id="right-docked-panel-portal" 
          className="flex shrink-0 h-full empty:hidden z-[100] relative bg-white dark:bg-[#090E17] border-l border-slate-200 dark:border-white/10 transition-all duration-300"
        ></div>

      </div>

      <AiAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}
