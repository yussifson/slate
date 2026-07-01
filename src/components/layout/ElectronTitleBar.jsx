import { useState, useEffect, useCallback } from 'react';
import { Minus, Maximize2, Minimize2, X } from 'lucide-react';

// Only renders when running inside Electron
const isElectron = typeof window !== 'undefined' && !!window.electronWindow;

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
    // Poll every 300ms for maximize state changes
    const interval = setInterval(checkMaximized, 300);
    return () => clearInterval(interval);
  }, [checkMaximized]);

  if (!isElectron) return null;

  return (
    <div
      className="electron-titlebar"
      style={{
        // Make the bar draggable so the user can move the window
        WebkitAppRegion: 'drag',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '40px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '1px solid rgba(16,185,129,0.2)',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
        zIndex: 9999,
      }}
    >
      {/* Left: Icon + App Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '14px' }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #34D399, #10B981, #047857)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            background: 'white',
            borderRadius: '2px',
            transform: 'rotate(45deg)',
          }} />
        </div>
        <span style={{
          color: 'white',
          fontWeight: '700',
          fontSize: '13px',
          letterSpacing: '-0.01em',
        }}>Slate</span>
        <span style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: '11px',
          fontWeight: '400',
          letterSpacing: '0.05em',
        }}>by Optavel</span>
      </div>

      {/* Center: Window Title */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '11px',
        fontWeight: '500',
        letterSpacing: '0.04em',
      }}>
        The AI-Powered Workspace
      </div>

      {/* Right: Window Controls — not draggable */}
      <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' }}>
        {/* Minimize */}
        <button
          onClick={() => window.electronWindow.minimize()}
          title="Minimize"
          style={{
            width: '46px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <Minus size={14} />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => { window.electronWindow.maximize(); setTimeout(checkMaximized, 100); }}
          title={isMaximized ? 'Restore' : 'Maximize'}
          style={{
            width: '46px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* Close */}
        <button
          onClick={() => window.electronWindow.close()}
          title="Close"
          style={{
            width: '46px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            borderRadius: '0',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
