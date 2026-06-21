import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Search, Download, ChevronRight, Sparkles, Filter, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

const levelColors = ['#94a3b8', '#cbd5e1', '#fcd34d', '#60a5fa', '#34d399', '#c084fc'];
const levelLabels = ['None', 'Novice', 'Developing', 'Proficient', 'Advanced', 'Master'];

export default function VCompetencyTracking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('heatmap');
  const [selectedDomain, setSelectedDomain] = useState(null);

  useEffect(() => {
    if (!user?.company_id) return;
    (async () => {
      setLoading(true);
      try {
        const [comp, tr] = await Promise.all([
          base44.getEntities('voc_competency', user.company_id),
          base44.getEntities('voc_trainee', user.company_id),
        ]);
        setCompetencies(comp);
        setTrainees(tr);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  // Framework tree structure
  const domains = [
    { name: 'SAFETY & COMPLIANCE', code: 'SAFE', competencies: [
      { code: 'SAFE-001', name: 'PPE Selection' }, { code: 'SAFE-002', name: 'PPE Maintenance' },
      { code: 'SAFE-003', name: 'Hazard Identification' }, { code: 'SAFE-004', name: 'Emergency Procedures' }
    ]},
    { name: 'CORE WELDING SKILLS', code: 'WELD', competencies: [
      { code: 'WELD-001', name: 'MIG Welding' }, { code: 'WELD-002', name: 'TIG Welding' },
      { code: 'WELD-003', name: 'Arc Welding' }, { code: 'WELD-004', name: 'Oxy-Acetylene' }
    ]},
    { name: 'FABRICATION & MEASUREMENT', code: 'FAB', competencies: [
      { code: 'FAB-001', name: 'Blueprint Reading' }, { code: 'FAB-002', name: 'Precision Measurement' },
      { code: 'FAB-003', name: 'Metal Cutting' }
    ]},
    { name: 'ELECTRICAL SYSTEMS', code: 'ELEC', competencies: [
      { code: 'ELEC-001', name: 'DC Theory' }, { code: 'ELEC-002', name: 'AC Theory' },
      { code: 'ELEC-003', name: 'Wiring Installation' }
    ]},
  ];

  const allCompetencies = domains.flatMap(d => d.competencies);
  const traineeNames = trainees.length > 0 ? trainees.map(t => t.title || 'Trainee') : ['Boateng', 'Mensah', 'Owusu', 'Ali', 'Darko', 'Amoah', 'Asante', 'Kusi'];
  
  // Deterministic fallback generator for visual demo (avoid hydration mismatch)
  const getLevel = (ti, ci) => {
    return (ti * 7 + ci * 3) % 6;
  };

  const heatmapData = traineeNames.map((name, ti) =>
    allCompetencies.map((_, ci) => getLevel(ti, ci))
  );

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('competency_tracking', 'Competency Tracking')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {competencies.length} competency records • {trainees.length} trainees tracked
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            {['heatmap', 'framework'].map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${view === v ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5 text-[#71717a] dark:text-gray-400'}`}>
                {v}
              </button>
            ))}
          </div>
          <Button variant="outline" className="rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:bg-primary/5">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
            <Sparkles className="w-4 h-4 mr-2" /> Identify Gaps
          </Button>
        </div>
      </div>

      {/* ── HEATMAP VIEW ── */}
      {view === 'heatmap' && (
        <Card className="rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {/* Legend */}
          <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white tracking-[0.04em]">Cohort Competency Matrix</h2>
            <div className="flex flex-wrap items-center gap-4">
              {levelLabels.map((l, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm" style={{ background: levelColors[i] }} />
                  <span className="text-xs font-medium text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{i}={l}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider bg-card sticky left-0 z-10 border-b border-primary/10 text-[#71717a] dark:text-gray-400 tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" style={{ minWidth: 160 }}>Trainee</th>
                  {allCompetencies.map(c => (
                    <th key={c.code} className="px-2 py-4 text-center text-[10px] font-semibold uppercase tracking-wider border-b border-l border-primary/10 bg-primary/5 text-[#71717a] dark:text-gray-400 tracking-[0.04em]" style={{ minWidth: 60 }}>
                      <div className="truncate w-full max-w-[80px] mx-auto" title={c.name}>{c.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {traineeNames.map((name, ti) => (
                  <tr key={ti} className="hover:bg-primary/5 transition-colors group border-b border-primary/5 last:border-0">
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white sticky left-0 bg-card border-r border-primary/10 z-10 group-hover:bg-primary/5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{name}</td>
                    {heatmapData[ti].map((level, ci) => (
                      <td key={ci} className="px-2 py-3 text-center border-l border-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" title={`${name} — ${allCompetencies[ci].name}: Level ${level} (${levelLabels[level]})`}>
                        <div className="w-8 h-8 rounded-xl mx-auto flex items-center justify-center text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm tracking-[0.04em]"
                          style={{ background: levelColors[level], color: level > 1 ? '#000' : '#fff' }}>
                          {level}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── FRAMEWORK VIEW ── */}
      {view === 'framework' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden h-[calc(100vh-250px)] flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="px-6 py-4 border-b border-primary/10 bg-primary/5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white tracking-[0.04em]">Competency Framework</h2>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {domains.map((d, di) => (
                <div key={di} className="mb-2">
                  <button onClick={() => setSelectedDomain(selectedDomain === di ? null : di)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${selectedDomain === di ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5 text-foreground'}`}>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedDomain === di ? 'rotate-90' : ''}`} />
                    <span className="text-sm font-semibold uppercase tracking-wider flex-1 tracking-[0.04em]">{d.name}</span>
                    <Badge variant="outline" className="border-primary/40 bg-card text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{d.competencies.length}</Badge>
                  </button>
                  {selectedDomain === di && (
                    <div className="pl-6 pr-2 py-2 space-y-1">
                      {d.competencies.map((c, ci) => (
                        <div key={ci} className="px-4 py-2 rounded-xl text-sm text-[#71717a] dark:text-gray-400 hover:text-primary hover:bg-primary/5 cursor-pointer transition-colors flex items-center gap-3">
                          <span className="text-xs font-mono font-semibold opacity-70 tracking-[0.04em]">[{c.code}]</span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-8 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden h-[calc(100vh-250px)] flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="px-6 py-4 border-b border-primary/10 bg-primary/5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white tracking-[0.04em]">
                {selectedDomain !== null ? domains[selectedDomain].name : 'Select a Domain'}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              {selectedDomain !== null ? (
                <div className="space-y-4">
                  {domains[selectedDomain].competencies.map((c, ci) => (
                    <div key={ci} className="p-5 rounded-2xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 transition-all hover:border-primary/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline" className="font-mono bg-card border-primary/40 text-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{c.code}</Badge>
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">{c.name}</span>
                      </div>
                      <p className="text-sm text-[#71717a] dark:text-gray-400 mb-4">Demonstrates competency in {c.name.toLowerCase()} techniques and safety procedures.</p>
                      
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Progression Levels</div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {levelLabels.slice(1).map((l, li) => (
                            <div key={li} className="p-2 rounded-xl text-center border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" style={{ borderTop: `3px solid ${levelColors[li + 1]}` }}>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white tracking-[0.04em]">{l}</div>
                              <div className="text-[10px] text-[#71717a] dark:text-gray-400 mt-1">Level {li + 1}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400">
                  <BarChart3 className="w-16 h-16 opacity-20 mb-4 text-primary" />
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">No Domain Selected</p>
                  <p className="text-sm">Select a domain from the left panel to view its competencies.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
