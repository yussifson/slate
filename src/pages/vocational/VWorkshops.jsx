import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Calendar, ChevronLeft, ChevronRight, Plus, Users, Clock, MapPin, Printer, CheckCircle2, UserCheck, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function VWorkshops() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [workshops, setWorkshops] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);

  // Create state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkshop, setNewWorkshop] = useState({ title: '', trade: '', room: '', instructor: '', dayOfWeek: '1', startHour: '8', duration: '2', capacity: '20' });

  const fetchData = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const [wData, aData, tData] = await Promise.all([
        base44.getEntities('voc_workshop', user.company_id),
        base44.getEntities('voc_attendance', user.company_id),
        base44.getEntities('voc_trainee', user.company_id)
      ]);
      setWorkshops(wData);
      setAttendance(aData);
      setTrainees(tData);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load workshop data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateWorkshop = async () => {
    if (!newWorkshop.title || !newWorkshop.trade) {
      toast.error('Title and Trade are required');
      return;
    }
    try {
      await base44.createEntity('voc_workshop', {
        title: newWorkshop.title,
        status: 'scheduled',
        data: {
          trade: newWorkshop.trade,
          room: newWorkshop.room || 'TBD',
          instructor: newWorkshop.instructor || 'TBD',
          dayOfWeek: parseInt(newWorkshop.dayOfWeek),
          startHour: parseInt(newWorkshop.startHour),
          duration: parseInt(newWorkshop.duration),
          capacity: parseInt(newWorkshop.capacity),
          enrolled: 0
        }
      }, user.company_id);
      toast.success('Workshop scheduled');
      setIsCreateOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to schedule workshop');
    }
  };

  // Calendar logic
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekDays = Array.from({ length: 6 }, (_, i) => { // Mon - Sat
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: 14 }, (_, i) => 7 + i); // 07:00 - 20:00
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  
  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const periodLabel = viewMode === 'week' 
    ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[5].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : viewMode === 'day' ? currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Map workshops to grid blocks
  const sessionBlocks = workshops.map(w => ({
    ...w,
    dayIndex: (w.data?.dayOfWeek || 1) - 1, // 0-based for Mon-Sat
    startHour: w.data?.startHour || 8,
    duration: w.data?.duration || 2
  }));

  // Get roster for selected session
  const getSessionRoster = (sessionId) => {
    return attendance.filter(a => a.data?.workshop_id === sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('workshop_schedule', 'Workshop Schedule')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {workshops.length} {t('workshops_scheduled', 'workshops scheduled')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <button onClick={prevPeriod} className="p-2 hover:bg-primary/5 transition-colors"><ChevronLeft className="w-4 h-4 text-primary" /></button>
            <span className="px-3 text-sm font-semibold text-slate-900 dark:text-white">{periodLabel}</span>
            <button onClick={nextPeriod} className="p-2 hover:bg-primary/5 transition-colors"><ChevronRight className="w-4 h-4 text-primary" /></button>
          </div>
          <div className="flex bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            {['day', 'week', 'month'].map(v => (
              <button key={v} onClick={() => setViewMode(v)} className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${viewMode === v ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5 text-[#71717a] dark:text-gray-400'}`}>
                {v}
              </button>
            ))}
          </div>
          <Button variant="outline" className="rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:bg-primary/5">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
            <Plus className="w-4 h-4 mr-2" /> Schedule
          </Button>
        </div>
      </div>

      {/* Calendar Grid (Week View Only for simplicity here, day/month can be mapped similarly) */}
      {viewMode === 'week' ? (
        <Card className="rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-x-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="min-w-[900px]">
            {/* Day headers */}
            <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-primary/10">
              <div className="p-3 bg-primary/5" />
              {weekDays.map((d, i) => (
                <div key={i} className="p-3 text-center border-l border-primary/10 bg-primary/5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{dayLabels[i]}</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">{d.getDate()}</div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            {hours.map(h => (
              <div key={h} className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-primary/5" style={{ minHeight: 60 }}>
                <div className="px-3 py-1 text-xs font-medium text-[#71717a] dark:text-gray-400 text-right pr-4 pt-2 tracking-[0.04em]">
                  {String(h).padStart(2, '0')}:00
                </div>
                {dayLabels.map((_, di) => {
                  // Find all blocks starting in this hour/day
                  const blocks = sessionBlocks.filter(b => b.dayIndex === di && b.startHour === h);
                  return (
                    <div key={di} className="border-l border-primary/5 relative" style={{ minHeight: 60 }}>
                      {blocks.map((block, idx) => (
                        <div
                          key={block.id}
                          className="absolute left-1 right-1 rounded-xl p-2 cursor-pointer transition-all hover:opacity-90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
                          style={{
                            top: `${idx * 4}px`, // Slight offset if multiple
                            height: `${block.duration * 60 - 8}px`,
                            zIndex: 10 + idx,
                            borderLeftWidth: '4px',
                            borderLeftColor: 'hsl(var(--primary))'
                          }}
                          onClick={() => setSelectedSession(block)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {block.status === 'live' && (
                              <span className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate tracking-[0.04em]">{block.title}</span>
                          </div>
                          <div className="text-[10px] text-[#71717a] dark:text-gray-400">{block.data?.room || 'TBD'} • {block.data?.instructor || 'TBD'}</div>
                          <div className="text-[10px] text-primary mt-1 flex items-center gap-2">
                            <Users className="w-3 h-3" /> {block.data?.enrolled || 0}/{block.data?.capacity || 20}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none p-12 text-center text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view implemented in full version. Use Week view for now.
        </Card>
      )}

      {/* Session Detail Slide-over */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedSession(null)}>
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-card border-l border-primary/20 h-full shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-2xl animate-in slide-in-from-right duration-200 flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-primary/5">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedSession.title}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)} className="rounded-full hover:bg-primary/10">
                <X className="w-5 h-5 text-[#71717a] dark:text-gray-400" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Room', value: selectedSession.data?.room || 'TBD', icon: MapPin }, 
                  { label: 'Time', value: `${selectedSession.startHour}:00 – ${selectedSession.startHour + selectedSession.duration}:00`, icon: Clock }, 
                  { label: 'Instructor', value: selectedSession.data?.instructor || 'TBD', icon: Users }, 
                  { label: 'Capacity', value: `${selectedSession.data?.enrolled || 0}/${selectedSession.data?.capacity || 20}`, icon: Users }
                ].map((d, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                    <div className="flex items-center gap-2.5 text-xs text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]"><d.icon className="w-4 h-4 text-primary" />{d.label}</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{d.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" /> Attendance Roster
                </h3>
                <div className="space-y-2">
                  {getSessionRoster(selectedSession.id).length === 0 ? (
                    <div className="p-4 text-center text-sm text-[#71717a] dark:text-gray-400 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-xl border-dashed">
                      No attendance recorded yet.
                    </div>
                  ) : (
                    getSessionRoster(selectedSession.id).map((record, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-card hover:bg-primary/5 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        <span className="text-sm font-medium">{record.data?.trainee_name || `Trainee ${i+1}`}</span>
                        <Badge variant="outline" className={`border-primary/40 ${record.data?.status === 'present' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                          {record.data?.status || 'Unknown'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-primary/10 bg-primary/5 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:bg-primary/5 text-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Edit Session</Button>
              <Button className="flex-1 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Take Attendance</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <DialogHeader>
            <DialogTitle>Schedule Workshop</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workshop Title</label>
              <Input placeholder="e.g. Safety Briefing" value={newWorkshop.title} onChange={e => setNewWorkshop({...newWorkshop, title: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trade</label>
              <Input placeholder="e.g. Welding" value={newWorkshop.trade} onChange={e => setNewWorkshop({...newWorkshop, trade: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Day of Week</label>
                <Select value={newWorkshop.dayOfWeek} onValueChange={v => setNewWorkshop({...newWorkshop, dayOfWeek: v})}>
                  <SelectTrigger className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem><SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem><SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem><SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Hour</label>
                <Select value={newWorkshop.startHour} onValueChange={v => setNewWorkshop({...newWorkshop, startHour: v})}>
                  <SelectTrigger className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {[8,9,10,11,12,13,14,15,16,17].map(h => <SelectItem key={h} value={`${h}`}>{`${h}:00`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (Hours)</label>
                <Input type="number" value={newWorkshop.duration} onChange={e => setNewWorkshop({...newWorkshop, duration: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Capacity</label>
                <Input type="number" value={newWorkshop.capacity} onChange={e => setNewWorkshop({...newWorkshop, capacity: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Room</label>
              <Input placeholder="e.g. Lab 1" value={newWorkshop.room} onChange={e => setNewWorkshop({...newWorkshop, room: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Cancel</Button>
            <Button onClick={handleCreateWorkshop} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
