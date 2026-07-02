import React from 'react'

const SIZE_MAP = {
  sm: { dim: 16, stroke: 1.5, r: 6 },
  md: { dim: 24, stroke: 2,   r: 9 },
  lg: { dim: 40, stroke: 2.5, r: 16 }
}

export function OrbitLoader({ size = 'md', className = '', label = 'Loading', color }) {
  const { dim, stroke, r } = SIZE_MAP[size]
  const cx = dim / 2
  const cy = dim / 2
  const circumference = 2 * Math.PI * r
  const arcLength = circumference * 0.25
  const gapLength = circumference * 0.75

  return (
    <span
      role="status"
      aria-label={label}
      className={`orbit-loader orbit-loader--${size} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} fill="none" aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} stroke={color || 'hsl(var(--primary))'} strokeWidth={stroke} opacity={0.15} />
        <circle
          cx={cx} cy={cy} r={r}
          stroke={color || 'hsl(var(--primary))'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gapLength}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
          className="orbit-loader__arc"
        />
      </svg>
    </span>
  )
}

export function LoadingOverlay({ visible, size = 'md', label = 'Loading', blur = false }) {
  if (!visible) return null
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
  )
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="bg-background text-foreground"
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
        {/* Exact Logo */}
        <div style={{
          width: '64px', height: '64px',
          marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img 
            src="/slate-logo.png" 
            alt="Slate Logo" 
            style={{ 
              width: '100%', height: '100%', objectFit: 'contain',
              animation: 'logo-breathe 2.5s ease-in-out infinite' 
            }} 
          />
        </div>

        {/* Minimalist Spinner */}
        <div style={{
          width: '24px', height: '24px',
          border: '2px solid rgba(16,185,129,0.15)',
          borderTopColor: '#10B981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />

        {/* Loading text */}
        <div style={{
          fontSize: '12px', fontWeight: '500',
          color: '#71717a',
          letterSpacing: '0.04em',
        }}>
          {label}
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes logo-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
  )
}
