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
        height: '32px',
        // Slate primary vibrant orange
        background: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #c2410c 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.2)',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
        zIndex: 9999,
        boxShadow: '0 1px 6px rgba(234,88,12,0.5)',
      }}
    >
      {/* Left: Exact Slate PNG Icon + App Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', paddingLeft: '14px' }}>
        <img 
          src="/slate-logo.png" 
          alt="Slate" 
          style={{ 
            width: '20px', 
            height: '20px', 
            objectFit: 'contain',
            opacity: 1
          }} 
        />

        <span style={{
          color: 'white',
          fontWeight: '700',
          fontSize: '13px',
          letterSpacing: '-0.01em',
          textShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}>Slate</span>

        <span style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '11px',
          fontWeight: '500',
          letterSpacing: '0.04em',
        }}>by Optavel</span>
      </div>

      {/* Center: Subtitle */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.04em',
        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
        pointerEvents: 'none',
      }}>
        Work Made Effortlessly with Agentic AI
      </div>

      {/* Right: Window Controls */}
      <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' }}>
        {/* Minimize */}
        <button
          onClick={safeCall(() => window.electronWindow.minimize())}
          title="Minimize"
          style={{
            width: '46px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#ffffff', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
        >
          <Minus size={14} />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => { safeCall(() => window.electronWindow.maximize())(); setTimeout(checkMaximized, 100); }}
          title={isMaximized ? 'Restore' : 'Maximize'}
          style={{
            width: '46px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#ffffff', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
        >
          {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* Close */}
        <button
          onClick={safeCall(() => window.electronWindow.close())}
          title="Close"
          style={{
            width: '46px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#ffffff', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
