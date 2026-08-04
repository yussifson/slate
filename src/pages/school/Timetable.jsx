import React, { useState, useMemo } from 'react';
import { 
  useIndustryRecords, 
  useMutateIndustryRecord, 
  useDeleteIndustryRecord 
} from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  'Mathematics', 
  'English', 
  'Science', 
  'Social Studies', 
  'ICT', 
  'Ghanaian Language', 
  'French', 
  'Religious & Moral Education', 
  'Physical Education', 
  'Creative Arts'
];

export default function Timetable() {
  const { data: timetableRecords = [], isLoading: loadingTimetable } = useIndustryRecords('school_timetable');
  const { data: classRecords = [] } = useIndustryRecords('school_class');
  const { data: teacherRecords = [] } = useIndustryRecords('school_teacher');
  const { mutateAsync: mutateRecord, isLoading: isSaving } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [selectedClass, setSelectedClass] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [currentRecordId, setCurrentRecordId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    day: '',
    period: '',
    start_time: '',
    end_time: '',
    subject: '',
    teacher_id: '',
    teacher_name: '',
    room: ''
  });

  // Derived data
  const classTimetable = useMemo(() => {
    return timetableRecords.filter(r => r.data?.class_name === selectedClass);
  }, [timetableRecords, selectedClass]);

  // Handlers
  const handleCellClick = (day, period) => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    
    const existingSlot = classTimetable.find(
      r => r.data?.day === day && r.data?.period === period.id
    );

    if (existingSlot) {
      // Edit mode
      setModalMode('edit');
      setCurrentRecordId(existingSlot.id);
      setFormData({
        day: existingSlot.data.day || day,
        period: existingSlot.data.period || period.id,
        start_time: existingSlot.data.start_time || period.startTime,
        end_time: existingSlot.data.end_time || period.endTime,
        subject: existingSlot.data.subject || '',
        teacher_id: existingSlot.data.teacher_id || '',
        teacher_name: existingSlot.data.teacher_name || '',
        room: existingSlot.data.room || ''
      });
    } else {
      // Add mode
      setModalMode('add');
      setCurrentRecordId(null);
      setFormData({
        day,
        period: period.id,
        start_time: period.startTime,
        end_time: period.endTime,
        subject: '',
        teacher_id: '',
        teacher_name: '',
        room: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleTeacherChange = (teacherId) => {
    const teacher = teacherRecords.find(t => t.id === teacherId);
    setFormData({
      ...formData,
      teacher_id: teacherId,
      teacher_name: teacher ? (teacher.data.name || teacher.data.full_name || 'Unknown') : ''
    });
  };

  const handleSave = async () => {
    if (!formData.subject || !formData.teacher_id) {
      toast.error('Please select a subject and teacher');
      return;
    }

    // Check for conflict
    if (modalMode === 'add') {
      const isConflict = timetableRecords.some(r => 
        r.data?.day === formData.day && 
        r.data?.period === formData.period &&
        r.data?.class_name === selectedClass &&
        r.id !== currentRecordId
      );

      if (isConflict) {
        toast.error('A slot already exists for this day and period');
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        class_name: selectedClass
      };

      await mutateRecord({
        id: currentRecordId,
        recordType: 'school_timetable',
        payload,
        searchText: `${selectedClass} ${formData.day} ${formData.subject}`
      });

      toast.success(`Timetable slot ${modalMode === 'add' ? 'added' : 'updated'}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save slot');
    }
  };

  const handleDelete = async () => {
    if (!currentRecordId) return;
    
    if (window.confirm('Are you sure you want to delete this slot?')) {
      try {
        await deleteRecord({
          id: currentRecordId,
          recordType: 'school_timetable'
        });
        toast.success('Slot deleted');
        setIsModalOpen(false);
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete slot');
      }
    }
  };

  if (loadingTimetable) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="mr-2 h-6 w-6 text-primary" />
            Class Timetable
          </h1>
          <p className="text-gray-500 mt-1">Manage weekly schedules for classes</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="max-w-xs">
          <Label htmlFor="class-select" className="mb-2 block">Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger id="class-select">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classRecords.map(cls => (
                <SelectItem key={cls.id} value={cls.data.name || cls.id}>
                  {cls.data.name || 'Unnamed Class'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClass ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b border-r p-4 text-left font-semibold text-gray-600 w-32">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Time
                  </div>
                </th>
                {DAYS.map(day => (
                  <th key={day} className="border-b p-4 text-center font-semibold text-gray-600">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, index) => {
                if (period.type === 'break') {
                  return (
                    <tr key={`break-${index}`} className="bg-gray-100">
                      <td className="border-b border-r p-3 text-sm text-gray-500 font-medium whitespace-nowrap">
                        {period.startTime} - {period.endTime}
                      </td>
                      <td colSpan={5} className="border-b p-3 text-center text-gray-500 font-medium italic tracking-wider">
                        {period.name.toUpperCase()}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={`period-${period.id}`}>
                    <td className="border-b border-r p-3 align-top whitespace-nowrap">
                      <div className="font-medium text-gray-900">{period.name}</div>
                      <div className="text-sm text-gray-500">{period.startTime} - {period.endTime}</div>
                    </td>
                    {DAYS.map(day => {
                      const slot = classTimetable.find(
                        r => r.data?.day === day && r.data?.period === period.id
                      );

                      return (
                        <td 
                          key={`${day}-${period.id}`} 
                          className="border-b border-r p-2 align-top h-24 hover:bg-gray-50 transition-colors cursor-pointer relative group"
                          onClick={() => handleCellClick(day, period)}
                        >
                          {slot ? (
                            <div className="bg-blue-50 border border-blue-100 rounded p-2 h-full flex flex-col justify-between">
                              <div>
                                <div className="font-semibold text-blue-900 text-sm mb-1 truncate">
                                  {slot.data.subject}
                                </div>
                                <div className="text-xs text-blue-700 flex items-center truncate">
                                  <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{slot.data.teacher_name}</span>
                                </div>
                              </div>
                              {slot.data.room && (
                                <div className="text-xs text-gray-500 flex items-center mt-1 truncate">
                                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{slot.data.room}</span>
                                </div>
                              )}
                              
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded">
                                <span className="bg-white text-xs px-2 py-1 rounded shadow text-gray-700 font-medium flex items-center">
                                  <Edit className="w-3 h-3 mr-1" /> Edit
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 group-hover:border-primary group-hover:text-primary transition-colors bg-gray-50">
                              <Plus className="w-5 h-5" />
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
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Class Selected</h3>
          <p className="text-gray-500">Please select a class to view or manage its timetable.</p>
        </div>
      )}

      {/* Add/Edit Slot Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === 'add' ? 'Add Timetable Slot' : 'Edit Timetable Slot'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{selectedClass}</span>
              <span className="text-gray-500">{formData.day} • {formData.start_time} - {formData.end_time}</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(val) => setFormData({...formData, subject: val})}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Select 
                value={formData.teacher_id} 
                onValueChange={handleTeacherChange}
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teacherRecords.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.data.name || teacher.data.full_name || 'Unnamed Teacher'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="room">Room (Optional)</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
                placeholder="e.g. Room 3, Lab A"
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            {modalMode === 'edit' ? (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            ) : (
              <div></div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Slot'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
