import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Search, UserPlus, X, ChevronRight, Check, ChevronLeft, Users, Award, Calendar, Clock, Mail, Phone, MapPin, FileText, Upload, Camera, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';

const F = { display: "'Barlow Condensed', sans-serif", body: "'IBM Plex Sans', sans-serif", mono: "'IBM Plex Mono', monospace", label: "'Barlow Semi Condensed', sans-serif" };
const C = { forge: '#0D1117', carbon: '#161B22', steel: '#21262D', galv: '#30363D', alloy: '#484F58', chrome: '#8B949E', titanium: '#C9D1D9', white: '#F0F6FC', volt: '#F6C90E', plasma: '#FF6B2C', signal: '#00C896', circuit: '#4493F8', arc: '#BF8FFF' };

const StatusChip = ({ status }) => {
  const map = { Active: { bg: 'rgba(0,200,150,0.12)', color: C.signal }, 'On Placement': { bg: 'rgba(68,147,248,0.12)', color: C.circuit }, 'Assessment Due': { bg: 'rgba(246,201,14,0.12)', color: C.volt }, Suspended: { bg: 'rgba(255,107,44,0.12)', color: C.plasma }, Graduated: { bg: 'rgba(191,143,255,0.12)', color: C.arc }, Employed: { bg: 'rgba(0,200,150,0.12)', color: C.signal } };
  const s = map[status] || map.Active;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: F.label, background: s.bg, color: s.color }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{status || 'Active'}
  </span>;
};

