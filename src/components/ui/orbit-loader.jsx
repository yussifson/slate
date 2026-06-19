import React from 'react'

const SIZE_MAP = {
  sm: { dim: 16, stroke: 1.5, r: 6 },
  md: { dim: 24, stroke: 2,   r: 9 },
  lg: { dim: 40, stroke: 2.5, r: 16 }}

export function OrbitLoader({
  size = 'md',
  className = '',
  label = 'Loading',
  color}) {
  const { dim, stroke, r } = SIZE_MAP[size]
  const cx = dim / 2
  const cy = dim / 2
  const circumference = 2 * Math.PI * r
  const arcLength = circumference * 0.25   // 25% arc
  const gapLength = circumference * 0.75   // 75% gap

  return (
    <span
      role="status"
      aria-label={label}
      className={`orbit-loader orbit-loader--${size} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        fill="none"
        aria-hidden="true"
      >
        {/* Track — full ring, low opacity */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color || 'hsl(var(--primary))'}
          strokeWidth={stroke}
          opacity={0.15}
        />
        {/* Arc — the rotating segment */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
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

export function LoadingOverlay({
  visible,
  size = 'md',
  label = 'Loading',
  blur = false}) {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className="loading-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: blur
          ? 'rgba(var(--background-rgb, 255,255,255), 0.7)'
          : 'rgba(var(--background-rgb, 255,255,255), 0.5)',
        backdropFilter: blur ? 'blur(2px)' : 'none',
        borderRadius: 'inherit',
        zIndex: 10,
        animation: 'overlay-fade-in 150ms ease'}}
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
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: 'hsl(var(--background))',
        zIndex: 9999,
        animation: 'overlay-fade-in 200ms ease'}}
    >
      <OrbitLoader size="lg" label={label} />
      <span
        style={{
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'hsl(var(--muted-foreground))',
          animation: 'page-loader-text 600ms ease 300ms both'}}
      >
        {label}
      </span>
    </div>
  )
}
