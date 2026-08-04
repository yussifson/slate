import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

/**
 * SchoolPageShell — Premium shared wrapper for all school management pages.
 * Provides consistent light gray background, header, breadcrumb, and animations.
 *
 * Props:
 *  - title: string — Page title (e.g. "Teachers")
 *  - subtitle: string — Subtitle (e.g. "Manage staff directory")
 *  - breadcrumb: string[] — e.g. ["School", "Teachers"]
 *  - actions: ReactNode — Buttons to render in the top-right
 *  - children: ReactNode — Page body content
 */
export default function SchoolPageShell({ title, subtitle, breadcrumb = [], actions, children }) {
  return (
    <div
      className="min-h-screen text-foreground"
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      {/* Top breadcrumb bar */}
      <div
        className="sticky top-0 z-10 border-b px-6 lg:px-10 py-3 flex items-center gap-2 text-[13px]"
        style={{
          backgroundColor: 'hsl(var(--card) / 0.92)',
          borderColor: 'hsl(var(--border) / 0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
            <span
              className={
                i === breadcrumb.length - 1
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground/70 hover:text-foreground cursor-pointer transition-colors'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Main content area */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 lg:py-10"
      >
        {/* Page Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1
              className="text-[28px] lg:text-[32px] font-bold text-foreground"
              style={{ letterSpacing: '-0.025em', lineHeight: '1.2' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground/70 mt-2 text-[15px]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        {/* Page Body */}
        {children}
      </motion.div>
    </div>
  );
}
