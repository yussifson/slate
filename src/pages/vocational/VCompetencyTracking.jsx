import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Search, Download, ChevronRight, Sparkles, Filter, BarChart3 } from 'lucide-react';

const F = { display: "'Barlow Condensed', sans-serif", body: "'IBM Plex Sans', sans-serif", mono: "'IBM Plex Mono', monospace", label: "'Barlow Semi Condensed', sans-serif" };
const C = { forge: '#0D1117', carbon: '#161B22', steel: '#21262D', galv: '#30363D', alloy: '#484F58', chrome: '#8B949E', titanium: '#C9D1D9', white: '#F0F6FC', volt: '#F6C90E', plasma: '#FF6B2C', signal: '#00C896', circuit: '#4493F8', arc: '#BF8FFF' };
const levelColors = ['#484F58', '#484F58', '#F6C90E', '#4493F8', '#00C896', '#BF8FFF'];
const levelLabels = ['None', 'Novice', 'Developing', 'Proficient', 'Advanced', 'Master'];

export default function VCompetencyTracking() {
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
  
  // Generate heatmap data
  const heatmapData = traineeNames.map((name, ti) =>
    allCompetencies.map((_, ci) => Math.floor(Math.random() * 6))
  );

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] p-4 md:p-6" style={{ fontFamily: F.body }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#F0F6FC]" style={{ fontFamily: F.display }}>COMPETENCY TRACKING</h1>
          <p className="text-[13px] text-[#8B949E] mt-0.5" style={{ fontFamily: F.mono }}>{competencies.length} competency records · {trainees.length} trainees tracked</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-[#161B22] border border-[#30363D]">
            {['heatmap', 'framework', 'analytics'].map(v => (
              <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                style={{ fontFamily: F.label, background: view === v ? `${C.volt}15` : 'transparent', color: view === v ? C.volt : C.chrome }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="px-3 py-1.5 bg-[#161B22] border border-[#30363D] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#21262D] transition-colors flex items-center gap-1.5" style={{ fontFamily: F.label, color: C.chrome }}><Download className="w-3.5 h-3.5" /> Export</button>
          <button className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90" style={{ fontFamily: F.label, background: C.arc, color: '#fff' }}>
            <Sparkles className="w-3.5 h-3.5" /> Identify Gaps
          </button>
        </div>
      </div>

      {/* ── HEATMAP VIEW ── */}
      {view === 'heatmap' && (
        <div className="bg-[#161B22] border border-[#30363D] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
          {/* Legend */}
          <div className="px-4 py-3 border-b border-[#30363D] flex items-center justify-between bg-[#0D1117]/60">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC]" style={{ fontFamily: F.label }}>Cohort Competency Matrix</h2>
            <div className="flex items-center gap-3">
              {levelLabels.map((l, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ background: levelColors[i] }} />
                  <span className="text-[9px] text-[#484F58]" style={{ fontFamily: F.label }}>{i}={l}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider bg-[#0D1117] sticky left-0 z-10 border-b border-[#30363D]" style={{ fontFamily: F.label, color: C.alloy, minWidth: 120 }}>Trainee</th>
                  {allCompetencies.map(c => (
                    <th key={c.code} className="px-1 py-2 text-center text-[8px] font-semibold uppercase tracking-wider border-b border-l border-[#21262D] bg-[#0D1117]" style={{ fontFamily: F.label, color: C.alloy, minWidth: 50 }}>
                      <div className="truncate">{c.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {traineeNames.map((name, ti) => (
                  <tr key={ti} className="hover:bg-[#21262D]/30 transition-colors">
                    <td className="px-4 py-2 text-[12px] font-medium text-[#F0F6FC] sticky left-0 bg-[#161B22] border-b border-[#21262D] z-10">{name}</td>
                    {heatmapData[ti].map((level, ci) => (
                      <td key={ci} className="px-1 py-2 text-center border-b border-l border-[#21262D]/50 cursor-pointer hover:ring-1 hover:ring-[#F6C90E] transition-all" title={`${name} — ${allCompetencies[ci].name}: Level ${level} (${levelLabels[level]})`}>
                        <div className="w-7 h-7 rounded-sm mx-auto flex items-center justify-center text-[11px] font-bold transition-transform hover:scale-110"
                          style={{ background: `${levelColors[level]}25`, color: levelColors[level] }}>
                          {level}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FRAMEWORK VIEW ── */}
      {view === 'framework' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-[#161B22] border border-[#30363D]">
            <div className="px-4 py-3 border-b border-[#30363D] bg-[#0D1117]/60">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC]" style={{ fontFamily: F.label }}>Competency Framework</h2>
            </div>
            <div className="p-3">
              {domains.map((d, di) => (
                <div key={di} className="mb-2">
                  <button onClick={() => setSelectedDomain(selectedDomain === di ? null : di)}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#21262D] transition-colors"
                    style={{ background: selectedDomain === di ? C.steel : 'transparent' }}>
                    <ChevronRight className="w-3 h-3 text-[#484F58] transition-transform" style={{ transform: selectedDomain === di ? 'rotate(90deg)' : '' }} />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#F0F6FC]" style={{ fontFamily: F.label }}>{d.name}</span>
                    <span className="ml-auto text-[10px] text-[#484F58] font-mono">{d.competencies.length}</span>
                  </button>
                  {selectedDomain === di && d.competencies.map((c, ci) => (
                    <div key={ci} className="pl-8 pr-3 py-2 text-[12px] text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#21262D]/50 cursor-pointer transition-colors flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#484F58]">[{c.code}]</span>
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#161B22] border border-[#30363D]">
            <div className="px-4 py-3 border-b border-[#30363D] bg-[#0D1117]/60">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC]" style={{ fontFamily: F.label }}>
                {selectedDomain !== null ? domains[selectedDomain].name : 'Select a Domain'}
              </h2>
            </div>
            <div className="p-4">
              {selectedDomain !== null ? (
                <div className="space-y-4">
                  {domains[selectedDomain].competencies.map((c, ci) => (
                    <div key={ci} className="p-4 bg-[#0D1117] border border-[#21262D]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#21262D] text-[#8B949E]">{c.code}</span>
                        <span className="text-[14px] font-semibold text-[#F0F6FC]">{c.name}</span>
                      </div>
                      <p className="text-[12px] text-[#8B949E] mb-3">Demonstrates competency in {c.name.toLowerCase()} techniques and safety procedures.</p>
                      <div className="flex gap-1">
                        {levelLabels.slice(1).map((l, li) => (
                          <div key={li} className="flex-1 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wider" style={{ fontFamily: F.label, background: `${levelColors[li + 1]}15`, color: levelColors[li + 1] }}>{l}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-[#484F58]">Select a domain from the framework tree to view competency details.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS VIEW ── */}
      {view === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domains.map((d, di) => (
            <div key={di} className="bg-[#161B22] border border-[#30363D] p-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC] mb-4" style={{ fontFamily: F.label }}>{d.name}</h3>
              {d.competencies.map((c, ci) => {
                const avg = (Math.random() * 3 + 1.5).toFixed(1);
                const pct = (parseFloat(avg) / 5) * 100;
                return (
                  <div key={ci} className="flex items-center gap-3 mb-2.5">
                    <span className="w-28 text-[11px] text-[#8B949E] truncate">{c.name}</span>
                    <div className="flex-1 h-2 bg-[#0D1117] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 70 ? C.signal : pct > 40 ? C.volt : C.plasma }} />
                    </div>
                    <span className="w-8 text-right text-[12px] font-bold" style={{ fontFamily: F.display, color: pct > 70 ? C.signal : pct > 40 ? C.volt : C.plasma }}>{avg}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
