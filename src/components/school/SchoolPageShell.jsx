import { motion } from 'framer-motion';

/**
 * SchoolPageShell — Shared wrapper for school management pages.
 * Provides the dotted-grid background, clean title header, and smooth animations.
 */
export default function SchoolPageShell({ title, subtitle, actions, children }) {
  return (
    <div
      className="min-h-screen text-foreground font-sans bg-background"
      style={{
        backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.12) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Main content container */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 lg:py-10"
      >
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-2xl lg:text-3xl font-bold text-foreground"
              style={{ letterSpacing: '-0.025em' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
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
