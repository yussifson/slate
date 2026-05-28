import { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, LayoutGrid, MoreVertical, Edit2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useMeeting } from '@/hooks/integrations/useMeeting';
import { useCalendar } from '@/hooks/integrations/useCalendar';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const CLASS_LIST = ['Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Chemistry', 'Physics', 'Geography', 'ICT', 'P.E.', 'Art'];
const TEACHERS = ['Mr. John Doe', 'Mrs. Jane Smith', 'Mr. Kwesi Asante', 'Mrs. Ama Owusu', 'Mr. Kofi Mensah', 'Ms. Abena Sarpong'];

const SLOT_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-lime-100 text-lime-800 border-lime-200',
];

// Consistent color per subject name
function subjectColor(subject) {
  const idx = SUBJECTS.indexOf(subject);
  return SLOT_COLORS[(idx >= 0 ? idx : subject?.charCodeAt(0) || 0) % SLOT_COLORS.length];
}

const defaultForm = {
  className: 'Grade 9A',
  day: 'Monday',
  period: '1',
  startTime: '08:00',
  endTime: '09:00',
  subject: 'Mathematics',
  teacher: 'Mr. John Doe',
  room: '',
};

export default function Timetable() {
  const [selectedClass, setSelectedClass] = useState('Grade 9A');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...defaultForm, createZoomLink: false, addCalendar: false });

  const { generateMeetingLink, isGenerating } = useMeeting();
  const { addToCalendar, isAdding } = useCalendar();
  const { data: dbRecords = [], isLoading } = useIndustryRecords('timetable_slot');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const slots = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data,
  }));

  // Filter slots by selected class
  const classSlots = slots.filter(s => s.className === selectedClass);

  // Build a lookup: day -> period -> slot
  const slotGrid = {};
  classSlots.forEach(s => {
    if (!slotGrid[s.day]) slotGrid[s.day] = {};
    slotGrid[s.day][s.period] = s;
  });

  const handleAddSlot = async () => {
    if (!formData.room.trim()) return toast.error('Please enter a room number.');
    const period = parseInt(formData.period);
    if (isNaN(period) || period < 1 || period > 8) return toast.error('Period must be 1–8.');

    // Check for conflict
    const conflict = classSlots.find(s => s.day === formData.day && String(s.period) === String(formData.period) && s.id !== editingId);
    if (conflict) return toast.error(`A slot already exists for ${formData.day} Period ${formData.period} in ${formData.className}.`);

    const payload = {
      className: formData.className,
      day: formData.day,
      period,
      startTime: formData.startTime,
      endTime: formData.endTime,
      subject: formData.subject,
      teacher: formData.teacher,
      room: formData.room.trim(),
    };

    if (formData.createZoomLink) {
      const meeting = await generateMeetingLink({ topic: payload.subject, startTime: `2026-06-01 ${payload.startTime}`, duration: 60 });
      if (meeting?.join_url) payload.room = `Zoom: ${meeting.join_url}`;
    }

    if (formData.addCalendar) {
      await addToCalendar({ title: `${payload.subject} (${payload.className})`, date: payload.day, time: payload.startTime, details: payload.room });
    }

    if (editingId) {
      mutateRecord.mutate({
        id: editingId,
        recordType: 'timetable_slot',
        payload,
        status: 'Active',
        searchText: `${formData.className} ${formData.day} ${formData.subject} ${formData.teacher}`,
      }, {
        onSuccess: () => {
          toast.success('Timetable slot updated!');
          setShowModal(false);
          setEditingId(null);
          setFormData({ ...defaultForm, className: selectedClass });
        },
        onError: (err) => toast.error('Failed: ' + err.message),
      });
    } else {
      mutateRecord.mutate({
        recordType: 'timetable_slot',
        payload,
        status: 'Active',
        searchText: `${formData.className} ${formData.day} ${formData.subject} ${formData.teacher}`,
      }, {
        onSuccess: () => {
          toast.success('Timetable slot added!');
          setShowModal(false);
          setFormData({ ...defaultForm, className: selectedClass });
        },
        onError: (err) => toast.error('Failed: ' + err.message),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'timetable_slot' }, {
      onSuccess: () => { toast.success('Slot removed.'); setDeleteTargetId(null); },
      onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null); },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Timetable</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Weekly class schedule grid</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm"
          >
            {CLASS_LIST.map(c => <option key={c}>{c}</option>)}
          </select>
          <Button
            onClick={() => { setFormData({ ...defaultForm, className: selectedClass }); setShowModal(true); }}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{classSlots.length}</p>
            <p className="text-xs text-muted-foreground">Slots Scheduled</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">
              {[...new Set(classSlots.map(s => s.day))].length}
            </p>
            <p className="text-xs text-muted-foreground">Active Days</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">
              {[...new Set(classSlots.map(s => s.subject))].length}
            </p>
            <p className="text-xs text-muted-foreground">Subjects</p>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading timetable...</div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Day Headers */}
            <div className="grid grid-cols-6 divide-x divide-border border-b border-border bg-muted">
              <div className="p-4 flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              {DAYS.map(day => (
                <div key={day} className="p-4 text-center font-bold text-foreground text-sm uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Period Rows */}
            <div className="divide-y divide-border">
              {PERIODS.map(period => (
                <div key={period} className="grid grid-cols-6 divide-x divide-border min-h-[80px]">
                  {/* Period Label */}
                  <div className="p-3 flex flex-col items-center justify-center bg-muted/40 text-muted-foreground">
                    <span className="text-xs font-bold uppercase">P{period}</span>
                    <span className="text-[10px] mt-0.5">Period {period}</span>
                  </div>

                  {/* Day Cells */}
                  {DAYS.map(day => {
                    const slot = slotGrid[day]?.[period];
                    if (slot) {
                      const color = subjectColor(slot.subject);
                      return (
                        <div key={day} className="p-2 group relative">
                          <div className={`h-full p-2.5 rounded-lg border shadow-sm flex flex-col justify-between ${color} hover:shadow-md transition-all`}>
                            <div>
                              <p className="font-bold text-xs leading-tight mb-0.5">{slot.subject}</p>
                              <p className="text-[10px] opacity-75"><Link to="/team" className="hover:underline">{slot.teacher}</Link></p>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <p className="text-[10px] font-medium flex items-center gap-0.5 opacity-80">
                                <MapPin className="w-2.5 h-2.5" /> {slot.room}
                              </p>
                              <p className="text-[10px] opacity-70">{slot.startTime}–{slot.endTime}</p>
                            </div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-black/10">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingId(slot.id);
                                    setFormData({
                                      className: slot.className,
                                      day: slot.day,
                                      period: String(slot.period),
                                      startTime: slot.startTime,
                                      endTime: slot.endTime,
                                      subject: slot.subject,
                                      teacher: slot.teacher,
                                      room: slot.room
                                    });
                                    setShowModal(true);
                                  }}>Edit Slot</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 font-medium" onClick={() => setDeleteTargetId(slot.id)}>Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={day} className="p-2 flex items-center justify-center">
                        <button
                          onClick={() => {
                            setFormData({ ...defaultForm, className: selectedClass, day, period: String(period) });
                            setShowModal(true);
                          }}
                          className="w-full h-full min-h-[56px] rounded-lg border-2 border-dashed border-border text-muted-foreground/40 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> {editingId ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Class</label>
                <select
                  value={formData.className}
                  onChange={e => setFormData({ ...formData, className: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  {CLASS_LIST.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Day</label>
                  <select
                    value={formData.day}
                    onChange={e => setFormData({ ...formData, day: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Period (1–8)</label>
                  <select
                    value={formData.period}
                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Start Time</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">End Time</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                <select
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Teacher</label>
                <select
                  value={formData.teacher}
                  onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  {TEACHERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Room</label>
                <Input
                  value={formData.room}
                  onChange={e => setFormData({ ...formData, room: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Room 205"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={formData.createZoomLink || false} onChange={e => setFormData({ ...formData, createZoomLink: e.target.checked })} />
                Generate Zoom Link
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={formData.addCalendar || false} onChange={e => setFormData({ ...formData, addCalendar: e.target.checked })} />
                Add to Calendar
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowModal(false); setEditingId(null); setFormData({ ...defaultForm, className: selectedClass }); }}
                disabled={mutateRecord.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAddSlot}
                disabled={mutateRecord.isPending}
              >
                {mutateRecord.isPending ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Slot')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Remove Timetable Slot"
        message="Are you sure you want to remove this scheduled slot from the timetable?"
      />
    </div>
  );
}
