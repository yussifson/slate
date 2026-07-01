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

export function PageLoader({ label = 'Loading Slate' }) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '0',
        background: 'linear-gradient(135deg, #0a0f1c 0%, #0f1f14 50%, #0a0f1c 100%)',
        zIndex: 9999,
        overflow: 'hidden',
        animation: 'overlay-fade-in 200ms ease',
      }}
    >
      {/* Ambient glow background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16,185,129,0.12) 0%, transparent 70%)',
      }} />

      {/* Animated rings */}
      <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '32px' }}>
        {/* Outer pulse ring */}
        <div style={{
          position: 'absolute', inset: '-16px',
          borderRadius: '50%',
          border: '1px solid rgba(16,185,129,0.15)',
          animation: 'pulse-ring 2.4s ease-in-out infinite',
        }} />
        {/* Middle ring */}
        <div style={{
          position: 'absolute', inset: '-6px',
          borderRadius: '50%',
          border: '1px solid rgba(16,185,129,0.25)',
          animation: 'pulse-ring 2.4s ease-in-out 0.4s infinite',
        }} />
        {/* Logo container */}
        <div style={{
          width: '120px', height: '120px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #047857 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 40px rgba(16,185,129,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset',
          animation: 'logo-breathe 3s ease-in-out infinite',
        }}>
          {/* Exact Slate SVG icon — two overlapping slates */}
          <svg width="72" height="72" viewBox="0 0 256 256" fill="none">
            <g transform="translate(128, 128) scale(1.45) rotate(-15) translate(-128, -128)">
              <rect x="64" y="72" width="96" height="128" rx="24" fill="rgba(0,0,0,0.3)" />
              <rect x="96" y="56" width="96" height="128" rx="24" fill="white" />
              <rect x="98" y="58" width="92" height="124" rx="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            </g>
          </svg>
        </div>
      </div>

      {/* App name */}
      <div style={{
        fontSize: '28px', fontWeight: '800',
        color: 'white',
        letterSpacing: '-0.03em',
        marginBottom: '8px',
        animation: 'fade-up 500ms ease 200ms both',
      }}>
        Slate
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: '12px', fontWeight: '500',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '40px',
        animation: 'fade-up 500ms ease 350ms both',
      }}>
        by Optavel
      </div>

      {/* Animated progress bar */}
      <div style={{
        width: '180px', height: '3px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '99px',
        overflow: 'hidden',
        animation: 'fade-up 500ms ease 450ms both',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #34D399, #10B981)',
          borderRadius: '99px',
          animation: 'progress-slide 1.8s ease-in-out infinite',
        }} />
      </div>

      {/* Loading text */}
      <div style={{
        marginTop: '16px',
        fontSize: '11px', fontWeight: '500',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        animation: 'fade-up 500ms ease 500ms both',
      }}>
        {label}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0; }
        }
        @keyframes logo-breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 40px rgba(16,185,129,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset; }
          50% { transform: scale(1.03); box-shadow: 0 12px 56px rgba(16,185,129,0.6), 0 0 0 1px rgba(255,255,255,0.12) inset; }
        }
        @keyframes progress-slide {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 75%; margin-left: 0%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
