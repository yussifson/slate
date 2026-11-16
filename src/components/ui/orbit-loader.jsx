import React from 'react';
import JCL_LOGO_BASE64 from '@/assets/jclLogoBase64';

function isZentrideActive() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const sub = host.includes('zentride') || host.includes('lentride');
  const storedUser = localStorage.getItem('slate_cached_user') || localStorage.getItem('base44_user');
  const hasZentride = (storedUser || '').toLowerCase().includes('zentride') || (storedUser || '').toLowerCase().includes('lentride');
  return sub || hasZentride;
}

const SIZE_MAP = {
  sm: { dim: 16 },
  md: { dim: 24 },
  lg: { dim: 40 }
};

export function OrbitLoader({ size = 'md', className = '', label = 'Loading' }) {
  const { dim } = SIZE_MAP[size] || SIZE_MAP['md'];
  const isZentride = isZentrideActive();

  if (isZentride) {
    return (
      <span
        role="status"
        aria-label={label}
        className={`orbit-loader orbit-loader--${size} ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: dim, height: dim }}
      >
        <img 
          src="/zentride-favicon.svg" 
          alt={label} 
          style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} 
        />
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={`orbit-loader orbit-loader--${size} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: dim, height: dim }}
    >
      <img 
        src={JCL_LOGO_BASE64} 
        alt={label} 
        style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} 
      />
    </span>
  );
}

export function LoadingOverlay({ visible, size = 'md', label = 'Loading', blur = false }) {
  if (!visible) return null;
  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className="loading-overlay"
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: blur ? 'rgba(var(--background-rgb, 255,255,255), 0.7)' : 'rgba(var(--background-rgb, 255,255,255), 0.5)',
        backdropFilter: blur ? 'blur(2px)' : 'none',
        borderRadius: 'inherit',
        zIndex: 10,
        animation: 'overlay-fade-in 150ms ease',
      }}
    >
      <OrbitLoader size={size} label={label} />
    </div>
  );
}

export function PageLoader({ label = 'Loading...' }) {
  const isZentride = isZentrideActive();

  if (isZentride) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 dark:bg-[#070B14]/95 backdrop-blur-md font-sans select-none animate-in fade-in duration-200"
        role="status"
        aria-live="polite"
      >
        <div className="absolute w-72 h-72 rounded-full bg-[#F0709B]/15 dark:bg-primary/15 blur-3xl pointer-events-none animate-pulse" />
        <div className="relative z-10 flex flex-col items-center p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-lg p-2.5 flex items-center justify-center mb-5 border border-slate-200">
            <img src="/zentride-favicon.svg" alt="Zentride" className="w-9 h-9 object-contain" />
          </div>
          <div className="space-y-1 flex flex-col items-center">
            <img src="/zentride-logo.svg" alt="Zentride" className="h-8 w-auto object-contain max-w-[180px] drop-shadow-sm dark:hidden" />
            <img src="/zentride-logo-white.svg" alt="Zentride" className="h-8 w-auto object-contain max-w-[180px] drop-shadow-sm hidden dark:block" />
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F0709B] animate-ping" />
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">{label}</p>
            </div>
          </div>
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-5 relative">
            <div className="absolute inset-y-0 bg-[#F0709B] rounded-full animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className="bg-[#0B1418] text-white"
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        animation: 'overlay-fade-in 200ms ease',
      }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        animation: 'fade-up 500ms ease 100ms both',
      }}>
        {/* Crisp Base64 Logo */}
        <div style={{
          width: '76px', height: '76px',
          marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '8px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
        }}>
          <img 
            src={JCL_LOGO_BASE64} 
            alt="JCL Office" 
            style={{ 
              width: '100%', height: '100%', objectFit: 'contain',
              animation: 'logo-breathe 2.5s ease-in-out infinite' 
            }} 
          />
        </div>
      </div>

      <style>{`
        @keyframes logo-breathe {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes overlay-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
