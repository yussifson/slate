import React from 'react';
import { GraduationCap, Trophy, Globe2, Briefcase, Landmark, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const colors = ["#1A73E8", "#10b981", "#f59e0b", "#6366f1"];

const defaultHonorsDistribution = [
  { name: 'First Class Honors', value: 120 },
  { name: 'Second Class (Upper)', value: 450 },
  { name: 'Second Class (Lower)', value: 320 },
  { name: 'Pass', value: 90 },
];

export default function UniGraduationStats() {
  const stats = [
    { label: 'Total Alumni', value: '12,480', icon: GraduationCap, color: 'var(--color-module-orbit)' },
    { label: 'Employment Rate', value: '94.2%', icon: Briefcase, color: 'var(--color-success)' },
    { label: 'Higher Education', value: '18.5%', icon: Globe2, color: 'var(--color-warning)' },
    { label: 'Degrees Verified', value: '100%', icon: ShieldCheck, color: 'var(--color-info)' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-[var(--color-border-subtle)] pb-4">
        <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Graduation & Alumni Statistics</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Yearly graduation rates, student degree classifications, and post-graduation outcomes.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">{stat.label}</p>
                <h3 className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mt-1 tracking-tight">{stat.value}</h3>
              </div>
              <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm col-span-1">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Class Honors Distribution</h2>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Degree class ratios for the graduating cohort.</p>
          <div className="flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defaultHonorsDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {defaultHonorsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-0)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2 mt-4 text-[var(--text-xs)] font-semibold text-[var(--color-text-primary)]">
              {defaultHonorsDistribution.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-[var(--color-surface-1)] rounded-[var(--radius-md)]">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-[var(--radius-sm)]" style={{ backgroundColor: colors[i % colors.length] }} />
                    {h.name}
                  </span>
                  <span>{h.value} Graduates</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-[var(--color-warning)]" /> Post-Graduation Employment Sectors
          </h2>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Top destination domains for university alumni.</p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[var(--text-sm)] font-semibold mb-1 text-[var(--color-text-primary)]">
                <span>Technology & Software Engineering</span>
                <span>38%</span>
              </div>
              <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--color-module-orbit)] h-full rounded-full" style={{ width: '38%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[var(--text-sm)] font-semibold mb-1 text-[var(--color-text-primary)]">
                <span>Finance & Investment Banking</span>
                <span>24%</span>
              </div>
              <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--color-success)] h-full rounded-full" style={{ width: '24%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[var(--text-sm)] font-semibold mb-1 text-[var(--color-text-primary)]">
                <span>Healthcare & Medical Research</span>
                <span>18%</span>
              </div>
              <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--color-info)] h-full rounded-full" style={{ width: '18%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[var(--text-sm)] font-semibold mb-1 text-[var(--color-text-primary)]">
                <span>Government & Public Policy</span>
                <span>12%</span>
              </div>
              <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
