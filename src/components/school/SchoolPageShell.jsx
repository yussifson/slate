import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

/**
 * SchoolPageShell — Premium shared wrapper for all school management pages.
 * Provides consistent dotted-grid background, header, breadcrumb, and animations.
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
      className="min-h-screen text-foreground font-sans"
      style={{
        backgroundColor: 'hsl(var(--background))',
        backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.07) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Top breadcrumb bar */}
      <div
        className="sticky top-0 z-10 border-b px-8 py-3 flex items-center gap-2 text-sm backdrop-blur-md"
        style={{
          backgroundColor: 'hsl(var(--card) / 0.85)',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
            <span
              className={
                i === breadcrumb.length - 1
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer transition-colors'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Main content area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-[1400px] mx-auto px-8 py-8"
      >
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight text-foreground"
              style={{ letterSpacing: '-0.02em' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>
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
