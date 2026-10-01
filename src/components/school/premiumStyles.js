/**
 * Premium card styles shared across all school management pages.
 * These inline styles create the realistic, multi-layered shadow depth
 * seen in premium SaaS products like Linear, Vercel, and ChronoTask.
 */

/* ── Stat Card ── */
export const statCardStyle = {
  backgroundColor: 'hsl(var(--card))',
  borderRadius: '16px',
  border: '1px solid hsl(var(--border) / 0.35)',
  padding: '24px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)',
  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
};

export const statCardHoverStyle = {
  boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
  transform: 'translateY(-1px)',
};

/* ── Table Container ── */
export const tableContainerStyle = {
  backgroundColor: 'hsl(var(--card))',
  borderRadius: '16px',
  border: '1px solid hsl(var(--border) / 0.35)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)',
  overflow: 'hidden',
};

/* ── Filter Bar ── */
export const filterBarStyle = {
  backgroundColor: 'hsl(var(--card))',
  borderRadius: '14px',
  border: '1px solid hsl(var(--border) / 0.35)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.03)',
  padding: '14px 18px',
};

/* ── Icon Badge ── */
export function iconBadgeStyle(bgColor) {
  return {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: bgColor,
  };
}

/* ── Color Palette for Stat Cards ── */
export const STAT_COLORS = {
  blue:   { bg: 'rgba(99, 102, 241, 0.08)',  icon: '#6366f1', label: '#6366f1' },
  green:  { bg: 'rgba(16, 185, 129, 0.08)',  icon: '#10b981', label: '#10b981' },
  orange: { bg: 'rgba(245, 158, 11, 0.08)',  icon: '#f59e0b', label: '#f59e0b' },
  sky:    { bg: 'rgba(14, 165, 233, 0.08)',  icon: '#fad503', label: '#fad503' },
  rose:   { bg: 'rgba(244, 63, 94, 0.08)',   icon: '#f43f5e', label: '#f43f5e' },
  violet: { bg: 'rgba(139, 92, 246, 0.08)',  icon: '#8b5cf6', label: '#8b5cf6' },
  teal:   { bg: 'rgba(20, 184, 166, 0.08)',  icon: '#14b8a6', label: '#14b8a6' },
  amber:  { bg: 'rgba(217, 119, 6, 0.08)',   icon: '#d97706', label: '#d97706' },
};

/* ── Premium "Add" Button ── */
export const addButtonStyle = {
  borderRadius: '12px',
  height: '42px',
  padding: '0 20px',
  fontSize: '14px',
  fontWeight: '600',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  transition: 'all 0.2s ease',
};

/* ── Table Header ── */
export const tableHeaderStyle = {
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--muted-foreground) / 0.7)',
  padding: '14px 20px',
  borderBottom: '1px solid hsl(var(--border) / 0.3)',
  backgroundColor: 'hsl(var(--muted) / 0.25)',
};

/* ── Table Cell ── */
export const tableCellStyle = {
  padding: '16px 20px',
  fontSize: '14px',
};

/* ── Status Badge ── */
export function statusBadgeStyle(isActive) {
  if (isActive) {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      color: '#10b981',
    };
  }
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    color: '#f43f5e',
  };
}
