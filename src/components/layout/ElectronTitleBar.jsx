import { useState, useEffect, useCallback } from 'react';
import { Minus, Maximize2, Minimize2, X } from 'lucide-react';

// Show when actually inside Electron app OR when running in electron dev mode
const isElectron = (typeof window !== 'undefined' && !!window.electronWindow)
  || import.meta.env.MODE === 'electron';

export default function ElectronTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  const checkMaximized = useCallback(async () => {
    if (window.electronWindow?.isMaximized) {
      const val = await window.electronWindow.isMaximized();
      setIsMaximized(val);
    }
  }, []);

  useEffect(() => {
    if (!isElectron) return;
    checkMaximized();
    const interval = setInterval(checkMaximized, 300);
    return () => clearInterval(interval);
  }, [checkMaximized]);

  if (!isElectron) return null;

  const safeCall = (fn) => () => { if (window.electronWindow) fn(); };

  return (
    <div
      style={{
        WebkitAppRegion: 'drag',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '40px',
        // Slate primary emerald green gradient
        background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #047857 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.15)',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
        zIndex: 9999,
        boxShadow: '0 1px 8px rgba(5,150,105,0.35)',
      }}
    >
      {/* Left: Exact Slate SVG Icon + App Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', paddingLeft: '14px' }}>
        {/* This exactly matches the slate-logo.svg — two overlapping slates */}
        <svg width="22" height="22" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="tb-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.25" />
            </filter>
          </defs>
          <g transform="translate(128, 128) scale(1.45) rotate(-15) translate(-128, -128)">
            {/* Back slate — dark */}
            <rect x="64" y="72" width="96" height="128" rx="24" fill="rgba(0,0,0,0.35)" />
            {/* Front slate — white */}
            <rect x="96" y="56" width="96" height="128" rx="24" fill="white" filter="url(#tb-shadow)" />
            {/* Highlight */}
            <rect x="98" y="58" width="92" height="124" rx="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          </g>
        </svg>

        <span style={{
          color: 'white',
          fontWeight: '700',
          fontSize: '13px',
          letterSpacing: '-0.01em',
          textShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}>Slate</span>

        <span style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: '11px',
          fontWeight: '400',
          letterSpacing: '0.04em',
        }}>by Optavel</span>
      </div>

      {/* Center: Subtitle */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '11px',
        fontWeight: '500',
        letterSpacing: '0.04em',
        pointerEvents: 'none',
      }}>
        The AI-Powered Workspace
      </div>

      {/* Right: Window Controls */}
      <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' }}>
        {/* Minimize */}
        <button
          onClick={safeCall(() => window.electronWindow.minimize())}
          title="Minimize"
          style={{
            width: '46px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        >
          <Minus size={14} />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => { safeCall(() => window.electronWindow.maximize())(); setTimeout(checkMaximized, 100); }}
          title={isMaximized ? 'Restore' : 'Maximize'}
          style={{
            width: '46px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        >
          {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* Close */}
        <button
          onClick={safeCall(() => window.electronWindow.close())}
          title="Close"
          style={{
            width: '46px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