const HexRadar = ({ skills = [] }) => {
  const defaults = [
    { label: 'Safety', val: 85 }, { label: 'Precision', val: 70 }, { label: 'Speed', val: 60 },
    { label: 'Theory', val: 75 }, { label: 'Practice', val: 90 }, { label: 'Teamwork', val: 65 }
  ];
  const data = skills.length >= 6 ? skills : defaults;
  const cx = 50, cy = 50, R = 38;
  const pts = (r) => data.map((_, i) => {
    const a = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  const dataPts = data.map((d, i) => {
    const a = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    const r = (d.val / 100) * R;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  const labelPts = data.map((d, i) => {
    const a = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    return { x: cx + (R + 10) * Math.cos(a), y: cy + (R + 10) * Math.sin(a), label: d.label };
  });

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full max-w-[240px]">
      {[1, 0.75, 0.5, 0.25].map(s => <polygon key={s} points={pts(R * s)} fill="none" stroke={C.galv} strokeWidth="0.5" opacity="0.6" />)}
      <polygon points={dataPts} fill={C.volt} fillOpacity="0.15" stroke={C.volt} strokeWidth="1.5" />
      <polygon points={dataPts} fill="none" stroke={C.volt} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
      {labelPts.map((p, i) => <text key={i} x={p.x} y={p.y} fontSize="3.5" fill={C.chrome} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: F.label }}>{p.label}</text>)}
      {data.map((d, i) => {
        const a = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const r = (d.val / 100) * R;
        return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r="1.5" fill={C.volt} />;
      })}
    </svg>
  );
};

export default function VTraineeProfiles() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [view, setView] = useState('table');
  const [selected, setSelected] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({});

  useEffect(() => {
    if (!user?.company_id) return;
    (async () => {
      setLoading(true);
      try { setTrainees(await base44.getEntities('voc_trainee', user.company_id)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = trainees.filter(t => {
    const matchSearch = !search || (t.title || '').toLowerCase().includes(search.toLowerCase()) || (t.case_number || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || (t.status || 'Active') === filterStatus;
    return matchSearch && matchStatus;
  });

  const statuses = ['All', 'Active', 'On Placement', 'Assessment Due', 'Suspended', 'Graduated', 'Employed'];
  const wizardSteps = ['Personal Info', 'Program Selection', 'Prerequisites', 'Schedule', 'Documents', 'Review'];

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] p-4 md:p-6" style={{ fontFamily: F.body }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          {view !== 'table' && <button onClick={() => { setView('table'); setSelected(null); setWizardStep(1); }} className="text-[11px] text-[#8B949E] hover:text-[#F0F6FC] flex items-center gap-1 mb-2 transition-colors" style={{ fontFamily: F.label }}><ChevronLeft className="w-3 h-3" /> Back to Trainees</button>}
          <h1 className="text-[28px] font-bold tracking-tight text-[#F0F6FC]" style={{ fontFamily: F.display }}>
            {view === 'profile' ? (selected?.title || 'Trainee Profile') : view === 'wizard' ? 'ENROLL TRAINEE' : 'TRAINEE MANAGEMENT'}
          </h1>
          {view === 'profile' && selected && <p className="text-[13px] text-[#8B949E] font-mono mt-0.5">{selected.case_number} · {selected.data?.trade || 'Unassigned'}</p>}
        </div>
        {view === 'table' && (
          <button onClick={() => setView('wizard')} className="px-4 py-2 text-[12px] font-semibold uppercase tracking-wider flex items-center gap-2 transition-all hover:opacity-90" style={{ fontFamily: F.label, background: C.volt, color: C.forge }}>
            <UserPlus className="w-4 h-4" /> Enroll Trainee
          </button>
        )}
      </div>

      {/* ── TABLE VIEW ── */}
      {view === 'table' && (
        <div className="bg-[#161B22] border border-[#30363D]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}>
          {/* Toolbar */}
          <div className="p-3 border-b border-[#30363D] flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484F58]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trainees..."
                className="w-full pl-9 pr-3 py-2 bg-[#0D1117] border border-[#30363D] text-[13px] text-[#C9D1D9] placeholder-[#484F58] outline-none focus:border-[#F6C90E] transition-colors" style={{ fontFamily: F.body }} />
            </div>
            {statuses.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                style={{ fontFamily: F.label, background: filterStatus === s ? C.volt : C.forge, color: filterStatus === s ? C.forge : C.chrome, border: `1px solid ${filterStatus === s ? C.volt : C.galv}` }}>
                {s}
              </button>
            ))}
          </div>
          {/* Table */}
          <div className="overflow-auto max-h-[calc(100vh-280px)]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: C.forge }}>
                  {['Trainee', 'ID', 'Program', 'Competency', 'Progress', 'Last Activity', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] border-b" style={{ fontFamily: F.label, color: C.alloy, borderColor: C.galv }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="text-center py-12 text-[#484F58]">Loading trainees...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#484F58]">No trainees found</td></tr>}
                {filtered.map(t => {
                  const progress = t.data?.progress || Math.floor(Math.random() * 100);
                  const level = t.data?.competency_level || 'Developing';
                  const levelColors = { Novice: C.alloy, Developing: C.volt, Proficient: C.circuit, Advanced: C.signal, Master: C.arc };
                  return (
                    <tr key={t.id} onClick={() => { setSelected(t); setView('profile'); }} className="cursor-pointer transition-colors hover:bg-[#21262D]/50" style={{ borderBottom: `1px solid ${C.galv}30` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: `${C.volt}20`, color: C.volt }}>{(t.title || 'T')[0]}</div>
                          <span className="text-[13px] font-medium text-[#F0F6FC]">{t.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono text-[#8B949E]">{t.case_number || '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-[#C9D1D9]">{t.data?.trade || 'Unassigned'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: F.label, background: `${levelColors[level] || C.alloy}18`, color: levelColors[level] || C.alloy }}>{level}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#21262D] rounded-full overflow-hidden max-w-[80px]"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress > 70 ? C.signal : progress > 40 ? C.volt : C.plasma }} /></div>
                          <span className="text-[11px] font-mono text-[#8B949E]">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#8B949E] font-mono">{t.updated_date ? new Date(t.updated_date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3"><StatusChip status={t.status || 'Active'} /></td>
                      <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-[#30363D]" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#30363D] flex justify-between items-center text-[11px] text-[#8B949E]" style={{ fontFamily: F.mono }}>
            <span>{filtered.length} trainee{filtered.length !== 1 ? 's' : ''}</span>
            <span>Showing {Math.min(filtered.length, 50)} of {filtered.length}</span>
          </div>
        </div>
      )}

      {/* ── PROFILE VIEW ── */}
      {view === 'profile' && selected && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 8-col */}
          <div className="lg:col-span-8 space-y-4">
            {/* Profile Header */}
            <div className="bg-[#161B22] border border-[#30363D] p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center text-[22px] font-bold" style={{ fontFamily: F.display, background: `${C.volt}20`, color: C.volt }}>{(selected.title || 'T')[0]}</div>
                <div className="flex-1">
                  <h2 className="text-[22px] font-bold text-[#F0F6FC]" style={{ fontFamily: F.display }}>{selected.title}</h2>
                  <p className="text-[13px] text-[#8B949E] mt-0.5">{selected.data?.trade || 'Welding & Fabrication'} — Cohort {selected.data?.cohort || '2024-A'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <StatusChip status={selected.status || 'Active'} />
                    <span className="text-[11px] text-[#484F58]" style={{ fontFamily: F.mono }}>Enrolled: {selected.created_date ? new Date(selected.created_date).toLocaleDateString() : '14 months'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Competency Radar Large */}
            <div className="bg-[#161B22] border border-[#30363D] p-6">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC] mb-4" style={{ fontFamily: F.label }}>Competency Radar</h3>
              <div className="flex items-center justify-center py-4"><HexRadar /></div>
            </div>

            {/* Recent Assessments */}
            <div className="bg-[#161B22] border border-[#30363D]">
              <div className="px-4 py-3 border-b border-[#30363D] bg-[#0D1117]/60">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC]" style={{ fontFamily: F.label }}>Recent Assessments</h3>
              </div>
              <div className="divide-y divide-[#21262D]">
                {[{ name: 'Electrical Safety Practical', date: 'Jun 02', score: 88, status: 'Passed', assessor: 'M. Asante' }, { name: 'MIG Welding Proficiency', date: 'May 28', score: 72, status: 'Passed', assessor: 'J. Mensah' }, { name: 'Blueprint Reading Theory', date: 'May 15', score: 45, status: 'Failed', assessor: 'A. Owusu' }].map((a, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: a.status === 'Passed' ? `${C.signal}15` : `${C.plasma}15` }}>
                      {a.status === 'Passed' ? <CheckCircle2 className="w-4 h-4" style={{ color: C.signal }} /> : <AlertTriangle className="w-4 h-4" style={{ color: C.plasma }} />}
                    </div>
                    <div className="flex-1">
                      <span className="text-[13px] font-medium text-[#F0F6FC]">{a.name}</span>
                      <div className="text-[11px] text-[#8B949E] font-mono">{a.date} · Assessor: {a.assessor}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] font-bold" style={{ fontFamily: F.display, color: a.score >= 50 ? C.signal : C.plasma }}>{a.score}/100</div>
                      <StatusChip status={a.status === 'Passed' ? 'Active' : 'Suspended'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4-col */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Stats */}
            <div className="bg-[#161B22] border border-[#30363D] p-4 space-y-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC] mb-3" style={{ fontFamily: F.label }}>Quick Stats</h3>
              {[{ label: 'Attendance Rate', value: '94%', color: C.signal }, { label: 'Assessments Passed', value: '18/21', color: C.circuit }, { label: 'Certifications', value: '3', color: C.arc }, { label: 'Time to Completion', value: '~6 weeks', color: C.volt }].map(s => (
                <div key={s.label} className="flex justify-between items-center py-2 border-b border-[#21262D] last:border-0">
                  <span className="text-[12px] text-[#8B949E]">{s.label}</span>
                  <span className="text-[14px] font-bold" style={{ fontFamily: F.display, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Orbit AI Summary */}
            <div className="bg-[#161B22] border border-[#30363D] p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20/5 rounded-full blur-3xl" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary flex items-center justify-center"><BarChart3 className="w-3 h-3 text-white" /></div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC]" style={{ fontFamily: F.label }}>Orbit AI Summary</h3>
              </div>
              <p className="text-[12px] text-[#C9D1D9] leading-relaxed relative z-10">"{selected.title} is performing above cohort average in structural skills but shows a gap in safety documentation. Recommend targeting OSH Module 3 before the Level 3 assessment."</p>
            </div>

            {/* Upcoming */}
            <div className="bg-[#161B22] border border-[#30363D] p-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F0F6FC] mb-3" style={{ fontFamily: F.label }}>Upcoming</h3>
              {[{ icon: Award, label: 'Practical Assessment', date: 'Jun 10', color: C.volt }, { icon: Briefcase, label: 'Placement Review', date: 'Jun 18', color: C.circuit }, { icon: FileText, label: 'Certification Exam', date: 'Jul 2', color: C.signal }].map((u, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#21262D] last:border-0">
                  <u.icon className="w-4 h-4 shrink-0" style={{ color: u.color }} />
                  <div className="flex-1">
                    <span className="text-[12px] text-[#C9D1D9]">{u.label}</span>
                    <span className="text-[10px] text-[#484F58] font-mono ml-2">{u.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ENROLLMENT WIZARD ── */}
      {view === 'wizard' && (
        <div className="bg-[#161B22] border border-[#30363D] max-w-3xl mx-auto">
          {/* Step Indicator */}
          <div className="px-6 py-4 border-b border-[#30363D] bg-[#0D1117]/60">
            <div className="flex items-center justify-between">
              {wizardSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                    style={{ background: wizardStep > i + 1 ? C.signal : wizardStep === i + 1 ? C.volt : C.steel, color: wizardStep >= i + 1 ? C.forge : C.alloy }}>
                    {wizardStep > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider hidden md:inline" style={{ fontFamily: F.label, color: wizardStep === i + 1 ? C.white : C.alloy }}>{step}</span>
                  {i < wizardSteps.length - 1 && <div className="w-6 h-px mx-1 hidden md:block" style={{ background: wizardStep > i + 1 ? C.signal : C.galv }} />}
                </div>
              ))}
            </div>
          </div>
          {/* Step Content */}
          <div className="p-8 min-h-[320px]">
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-[18px] font-bold text-[#F0F6FC] mb-6" style={{ fontFamily: F.display }}>Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['Full Name', 'National ID', 'Date of Birth', 'Gender', 'Email Address', 'Phone Number'].map(f => (
                    <input key={f} placeholder={f} className="px-4 py-3 bg-[#0D1117] border border-[#30363D] text-[13px] text-[#C9D1D9] placeholder-[#484F58] outline-none focus:border-[#F6C90E] transition-colors" style={{ fontFamily: F.body }} />
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-[11px] text-[#8B949E] uppercase tracking-wider block mb-2" style={{ fontFamily: F.label }}>Photo Upload</label>
                  <div className="border-2 border-dashed border-[#30363D] p-8 text-center hover:border-[#F6C90E] cursor-pointer transition-colors">
                    <Camera className="w-6 h-6 text-[#484F58] mx-auto mb-2" />
                    <span className="text-[12px] text-[#484F58]">Click or drag to upload photo</span>
                  </div>
                </div>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-[18px] font-bold text-[#F0F6FC] mb-6" style={{ fontFamily: F.display }}>Program Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['Electrical Installation', 'Welding & Fabrication', 'Plumbing', 'Carpentry', 'Automotive Tech', 'Fashion Design'].map(p => (
                    <div key={p} className="p-4 border border-[#30363D] bg-[#0D1117] cursor-pointer hover:border-[#F6C90E] transition-colors group">
                      <span className="text-[13px] font-semibold text-[#F0F6FC] group-hover:text-[#F6C90E] transition-colors">{p}</span>
                      <div className="text-[10px] text-[#484F58] mt-1 font-mono">12 Months · Full-time · NQF Level 3</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-[18px] font-bold text-[#F0F6FC] mb-6" style={{ fontFamily: F.display }}>Prerequisites Check</h3>
                {[{ name: 'Minimum Age (16+)', met: true }, { name: 'Basic Literacy', met: true }, { name: 'Medical Clearance', met: false }, { name: 'Previous Qualification', met: true }].map(p => (
                  <div key={p.name} className="flex items-center gap-3 p-3 border border-[#21262D] bg-[#0D1117]">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: p.met ? `${C.signal}20` : `${C.plasma}20` }}>
                      {p.met ? <Check className="w-3.5 h-3.5" style={{ color: C.signal }} /> : <X className="w-3.5 h-3.5" style={{ color: C.plasma }} />}
                    </div>
                    <span className="text-[13px] text-[#C9D1D9]">{p.name}</span>
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: F.label, color: p.met ? C.signal : C.plasma }}>{p.met ? 'MET' : 'MISSING'}</span>
                  </div>
                ))}
              </div>
            )}
            {wizardStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-[18px] font-bold text-[#F0F6FC] mb-6" style={{ fontFamily: F.display }}>Schedule Assignment</h3>
                <select className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] text-[13px] text-[#C9D1D9] outline-none focus:border-[#F6C90E]" style={{ fontFamily: F.body }}>
                  <option>Cohort 2026-A (Starting Jul 2026)</option><option>Cohort 2026-B (Starting Oct 2026)</option>
                </select>
                <div className="mt-4 p-4 bg-[#0D1117] border border-[#30363D]">
                  <p className="text-[11px] text-[#8B949E] uppercase tracking-wider mb-3" style={{ fontFamily: F.label }}>Weekly Preview</p>
                  <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-mono text-[#484F58]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => <div key={d} className="py-1 bg-[#161B22]">{d}</div>)}
                    {['Theory', 'Workshop', 'Workshop', 'Theory', 'Assessment'].map((s, i) => <div key={i} className="py-2 text-[#C9D1D9]" style={{ background: `${C.volt}10` }}>{s}</div>)}
                  </div>
                </div>
              </div>
            )}
            {wizardStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-[18px] font-bold text-[#F0F6FC] mb-6" style={{ fontFamily: F.display }}>Document Upload</h3>
                {['National ID / Passport', 'Academic Qualifications', 'Medical Clearance'].map(doc => (
                  <div key={doc} className="p-4 border-2 border-dashed border-[#30363D] hover:border-[#F6C90E] cursor-pointer transition-colors flex items-center gap-3">
                    <Upload className="w-5 h-5 text-[#484F58]" />
                    <div>
                      <span className="text-[13px] text-[#C9D1D9]">{doc}</span>
                      <span className="text-[10px] text-[#FF6B2C] ml-2 uppercase font-semibold" style={{ fontFamily: F.label }}>Required</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {wizardStep === 6 && (
              <div className="space-y-4 animate-in fade-in duration-300 text-center">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: `${C.signal}20` }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: C.signal }} />
                </div>
                <h3 className="text-[18px] font-bold text-[#F0F6FC]" style={{ fontFamily: F.display }}>Ready to Enroll</h3>
                <p className="text-[13px] text-[#8B949E]">Review all details before confirming enrollment.</p>
              </div>
            )}
          </div>
          {/* Navigation */}
          <div className="px-8 py-4 border-t border-[#30363D] flex justify-between">
            <button onClick={() => setWizardStep(s => Math.max(1, s - 1))} disabled={wizardStep === 1}
              className="px-5 py-2 text-[12px] font-semibold uppercase tracking-wider border border-[#30363D] text-[#C9D1D9] disabled:opacity-30 hover:bg-[#21262D] transition-colors" style={{ fontFamily: F.label }}>
              <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
            </button>
            <button onClick={() => { if (wizardStep < 6) setWizardStep(s => s + 1); else { setView('table'); setWizardStep(1); } }}
              className="px-5 py-2 text-[12px] font-semibold uppercase tracking-wider flex items-center gap-1 hover:opacity-90 transition-opacity" style={{ fontFamily: F.label, background: wizardStep === 6 ? C.signal : C.volt, color: C.forge }}>
              {wizardStep === 6 ? 'Confirm & Enroll' : 'Next'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
