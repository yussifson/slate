import React, { useState, useMemo } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { Calendar, Plus, Trash2, Edit, Clock, MapPin, User, BookOpen, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const PERIODS = [
  { id: 1, type: 'class', startTime: '07:30', endTime: '08:15', name: 'Period 1' },
  { id: 2, type: 'class', startTime: '08:15', endTime: '09:00', name: 'Period 2' },
  { id: 3, type: 'class', startTime: '09:00', endTime: '09:45', name: 'Period 3' },
  { id: 'break1', type: 'break', startTime: '09:45', endTime: '10:00', name: 'Morning Break' },
  { id: 4, type: 'class', startTime: '10:00', endTime: '10:45', name: 'Period 4' },
  { id: 5, type: 'class', startTime: '10:45', endTime: '11:30', name: 'Period 5' },
  { id: 6, type: 'class', startTime: '11:30', endTime: '12:15', name: 'Period 6' },
  { id: 'break2', type: 'break', startTime: '12:15', endTime: '13:00', name: 'Lunch Break' },
  { id: 7, type: 'class', startTime: '13:00', endTime: '13:45', name: 'Period 7' },
  { id: 8, type: 'class', startTime: '13:45', endTime: '14:30', name: 'Period 8' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'Social Studies', 'ICT',
  'Ghanaian Language', 'French', 'Religious & Moral Education',
  'Physical Education', 'Creative Arts'
];

export default function Timetable() {
  const { data: timetableRecords = [], isLoading: loadingTimetable } = useIndustryRecords('school_timetable');
  const { data: classRecords = [] } = useIndustryRecords('school_class');
  const { data: teacherRecords = [] } = useIndustryRecords('school_teacher');
  const { mutateAsync: mutateRecord, isLoading: isSaving } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [selectedClass, setSelectedClass] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [formData, setFormData] = useState({ day: '', period: '', start_time: '', end_time: '', subject: '', teacher_id: '', teacher_name: '', room: '' });

  const classTimetable = useMemo(() => {
    return timetableRecords.filter(r => r.data?.class_name === selectedClass);
  }, [timetableRecords, selectedClass]);

  const handleCellClick = (day, period) => {
    if (!selectedClass) { toast.error('Please select a class first'); return; }
    const existingSlot = classTimetable.find(r => r.data?.day === day && r.data?.period === period.id);
    if (existingSlot) {
      setModalMode('edit');
      setCurrentRecordId(existingSlot.id);
      setFormData({ day: existingSlot.data.day || day, period: existingSlot.data.period || period.id, start_time: existingSlot.data.start_time || period.startTime, end_time: existingSlot.data.end_time || period.endTime, subject: existingSlot.data.subject || '', teacher_id: existingSlot.data.teacher_id || '', teacher_name: existingSlot.data.teacher_name || '', room: existingSlot.data.room || '' });
    } else {
      setModalMode('add');
      setCurrentRecordId(null);
      setFormData({ day, period: period.id, start_time: period.startTime, end_time: period.endTime, subject: '', teacher_id: '', teacher_name: '', room: '' });
    }
    setIsModalOpen(true);
  };

  const handleTeacherChange = (teacherId) => {
    const teacher = teacherRecords.find(t => t.id === teacherId);
    setFormData({ ...formData, teacher_id: teacherId, teacher_name: teacher ? (teacher.data.name || teacher.data.full_name || 'Unknown') : '' });
  };

  const handleSave = async () => {
    if (!formData.subject || !formData.teacher_id) { toast.error('Please select a subject and teacher'); return; }
    if (modalMode === 'add') {
      const isConflict = timetableRecords.some(r => r.data?.day === formData.day && r.data?.period === formData.period && r.data?.class_name === selectedClass && r.id !== currentRecordId);
      if (isConflict) { toast.error('A slot already exists for this day and period'); return; }
    }
    try {
      await mutateRecord({ id: currentRecordId, recordType: 'school_timetable', payload: { ...formData, class_name: selectedClass }, searchText: `${selectedClass} ${formData.day} ${formData.subject}` });
      toast.success(`Timetable slot ${modalMode === 'add' ? 'added' : 'updated'}`);
      setIsModalOpen(false);
    } catch (error) { toast.error('Failed to save slot'); }
  };

  const handleDelete = async () => {
    if (!currentRecordId) return;
    if (window.confirm('Delete this slot?')) {
      try { await deleteRecord({ id: currentRecordId, recordType: 'school_timetable' }); toast.success('Slot deleted'); setIsModalOpen(false); }
      catch (error) { toast.error('Failed to delete slot'); }
    }
  };

  return (
    <SchoolPageShell
      title="Class Timetable"
      subtitle="Manage weekly schedules and period allocations"
      breadcrumb={['School', 'Timetable']}
    >
      {/* Class Selector */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 mb-6">
        <div className="max-w-xs">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-10 bg-background border-border/50">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classRecords.map(cls => (
                <SelectItem key={cls.id} value={cls.data.name || cls.id}>{cls.data.name || 'Unnamed Class'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClass ? (
        loadingTimetable ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Loading timetable...</div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-muted/20 border-b border-border/50">
                  <th className="border-r border-border/50 p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Time</div>
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="p-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period, index) => {
                  if (period.type === 'break') {
                    return (
                      <tr key={`break-${index}`} className="bg-muted/10">
                        <td className="border-b border-r border-border/50 p-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{period.startTime} – {period.endTime}</td>
                        <td colSpan={5} className="border-b border-border/50 p-2 text-center">
                          <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{period.name}</span>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={`period-${period.id}`}>
                      <td className="border-b border-r border-border/50 p-3 align-top whitespace-nowrap">
                        <div className="text-xs font-semibold text-foreground">{period.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{period.startTime} – {period.endTime}</div>
                      </td>
                      {DAYS.map(day => {
                        const slot = classTimetable.find(r => r.data?.day === day && r.data?.period === period.id);
                        return (
                          <td key={`${day}-${period.id}`} className="border-b border-r border-border/50 p-2 align-top h-20 cursor-pointer group transition-colors hover:bg-muted/20" onClick={() => handleCellClick(day, period)}>
                            {slot ? (
                              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-2.5 h-full flex flex-col justify-between relative group/slot">
                                <div>
                                  <div className="font-semibold text-indigo-800 dark:text-indigo-300 text-xs truncate">{slot.data.subject}</div>
                                  <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5 truncate">
                                    <User className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate">{slot.data.teacher_name}</span>
                                  </div>
                                </div>
                                {slot.data.room && (
                                  <div className="text-xs text-indigo-500/70 flex items-center gap-1 truncate">
                                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate">{slot.data.room}</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-indigo-500/0 group-hover/slot:bg-indigo-500/5 rounded-lg flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-all">
                                  <span className="bg-white dark:bg-zinc-800 text-xs px-2 py-1 rounded-lg shadow-sm font-semibold text-indigo-600 border border-indigo-100 dark:border-zinc-700 flex items-center gap-1"><Edit className="w-2.5 h-2.5" /> Edit</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground/30 group-hover:border-indigo-400 group-hover:text-indigo-400 transition-all">
                                <Plus className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No class selected</p>
          <p className="text-sm text-muted-foreground mt-1">Select a class above to view or edit its timetable.</p>
        </div>
      )}

      {/* Add/Edit Slot Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{modalMode === 'add' ? 'Add Timetable Slot' : 'Edit Timetable Slot'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between text-sm border border-border/50">
              <span className="font-semibold text-foreground">{selectedClass}</span>
              <span className="text-muted-foreground">{formData.day} · {formData.start_time} – {formData.end_time}</span>
            </div>
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select value={formData.subject} onValueChange={val => setFormData({...formData, subject: val})}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Teacher</Label>
              <Select value={formData.teacher_id} onValueChange={handleTeacherChange}>
                <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                <SelectContent>{teacherRecords.map(t => <SelectItem key={t.id} value={t.id}>{t.data.name || t.data.full_name || 'Unnamed'}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Room (Optional)</Label>
              <Input value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="e.g. Room 3, Lab A" className="h-10" />
            </div>
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            {modalMode === 'edit' ? (
              <Button variant="destructive" size="sm" onClick={handleDelete} className="rounded-lg">
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-lg" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSaving ? 'Saving...' : 'Save Slot'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
