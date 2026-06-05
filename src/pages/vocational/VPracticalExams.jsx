import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Clock, Users, CheckCircle2, AlertTriangle, Camera, FileText, ChevronLeft, ChevronRight, Star, Timer, Save, X } from 'lucide-react';

const F = { display: "'Barlow Condensed', sans-serif", body: "'IBM Plex Sans', sans-serif", mono: "'IBM Plex Mono', monospace", label: "'Barlow Semi Condensed', sans-serif" };
const C = { forge: '#0D1117', carbon: '#161B22', steel: '#21262D', galv: '#30363D', alloy: '#484F58', chrome: '#8B949E', titanium: '#C9D1D9', white: '#F0F6FC', volt: '#F6C90E', plasma: '#FF6B2C', signal: '#00C896', circuit: '#4493F8', arc: '#BF8FFF' };

export default function VPracticalExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [activeExam, setActiveExam] = useState(null);
  const [activeTraineeIdx, setActiveTraineeIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [tab, setTab] = useState('today');

  useEffect(() => {
    if (!user?.company_id) return;
    (async () => {
      setLoading(true);
      try { setExams(await base44.getEntities('voc_exam', user.company_id)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const metrics = [
    { label: 'Pending Review', value: Math.ceil(exams.length * 0.3) || 14, color: C.volt },
    { label: 'Scheduled', value: Math.ceil(exams.length * 0.4) || 23, color: C.circuit },
    { label: 'In Progress', value: Math.ceil(exams.length * 0.1) || 3, color: C.signal },
    { label: 'Completed', value: Math.ceil(exams.length * 0.5) || 67, color: C.chrome },
    { label: 'Pass Rate', value: '84%', color: C.signal },
  ];

  const sampleTrainees = ['John Boateng', 'Akua Mensah', 'Ibrahim Ali', 'Fatima Owusu', 'Kwame Darko', 'Ama Amoah', 'Yaw Asante', 'Kofi Kusi'];
  const criteria = [
    { name: 'PPE correctly worn', weight: 20, maxScore: 5 },
    { name: 'Isolation procedure', weight: 25, maxScore: 5 },
    { name: 'Voltage testing technique', weight: 20, maxScore: 5 },
    { name: 'Documentation completed', weight: 15, maxScore: 5 },
    { name: 'Safety signage used', weight: 10, maxScore: 5 },
    { name: 'Clean-up & reinstatement', weight: 10, maxScore: 5 },
  ];

  const startExam = (exam) => {
    setActiveExam(exam);
    setActiveTraineeIdx(0);
    setScores({});
    setView('conduct');
  };

  const getTraineeScore = (tIdx) => {
    const ts = scores[tIdx] || {};
    let total = 0, maxTotal = 0;
    criteria.forEach((c, ci) => {
      const s = ts[ci] || 0;
      total += (s / c.maxScore) * c.weight;
      maxTotal += c.weight;
    });
    return Math.round(total);
  };

  const setScore = (criterionIdx, value) => {
    setScores(prev => ({
      ...prev,
      [activeTraineeIdx]: { ...(prev[activeTraineeIdx] || {}), [criterionIdx]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9]" style={{ fontFamily: F.body }}>
      {/* ── DASHBOARD VIEW ── */}
      {view === 'dashboard' && (
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-[#F0F6FC]" style={{ fontFamily: F.display }}>PRACTICAL ASSESSMENTS</h1>
              <p className="text-[13px] text-[#8B949E] mt-0.5" style={{ fontFamily: F.mono }}>{exams.length} assessments registered</p>
            </div>
            <button className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90" style={{ fontFamily: F.label, background: C.volt, color: C.forge }}>
              <Plus className="w-4 h-4" /> Create Assessment
            </button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {metrics.map(m => (
              <div key={m.label} className="bg-[#161B22] border border-[#30363D] p-4 text-center">
                <div className="text-[24px] font-bold" style={{ fontFamily: F.display, color: m.color }}>{m.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#484F58] mt-1" style={{ fontFamily: F.label }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {['today', 'week', 'upcoming', 'review', 'archives'].map(t => (
              <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                style={{ fontFamily: F.label, background: tab === t ? `${C.volt}15` : 'transparent', color: tab === t ? C.volt : C.chrome, borderBottom: tab === t ? `2px solid ${C.volt}` : '2px solid transparent' }}>
                {t === 'today' ? 'Due Today' : t === 'week' ? 'This Week' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Assessment List */}
          <div className="space-y-2">
            {exams.length === 0 && !loading && (
              <div className="text-center py-16 text-[#484F58]">No assessments found. Create your first practical assessment.</div>
            )}
            {(exams.length > 0 ? exams : [
              { id: 1, title: 'Electrical Safety Practical — Level 2', data: { trainees: 8, room: 'Workshop C', time: '14:00–17:00', assessor: 'M. Asante' } },
              { id: 2, title: 'MIG Welding Proficiency Test', data: { trainees: 6, room: 'Bay 4', time: '09:00–12:00', assessor: 'J. Mensah' } },
              { id: 3, title: 'Plumbing Installation Assessment', data: { trainees: 10, room: 'Workshop B', time: '10:00–13:00', assessor: 'K. Owusu' } },
            ]).map((exam, i) => (
              <div key={exam.id} className="bg-[#161B22] border border-[#30363D] p-4 flex items-center gap-4 hover:border-[#484F58] transition-colors group cursor-pointer"
                style={{ borderLeft: `4px solid ${i === 0 ? C.plasma : i === 1 ? C.volt : C.circuit}` }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {i === 0 && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5" style={{ fontFamily: F.label, background: `${C.plasma}20`, color: C.plasma }}>⚠ DUE TODAY</span>}
                    <span className="text-[14px] font-semibold text-[#F0F6FC]">{exam.title || `Assessment ${i + 1}`}</span>
                  </div>
                  <div className="text-[11px] text-[#8B949E] flex items-center gap-3" style={{ fontFamily: F.mono }}>
                    <span><Users className="w-3 h-3 inline mr-1" />{exam.data?.trainees || 8} trainees</span>
                    <span>{exam.data?.room || 'Workshop C'}</span>
                    <span>{exam.data?.time || '14:00–17:00'}</span>
                    <span>Assessor: {exam.data?.assessor || 'TBD'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border border-[#30363D] text-[#C9D1D9] hover:bg-[#21262D]" style={{ fontFamily: F.label }}>View</button>
                  <button onClick={() => startExam(exam)} className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider hover:opacity-90" style={{ fontFamily: F.label, background: C.signal, color: C.forge }}>Start</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONDUCT VIEW (Full-Screen Assessor) ── */}
      {view === 'conduct' && (
        <div className="h-screen flex flex-col">
          {/* Top bar */}
          <div className="px-4 py-3 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="text-[11px] text-[#8B949E] hover:text-[#F0F6FC] flex items-center gap-1" style={{ fontFamily: F.label }}><X className="w-3.5 h-3.5" /> Exit</button>
              <div className="w-px h-5 bg-[#30363D]" />
              <span className="text-[14px] font-bold text-[#F0F6FC]" style={{ fontFamily: F.display }}>ASSESSMENT: {activeExam?.title || 'Practical Exam'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0D1117] border border-[#30363D]">
                <Timer className="w-3.5 h-3.5 text-[#F6C90E]" />
                <span className="text-[13px] font-mono text-[#F0F6FC]">02:45:12</span>
              </div>
              <span className="text-[11px] text-[#8B949E]" style={{ fontFamily: F.mono }}>{sampleTrainees.length} trainees</span>
            </div>
          </div>

          {/* 2-Panel Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Trainee List */}
            <div className="w-[200px] shrink-0 bg-[#0D1117] border-r border-[#30363D] overflow-y-auto">
              <div className="p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58]" style={{ fontFamily: F.label }}>Trainees</div>
              {sampleTrainees.map((name, i) => {
                const scored = scores[i] && Object.keys(scores[i]).length === criteria.length;
                return (
                  <button key={i} onClick={() => setActiveTraineeIdx(i)}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors"
                    style={{ background: activeTraineeIdx === i ? C.steel : 'transparent', borderLeft: activeTraineeIdx === i ? `3px solid ${C.volt}` : '3px solid transparent' }}>
                    {scored ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.signal }} /> : <Clock className="w-4 h-4 shrink-0 text-[#484F58]" />}
                    <span className="text-[12px] truncate" style={{ color: activeTraineeIdx === i ? C.white : C.chrome }}>{name}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Scoring Panel */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0D1117]">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-[18px] font-bold text-[#F0F6FC] mb-1" style={{ fontFamily: F.display }}>Trainee: {sampleTrainees[activeTraineeIdx]}</h2>
                <div className="h-px bg-[#30363D] my-4" />

                {/* Criteria Scoring Table */}
                <div className="bg-[#161B22] border border-[#30363D]">
                  <div className="grid grid-cols-[1fr_80px_60px] gap-px bg-[#30363D] border-b border-[#30363D]">
                    <div className="bg-[#0D1117] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#484F58]" style={{ fontFamily: F.label }}>Criterion</div>
                    <div className="bg-[#0D1117] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#484F58] text-center" style={{ fontFamily: F.label }}>Score</div>
                    <div className="bg-[#0D1117] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#484F58] text-center" style={{ fontFamily: F.label }}>Weight</div>
                  </div>
                  {criteria.map((c, ci) => {
                    const currentScore = scores[activeTraineeIdx]?.[ci] || 0;
                    return (
                      <div key={ci} className="grid grid-cols-[1fr_80px_60px] gap-px bg-[#21262D]/30 border-b border-[#21262D] last:border-0">
                        <div className="bg-[#161B22] px-4 py-3">
                          <span className="text-[13px] text-[#C9D1D9]">{c.name}</span>
                        </div>
                        <div className="bg-[#161B22] px-2 py-3 flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} onClick={() => setScore(ci, s)}
                              className="w-6 h-6 rounded-sm text-[11px] font-bold transition-all"
                              style={{ background: currentScore >= s ? C.volt : C.steel, color: currentScore >= s ? C.forge : C.alloy }}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="bg-[#161B22] px-4 py-3 text-center">
                          <span className="text-[12px] text-[#8B949E]" style={{ fontFamily: F.mono }}>{c.weight}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Weighted Score */}
                <div className="mt-4 p-4 bg-[#161B22] border border-[#30363D] flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-[#F0F6FC]">Weighted Score</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[28px] font-bold" style={{ fontFamily: F.display, color: getTraineeScore(activeTraineeIdx) >= 50 ? C.signal : C.plasma }}>{getTraineeScore(activeTraineeIdx)}/100</span>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ fontFamily: F.label, background: getTraineeScore(activeTraineeIdx) >= 50 ? `${C.signal}20` : `${C.plasma}20`, color: getTraineeScore(activeTraineeIdx) >= 50 ? C.signal : C.plasma }}>
                      {getTraineeScore(activeTraineeIdx) >= 50 ? '● PASS' : '● FAIL'}
                    </span>
                  </div>
                </div>

                {/* Evidence */}
                <div className="mt-4 p-4 bg-[#161B22] border border-[#30363D]">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#484F58] mb-3" style={{ fontFamily: F.label }}>Evidence</h3>
                  <div className="flex gap-2 mb-4">
                    {[{ icon: Camera, label: 'Add Photo' }, { icon: FileText, label: 'Add Note' }].map(e => (
                      <button key={e.label} className="px-3 py-2 border border-dashed border-[#30363D] text-[11px] text-[#8B949E] hover:border-[#F6C90E] hover:text-[#F6C90E] transition-colors flex items-center gap-1.5" style={{ fontFamily: F.label }}>
                        <e.icon className="w-3.5 h-3.5" /> {e.label}
                      </button>
                    ))}
                  </div>
                  <textarea placeholder="Observer notes..." className="w-full px-4 py-3 bg-[#0D1117] border border-[#30363D] text-[13px] text-[#C9D1D9] placeholder-[#484F58] outline-none focus:border-[#F6C90E] resize-none h-24" style={{ fontFamily: F.body }} />
                </div>

                {/* Nav buttons */}
                <div className="mt-4 flex justify-between">
                  <button disabled={activeTraineeIdx === 0} onClick={() => setActiveTraineeIdx(i => i - 1)}
                    className="px-5 py-2 text-[12px] font-semibold uppercase tracking-wider border border-[#30363D] text-[#C9D1D9] disabled:opacity-30 hover:bg-[#21262D] transition-colors flex items-center gap-1" style={{ fontFamily: F.label }}>
                    <ChevronLeft className="w-4 h-4" /> Prev Trainee
                  </button>
                  <button onClick={() => { if (activeTraineeIdx < sampleTrainees.length - 1) setActiveTraineeIdx(i => i + 1); }}
                    className="px-5 py-2 text-[12px] font-semibold uppercase tracking-wider flex items-center gap-1 hover:opacity-90" style={{ fontFamily: F.label, background: C.volt, color: C.forge }}>
                    <Save className="w-4 h-4" /> Save & Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
