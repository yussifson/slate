import React from 'react';
import JCL_LOGO_BASE64 from '@/assets/jclLogoBase64';

const SIZE_MAP = {
  sm: { dim: 16 },
  md: { dim: 24 },
  lg: { dim: 40 }
};

export function OrbitLoader({ size = 'md', className = '', label = 'Loading' }) {
  const { dim } = SIZE_MAP[size] || SIZE_MAP['md'];

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
