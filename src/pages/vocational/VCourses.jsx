import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Search, Plus, ChevronRight, Filter, Grid3X3, List, Award, Clock, Users, BookOpen, Wrench, Settings2, X, GripVertical, Save, Eye } from 'lucide-react';

const F = { display: "'Barlow Condensed', sans-serif", body: "'IBM Plex Sans', sans-serif", mono: "'IBM Plex Mono', monospace", label: "'Barlow Semi Condensed', sans-serif" };
const C = { forge: '#0D1117', carbon: '#161B22', steel: '#21262D', galv: '#30363D', alloy: '#484F58', chrome: '#8B949E', titanium: '#C9D1D9', white: '#F0F6FC', volt: '#F6C90E', plasma: '#FF6B2C', signal: '#00C896', circuit: '#4493F8', arc: '#BF8FFF' };

export default function VCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [view, setView] = useState('catalog');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    if (!user?.company_id) return;
    (async () => {
      setLoading(true);
      try { setCourses(await base44.getEntities('voc_course', user.company_id)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const categories = ['All', 'Electrical', 'Mechanical', 'Construction', 'ICT', 'Automotive', 'Hospitality', 'Agriculture'];
  const statuses = ['All', 'Active', 'Draft', 'Archived'];

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    const match = !q || (c.title || '').toLowerCase().includes(q);
    const cat = filterCategory === 'All' || (c.data?.category || '').toLowerCase().includes(filterCategory.toLowerCase());
    const stat = filterStatus === 'All' || (c.status || 'Active') === filterStatus;
    return match && cat && stat;
  });

  const ProgramCard = ({ course }) => {
    const enrolled = course.data?.enrolled || Math.floor(Math.random() * 180) + 20;
    const capacity = course.data?.capacity || 200;
    const pct = Math.round((enrolled / capacity) * 100);
    const modules = course.data?.modules || Math.floor(Math.random() * 20) + 10;
    const assessments = course.data?.assessments || Math.floor(Math.random() * 15) + 5;
    const competencies = course.data?.competencies || Math.floor(Math.random() * 40) + 10;
    const duration = course.data?.duration || '12 Months';
    const level = course.data?.nqf_level || 'NQF Level 3';
    const status = course.status || 'Active';
    const statusColor = status === 'Active' ? C.signal : status === 'Draft' ? C.volt : C.alloy;
    const icons = { Electrical: '⚡', Mechanical: '⚙️', Construction: '🏗️', ICT: '💻', Automotive: '🚗', Hospitality: '🍽️', Agriculture: '🌾' };
    const cat = course.data?.category || 'Electrical';

    return (
      <div className="border border-[#30363D] bg-[#161B22] group hover:border-[#484F58] transition-all cursor-pointer" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
        onClick={() => { setSelectedCourse(course); setView('builder'); }}>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded flex items-center justify-center text-lg" style={{ background: `${C.volt}15` }}>{icons[cat] || '📚'}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-[#F0F6FC] truncate group-hover:text-[#F6C90E] transition-colors" style={{ fontFamily: F.display }}>{course.title || 'Untitled Program'}</h3>
              <p className="text-[11px] text-[#8B949E] mt-0.5" style={{ fontFamily: F.mono }}>{level} · {duration} · Full-time</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[#8B949E]" style={{ fontFamily: F.label }}>{pct}% CAPACITY</span>
              <span className="font-mono text-[#8B949E]">{enrolled}/{capacity}</span>
            </div>
            <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 85 ? C.plasma : pct > 50 ? C.volt : C.signal }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center py-3 border-t border-b border-[#21262D]">
            {[{ label: 'Modules', val: modules }, { label: 'Assessments', val: assessments }, { label: 'Competencies', val: competencies }].map(s => (
              <div key={s.label}>
                <div className="text-[16px] font-bold text-[#F0F6FC]" style={{ fontFamily: F.display }}>{s.val}</div>
                <div className="text-[9px] text-[#484F58] uppercase tracking-wider" style={{ fontFamily: F.label }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: F.label, color: statusColor }}>{status}</span>
            </div>
            <span className="text-[10px] text-[#484F58] font-mono">Cohorts: {course.data?.cohorts || 3}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] p-4 md:p-6" style={{ fontFamily: F.body }}>
      {view === 'catalog' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-[#F0F6FC]" style={{ fontFamily: F.display }}>TRAINING PROGRAMS</h1>
              <p className="text-[13px] text-[#8B949E] mt-0.5" style={{ fontFamily: F.mono }}>{courses.length} programs · {courses.filter(c => c.status === 'Active' || !c.status).length} active</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#21262D] transition-colors flex items-center gap-1.5" style={{ fontFamily: F.label }}>
                <Filter className="w-3.5 h-3.5" /> Import Framework
              </button>
              <button className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90" style={{ fontFamily: F.label, background: C.volt, color: C.forge }}>
                <Plus className="w-4 h-4" /> Create Program
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Left Filter Panel */}
            {showFilters && (
              <div className="w-[200px] shrink-0 space-y-4 hidden lg:block">
                <div className="bg-[#161B22] border border-[#30363D] p-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58] mb-3" style={{ fontFamily: F.label }}>Status</h3>
                  {statuses.map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className="w-full text-left px-3 py-1.5 text-[12px] transition-colors mb-0.5" style={{ fontFamily: F.body, background: filterStatus === s ? `${C.volt}15` : 'transparent', color: filterStatus === s ? C.volt : C.chrome }}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="bg-[#161B22] border border-[#30363D] p-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58] mb-3" style={{ fontFamily: F.label }}>Trade Category</h3>
                  {categories.map(c => (
                    <button key={c} onClick={() => setFilterCategory(c)} className="w-full text-left px-3 py-1.5 text-[12px] transition-colors mb-0.5" style={{ fontFamily: F.body, background: filterCategory === c ? `${C.volt}15` : 'transparent', color: filterCategory === c ? C.volt : C.chrome }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484F58]" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs..."
                    className="w-full pl-9 pr-3 py-2 bg-[#161B22] border border-[#30363D] text-[13px] text-[#C9D1D9] placeholder-[#484F58] outline-none focus:border-[#F6C90E] transition-colors" style={{ fontFamily: F.body }} />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-16 text-[#484F58]">Loading programs...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-[#484F58]">No programs found. Create your first training program.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(c => <ProgramCard key={c.id} course={c} />)}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── PROGRAM BUILDER (3 Panel) ── */}
      {view === 'builder' && selectedCourse && (
        <div className="h-[calc(100vh-120px)] flex flex-col">
          {/* Builder Top Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161B22] border-b border-[#30363D] shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => { setView('catalog'); setSelectedCourse(null); }} className="text-[11px] text-[#8B949E] hover:text-[#F0F6FC] flex items-center gap-1 transition-colors" style={{ fontFamily: F.label }}>
                <X className="w-3.5 h-3.5" /> Exit Builder
              </button>
              <div className="w-px h-5 bg-[#30363D]" />
              <span className="text-[14px] font-bold text-[#F0F6FC]" style={{ fontFamily: F.display }}>{selectedCourse.title}</span>
              <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded" style={{ fontFamily: F.label, background: `${C.volt}15`, color: C.volt }}>{selectedCourse.status || 'Draft'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-[#0D1117] border border-[#30363D] text-[11px] text-[#C9D1D9] font-semibold uppercase tracking-wider hover:bg-[#21262D] transition-colors flex items-center gap-1.5" style={{ fontFamily: F.label }}><Eye className="w-3.5 h-3.5" /> Preview</button>
              <button className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity" style={{ fontFamily: F.label, background: C.signal, color: C.forge }}><Save className="w-3.5 h-3.5" /> Save</button>
            </div>
          </div>

          {/* 3-panel layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Structure Tree */}
            <div className="w-[280px] shrink-0 bg-[#0D1117] border-r border-[#30363D] overflow-y-auto p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58] px-2 mb-3" style={{ fontFamily: F.label }}>Program Structure</div>
              {[
                { label: 'Phase 1: Foundation', weeks: '8 weeks', modules: ['Electrical Theory', 'Workshop Safety', 'Basic Measurement'] },
                { label: 'Phase 2: Practical', weeks: '12 weeks', modules: ['Wiring Installation', 'Circuit Design', 'Motor Control'] },
                { label: 'Phase 3: Advanced', weeks: '8 weeks', modules: ['Industrial Systems', 'PLC Programming', 'Capstone Project'] }
              ].map((phase, pi) => (
                <div key={pi} className="mb-2">
                  <div className="flex items-center gap-2 px-2 py-2 text-[12px] font-semibold text-[#F0F6FC] hover:bg-[#161B22] cursor-pointer transition-colors">
                    <ChevronRight className="w-3 h-3 text-[#484F58]" />
                    <span>{phase.label}</span>
                    <span className="ml-auto text-[9px] text-[#484F58] font-mono">{phase.weeks}</span>
                  </div>
                  {phase.modules.map((m, mi) => (
                    <div key={mi} className="flex items-center gap-2 pl-7 pr-2 py-1.5 text-[11px] text-[#8B949E] hover:bg-[#161B22] hover:text-[#C9D1D9] cursor-pointer transition-colors">
                      <GripVertical className="w-3 h-3 text-[#30363D]" />
                      <BookOpen className="w-3 h-3 text-[#484F58]" />
                      {m}
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-3 space-y-1 px-2">
                <button className="w-full py-2 text-[10px] font-semibold uppercase tracking-wider border border-dashed border-[#30363D] text-[#484F58] hover:border-[#F6C90E] hover:text-[#F6C90E] transition-colors" style={{ fontFamily: F.label }}>+ Add Phase</button>
                <button className="w-full py-2 text-[10px] font-semibold uppercase tracking-wider border border-dashed border-[#30363D] text-[#484F58] hover:border-primary hover:text-primary transition-colors" style={{ fontFamily: F.label }}>+ Add Slate</button>
              </div>
            </div>

            {/* Center: Content Canvas */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0D1117]">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58] mb-2 block" style={{ fontFamily: F.label }}>Unit Title</label>
                  <input defaultValue="DC Circuit Fundamentals" className="w-full px-4 py-3 bg-[#161B22] border border-[#30363D] text-[16px] font-bold text-[#F0F6FC] outline-none focus:border-[#F6C90E] transition-colors" style={{ fontFamily: F.display }} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[10px] text-[#484F58] uppercase tracking-wider block mb-1" style={{ fontFamily: F.label }}>Duration (hrs)</label><input defaultValue="40" className="w-full px-3 py-2 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] outline-none focus:border-[#F6C90E]" /></div>
                  <div><label className="text-[10px] text-[#484F58] uppercase tracking-wider block mb-1" style={{ fontFamily: F.label }}>Theory %</label><input defaultValue="30" className="w-full px-3 py-2 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] outline-none focus:border-[#F6C90E]" /></div>
                  <div><label className="text-[10px] text-[#484F58] uppercase tracking-wider block mb-1" style={{ fontFamily: F.label }}>Practical %</label><input defaultValue="70" className="w-full px-3 py-2 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] outline-none focus:border-[#F6C90E]" /></div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58] mb-2 block" style={{ fontFamily: F.label }}>Learning Outcomes</label>
                  {['Identify series and parallel circuits', 'Apply Ohm\'s Law to calculate values', 'Construct basic DC circuits on breadboard'].map((o, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <GripVertical className="w-3 h-3 text-[#30363D] cursor-grab" />
                      <input defaultValue={o} className="flex-1 px-3 py-2 bg-[#161B22] border border-[#30363D] text-[13px] text-[#C9D1D9] outline-none focus:border-[#F6C90E]" />
                      <X className="w-3 h-3 text-[#484F58] cursor-pointer hover:text-[#FF6B2C]" />
                    </div>
                  ))}
                  <button className="text-[11px] text-primary hover:text-[#F0F6FC] flex items-center gap-1 mt-1" style={{ fontFamily: F.label }}><Plus className="w-3 h-3" /> Add outcome</button>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58] mb-2 block" style={{ fontFamily: F.label }}>Competencies Mapped</label>
                  <div className="flex flex-wrap gap-2">
                    {[{ code: 'ELEC-001', name: 'DC Theory' }, { code: 'SAFE-003', name: 'PPE Use' }].map(c => (
                      <span key={c.code} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold border" style={{ fontFamily: F.label, background: `${C.circuit}10`, borderColor: `${C.circuit}30`, color: C.circuit }}>
                        [{c.code}] {c.name} <X className="w-3 h-3 cursor-pointer hover:text-[#FF6B2C]" />
                      </span>
                    ))}
                    <button className="px-2.5 py-1 text-[10px] font-semibold border border-dashed border-[#30363D] text-[#484F58] hover:border-primary hover:text-primary transition-colors" style={{ fontFamily: F.label }}>+ Map</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58] mb-2 block" style={{ fontFamily: F.label }}>Delivery Method</label>
                  <div className="flex gap-2">
                    {['Classroom', 'Workshop', 'Blended', 'Online'].map(m => (
                      <button key={m} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-colors" style={{ fontFamily: F.label, background: m === 'Workshop' ? `${C.volt}15` : C.forge, borderColor: m === 'Workshop' ? C.volt : C.galv, color: m === 'Workshop' ? C.volt : C.chrome }}>
                        {m === 'Workshop' ? '●' : '○'} {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Properties */}
            <div className="w-[280px] shrink-0 bg-[#161B22] border-l border-[#30363D] overflow-y-auto p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#484F58] mb-3" style={{ fontFamily: F.label }}>Slate Properties</div>
              <div className="space-y-4">
                {[{ label: 'Total Hours', value: '40' }, { label: 'NQF Credits', value: '8' }, { label: 'Prerequisites', value: 'None' }, { label: 'Equipment Required', value: 'Multimeter, Breadboard' }].map(p => (
                  <div key={p.label}>
                    <label className="text-[10px] text-[#484F58] uppercase tracking-wider block mb-1" style={{ fontFamily: F.label }}>{p.label}</label>
                    <input defaultValue={p.value} className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] text-[12px] text-[#C9D1D9] outline-none focus:border-[#F6C90E]" />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] text-[#484F58] uppercase tracking-wider block mb-2" style={{ fontFamily: F.label }}>Competency Impact</label>
                  <div className="space-y-2">
                    {[{ domain: 'Electrical', pct: 80 }, { domain: 'Safety', pct: 30 }, { domain: 'Theory', pct: 60 }].map(d => (
                      <div key={d.domain}>
                        <div className="flex justify-between text-[10px] mb-0.5"><span className="text-[#8B949E]">{d.domain}</span><span className="font-mono text-[#C9D1D9]">{d.pct}%</span></div>
                        <div className="h-1 bg-[#21262D] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: C.circuit }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
