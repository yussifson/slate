import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, BarChart, LineChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, DonutChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';

/**
 * DASHBOARD METRIC CARD
 * Displays a single KPI with icon, value, and optional trend
 */
export function DashboardMetricCard({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  iconBg = 'bg-blue-50 dark:bg-blue-950/20',
  iconColor = 'text-blue-600',
  trend, 
  subtitle,
  onClick,
  className = ''
}) {
  return (
    <div className={`bg-card rounded-lg border-[0.5px] border-border p-6 hover:shadow-md transition-all duration-200 cursor-pointer card-enter ${className}`}
      onClick={onClick}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {trend.value}% {trend.label}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * DASHBOARD CHART CONTAINER
 * Standardized wrapper for all dashboard charts
 */
export function DashboardChartCard({ 
  title, 
  period = '7D', 
  onPeriodChange,
  periods = ['7D', '30D', '90D', '1Y'],
  children,
  className = ''
}) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  return (
    <div className={`bg-card rounded-lg border-[0.5px] border-border p-6 card-enter ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex gap-2">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedPeriod === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * RESPONSIVE AREA CHART
 */
export function DashboardAreaChart({ data, dataKey = 'value', color = '#10b981', showTooltip = true }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
        <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
        {showTooltip && <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />}
        <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill="url(#colorGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * RESPONSIVE BAR CHART
 */
export function DashboardBarChart({ data, dataKey = 'value', color = '#10b981', showLegend = false }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
        <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
        {showLegend && <Legend />}
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * RESPONSIVE LINE CHART
 */
export function DashboardLineChart({ data, dataKey = 'value', color = '#10b981' }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
        <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * INSIGHT ALERT CARD
 */
export function InsightAlertCard({ 
  severity = 'info', // 'critical', 'warning', 'positive', 'info'
  title, 
  message, 
  action,
  onDismiss,
  className = ''
}) {
  const severityColors = {
    critical: { border: 'border-l-4 border-red-500', bg: 'bg-red-50/50 dark:bg-red-950/10', text: 'text-red-700 dark:text-red-300' },
    warning: { border: 'border-l-4 border-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-950/10', text: 'text-amber-700 dark:text-amber-300' },
    positive: { border: 'border-l-4 border-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-950/10', text: 'text-emerald-700 dark:text-emerald-300' },
    info: { border: 'border-l-4 border-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-950/10', text: 'text-blue-700 dark:text-blue-300' }
  };

  const colors = severityColors[severity];

  return (
    <div className={`${colors.border} ${colors.bg} rounded-lg p-4 flex items-start justify-between gap-4 list-item-enter ${className}`}>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${colors.text}`}>{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
        {action && (
          <button className={`text-sm font-medium ${colors.text} hover:underline mt-2`}>
            {action}
          </button>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <span className="sr-only">Dismiss</span>
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}

/**
 * DATA TABLE CARD
 */
export function DataTableCard({ 
  title, 
  columns, 
  data, 
  onRowClick,
  className = ''
}) {
  return (
    <div className={`bg-card rounded-lg border-[0.5px] border-border p-6 card-enter ${className}`}>
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map(col => (
                <th key={col.key} className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer list-item-enter"
              >
                {columns.map(col => (
                  <td key={col.key} className="py-4 px-4 text-foreground">
                    {typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * METRIC GRID LAYOUT
 */
export function MetricGrid({ metrics, columns = 4, gap = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-${gap} zone-1 ${className}`}>
      {metrics.map((metric, idx) => (
        <div key={idx} style={{ animationDelay: `${idx * 60}ms` }}>
          <DashboardMetricCard {...metric} />
        </div>
      ))}
    </div>
  );
}

/**
 * EMPTY STATE
 */
export function DashboardEmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-12 h-12 text-muted-foreground/30 mb-4" />}
      <p className="text-lg font-semibold text-foreground mb-2">{title}</p>
      <p className="text-muted-foreground mb-6">{message}</p>
      {action && <button className="text-primary hover:underline text-sm font-medium">{action}</button>}
    </div>
  );
}

/**
 * SKELETON LOADER
 */
export function DashboardSkeleton({ count = 4, type = 'metric' }) {
  const skeletonItem = type === 'metric' ? (
    <div className="bg-card rounded-lg border-[0.5px] border-border p-6 skeleton-shimmer">
      <div className="h-4 bg-muted rounded w-1/3 mb-4" />
      <div className="h-8 bg-muted rounded w-1/2" />
    </div>
  ) : (
    <div className="bg-card rounded-lg border-[0.5px] border-border p-6 skeleton-shimmer">
      <div className="h-64 bg-muted rounded" />
    </div>
  );

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeletonItem}</div>
      ))}
    </div>
  );
}
