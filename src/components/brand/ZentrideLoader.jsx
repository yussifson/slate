import React from 'react';
import { cn } from '@/lib/utils';

export function ZentrideSpinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', stroke: 2 },
    md: { container: 'w-10 h-10', icon: 'w-6 h-6', stroke: 2.5 },
    lg: { container: 'w-16 h-16', icon: 'w-9 h-9', stroke: 3 },
    xl: { container: 'w-24 h-24', icon: 'w-14 h-14', stroke: 3.5 },
  };

  const { container, icon } = sizeMap[size] || sizeMap.md;

  return (
    <div className={cn("relative flex items-center justify-center", container, className)}>
      {/* Outer spinning gradient ring */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin"
        viewBox="0 0 100 100"
        fill="none"
        style={{ animationDuration: '1.4s' }}
      >
        <defs>
          <linearGradient id="zentrideSpinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA9C6" stopOpacity="1" />
            <stop offset="50%" stopColor="#F0709B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D2603F" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="currentColor"
          className="text-border/30 dark:text-white/10"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="url(#zentrideSpinGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="180 100"
        />
      </svg>

      {/* Center breathing brand icon */}
      <div className="relative z-10 animate-pulse flex items-center justify-center" style={{ animationDuration: '2s' }}>
        <img 
          src="/zentride-favicon.svg" 
          alt="Zentride" 
          className={cn(icon, "object-contain drop-shadow-sm")} 
        />
      </div>
    </div>
  );
}

export function ZentridePageLoader({ 
  label = "Initializing Zentride...", 
  sublabel = "Executive Real Estate Operations" 
}) {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 dark:bg-[#070B14]/95 backdrop-blur-md font-sans select-none animate-in fade-in duration-200"
      role="status"
      aria-live="polite"
    >
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-[#F0709B]/15 dark:bg-primary/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-64 h-64 rounded-full bg-[#D2603F]/10 dark:bg-[#D2603F]/8 blur-3xl pointer-events-none translate-y-12" />

      {/* Main Container Card */}
      <div className="relative z-10 flex flex-col items-center p-8 text-center">
        {/* Brand Icon with glowing orbital spinner */}
        <div className="relative mb-6">
          <ZentrideSpinner size="xl" />
        </div>

        {/* Brand Wordmark & Label */}
        <div className="space-y-1.5 flex flex-col items-center">
          <img 
            src="/zentride-logo.svg" 
            alt="Zentride" 
            className="h-10 w-auto object-contain max-w-[200px] drop-shadow-sm dark:hidden" 
          />
          <img 
            src="/zentride-logo-white.svg" 
            alt="Zentride" 
            className="h-10 w-auto object-contain max-w-[200px] drop-shadow-sm hidden dark:block" 
          />
          
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F0709B] animate-ping" />
            <p className="text-xs font-bold tracking-tight uppercase tracking-wider text-foreground">
              {label}
            </p>
          </div>

          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {sublabel}
          </p>
        </div>

        {/* Sleek linear indeterminate loader bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-6 relative">
          <div className="absolute inset-y-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}

export function ZentrideLoadingOverlay({ visible, label = "Loading...", blur = true }) {
  if (!visible) return null;

  return (
    <div 
      className={cn(
        "absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-card/80 dark:bg-[#070B14]/80 animate-in fade-in duration-150 rounded-inherit",
        blur && "backdrop-blur-xs"
      )}
      role="status"
    >
      <ZentrideSpinner size="md" />
      {label && (
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}

export default ZentridePageLoader;
