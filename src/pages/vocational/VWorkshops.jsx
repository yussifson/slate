import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Calendar, ChevronLeft, ChevronRight, Plus, Users, Clock, MapPin, Printer, AlertTriangle, CheckCircle2 } from 'lucide-react';

const F = { display: "'Barlow Condensed', sans-serif", body: "'IBM Plex Sans', sans-serif", mono: "'IBM Plex Mono', monospace", label: "'Barlow Semi Condensed', sans-serif" };
const C = { forge: '#0D1117', carbon: '#161B22', steel: '#21262D', galv: '#30363D', alloy: '#484F58', chrome: '#8B949E', titanium: '#C9D1D9', white: '#F0F6FC', volt: '#F6C90E', plasma: '#FF6B2C', signal: '#00C896', circuit: '#4493F8', arc: '#BF8FFF' };

const tradeColors = { 'Welding': C.volt, 'Electrical': C.circuit, 'Plumbing': C.signal, 'Carpentry': '#F59E0B', 'Automotive': C.plasma, 'Safety': '#EF4444', 'Assessment': C.arc, 'CNC': '#06B6D4' };

export default function VWorkshops() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (!user?.company_id) return;
    (async () => {
      setLoading(true);
      try { setWorkshops(await base44.getEntities('voc_workshop', user.company_id)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: 14 }, (_, i) => 7 + i);
  const rooms = ['Workshop A', 'Workshop B', 'Workshop C', 'Lab 1', 'Lab 2'];
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Generate sample session blocks from real data + fallbacks
  const sessionBlocks = workshops.slice(0, 8).map((w, i) => {
    const trade = w.data?.trade || ['Welding', 'Electrical', 'Plumbing', 'CNC', 'Automotive', 'Safety'][i % 6];
    const statuses = ['live', 'scheduled', 'completed', 'scheduled'];
    return {
      id: w.id,
      title: w.title || w.data?.name || `${trade} Session`,
      trade,
      room: rooms[i % rooms.length],
      dayIndex: i % 6,
      startHour: 8 + (i % 4) * 2,
      duration: 2 + (i % 3),
      instructor: w.data?.instructor || `Instructor ${i + 1}`,
      trainees: w.data?.enrolled || Math.floor(Math.random() * 15) + 8,
      capacity: w.data?.capacity || 20,
      status: statuses[i % 4],
      color: tradeColors[trade] || C.circuit,
    };
  });

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const weekLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[5].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] p-4 md:p-6" style={{ fontFamily: F.body }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#F0F6FC]" style={{ fontFamily: F.display }}>WORKSHOP SCHEDULE</h1>
          <p className="text-[13px] text-[#8B949E] mt-0.5" style={{ fontFamily: F.mono }}>{workshops.length} workshops · {rooms.length} rooms</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#161B22] border border-[#30363D]">
            <button onClick={prevWeek} className="p-2 hover:bg-[#21262D] transition-colors"><ChevronLeft className="w-4 h-4 text-[#8B949E]" /></button>
            <span className="px-3 text-[12px] font-semibold text-[#F0F6FC]" style={{ fontFamily: F.label }}>{weekLabel}</span>
            <button onClick={nextWeek} className="p-2 hover:bg-[#21262D] transition-colors"><ChevronRight className="w-4 h-4 text-[#8B949E]" /></button>
          </div>
          <div className="flex bg-[#161B22] border border-[#30363D]">
            {['Day', 'Week', 'Month'].map(v => (
              <button key={v} onClick={() => setViewMode(v.toLowerCase())} className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                style={{ fontFamily: F.label, background: viewMode === v.toLowerCase() ? `${C.volt}15` : 'transparent', color: viewMode === v.toLowerCase() ? C.volt : C.chrome }}>
                {v}
              </button>
            ))}
          </div>
          <button className="px-3 py-1.5 bg-[#161B22] border border-[#30363D] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#21262D] transition-colors flex items-center gap-1.5" style={{ fontFamily: F.label, color: C.chrome }}><Printer className="w-3.5 h-3.5" /> Print</button>
          <button className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90" style={{ fontFamily: F.label, background: C.volt, color: C.forge }}>
            <Plus className="w-4 h-4" /> Schedule
          </button>
        </div>
      </div>

      {/* Room filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {rooms.map(room => (
          <button key={room} className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border transition-colors"
            style={{ fontFamily: F.label, background: C.carbon, borderColor: C.galv, color: C.chrome }}>
            <MapPin className="w-3 h-3 inline mr-1" />{room}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#161B22] border border-[#30363D] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day headers */}
            <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-[#30363D]">
              <div className="p-3 bg-[#0D1117]" />
              {weekDays.map((d, i) => (
                <div key={i} className="p-3 text-center border-l border-[#21262D] bg-[#0D1117]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: F.label, color: C.alloy }}>{dayLabels[i]}</div>
                  <div className="text-[14px] font-bold text-[#F0F6FC] mt-0.5" style={{ fontFamily: F.display }}>{d.getDate()}</div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            {hours.map(h => (
              <div key={h} className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-[#21262D]/50" style={{ minHeight: 52 }}>
                <div className="px-3 py-1 text-[10px] font-mono text-[#484F58] text-right pr-4 pt-2">{String(h).padStart(2, '0')}:00</div>
                {dayLabels.map((_, di) => {
                  const block = sessionBlocks.find(b => b.dayIndex === di && b.startHour === h);
                  return (
                    <div key={di} className="border-l border-[#21262D]/30 relative" style={{ minHeight: 52 }}>
                      {block && (
                        <div
                          className="absolute left-1 right-1 top-1 rounded-sm px-2 py-1 cursor-pointer transition-all hover:opacity-90 group overflow-hidden"
                          style={{
                            backgroundColor: `${block.color}18`,
                            borderLeft: `3px solid ${block.color}`,
                            height: `${block.duration * 52 - 4}px`,
                            zIndex: 10,
                          }}
                          onClick={() => setSelectedSession(block)}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            {block.status === 'live' && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: C.signal }} />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: C.signal }} />
                              </span>
                            )}
                            {block.status === 'completed' && <CheckCircle2 className="w-3 h-3" style={{ color: C.alloy }} />}
                            <span className="text-[10px] font-bold uppercase truncate" style={{ fontFamily: F.label, color: block.color }}>{block.title}</span>
                          </div>
                          <div className="text-[9px] text-[#8B949E]" style={{ fontFamily: F.mono }}>{block.room} · {block.instructor}</div>
                          <div className="text-[9px] text-[#484F58] mt-0.5 flex items-center gap-1"><Users className="w-2.5 h-2.5" />{block.trainees}/{block.capacity}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Detail Slide-over */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedSession(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-[400px] bg-[#161B22] border-l border-[#30363D] h-full overflow-y-auto animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#30363D] flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#F0F6FC]" style={{ fontFamily: F.display }}>{selectedSession.title}</h2>
              <button onClick={() => setSelectedSession(null)} className="text-[#8B949E] hover:text-[#F0F6FC]"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{ label: 'Room', value: selectedSession.room, icon: MapPin }, { label: 'Time', value: `${selectedSession.startHour}:00 – ${selectedSession.startHour + selectedSession.duration}:00`, icon: Clock }, { label: 'Instructor', value: selectedSession.instructor, icon: Users }, { label: 'Capacity', value: `${selectedSession.trainees}/${selectedSession.capacity}`, icon: Users }].map(d => (
                  <div key={d.label} className="p-3 bg-[#0D1117] border border-[#21262D]">
                    <div className="flex items-center gap-1 text-[9px] text-[#484F58] uppercase tracking-wider mb-1" style={{ fontFamily: F.label }}><d.icon className="w-3 h-3" />{d.label}</div>
                    <div className="text-[13px] text-[#F0F6FC] font-semibold">{d.value}</div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#484F58] mb-2" style={{ fontFamily: F.label }}>Attendance Roster</h3>
                <div className="space-y-1">
                  {Array.from({ length: Math.min(selectedSession.trainees, 6) }, (_, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-[#0D1117] border border-[#21262D]">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: `${C.volt}20`, color: C.volt }}>T{i + 1}</div>
                      <span className="text-[12px] text-[#C9D1D9] flex-1">Trainee {i + 1}</span>
                      <span className="text-[10px] font-semibold uppercase" style={{ fontFamily: F.label, color: i < 4 ? C.signal : i === 4 ? C.volt : C.plasma }}>{i < 4 ? '✓ Present' : i === 4 ? '⚠ Late' : '✕ Absent'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 text-[11px] font-semibold uppercase tracking-wider text-center border border-[#30363D] text-[#C9D1D9] hover:bg-[#21262D] transition-colors" style={{ fontFamily: F.label }}>End Session</button>
                <button className="flex-1 py-2 text-[11px] font-semibold uppercase tracking-wider text-center hover:opacity-90" style={{ fontFamily: F.label, background: C.plasma, color: '#fff' }}>Flag Incident</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
