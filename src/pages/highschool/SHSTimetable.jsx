import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Clock, Plus, BookOpen, MapPin, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 10:30 AM (Break)',
  '10:30 AM - 11:30 AM',
  '11:30 AM - 12:30 PM',
  '12:30 PM - 01:30 PM (Lunch)',
  '01:30 PM - 02:30 PM',
  '02:30 PM - 03:30 PM'
];

export default function SHSTimetable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClassId, setSelectedClassId] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    day: 'Monday',
    timeSlot: '08:00 AM - 09:00 AM',
    courseId: '',
    room: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classData, courseData, timetableData] = await Promise.all([
        base44.getEntities('shs_class', user?.company_id),
        base44.getEntities('shs_course', user?.company_id),
        base44.getEntities('shs_timetable', user?.company_id)
      ]);
      setClasses(classData);
      setCourses(courseData);
      setTimetableEntries(timetableData);
      if (classData.length > 0 && !selectedClassId) {
        setSelectedClassId(classData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchData();
    }
  }, [user]);

  const handleAddEntry = async () => {
    try {
      const selectedCourse = courses.find(c => c.id === newEntry.courseId);
      const targetClass = classes.find(c => c.id === selectedClassId);
      
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_timetable',
        title: `${selectedCourse?.data?.subjectName} - ${targetClass?.title}`,
        case_number: `TT-${Math.floor(Math.random() * 10000)}`,
        status: 'Active',
        data: {
          ...newEntry,
          classId: selectedClassId,
          className: targetClass?.title,
          courseName: selectedCourse?.title,
          subjectName: selectedCourse?.data?.subjectName,
          teacherName: selectedCourse?.data?.teacherName
        }
      };
      
      await base44.createEntity(payload);
      setIsAddModalOpen(false);
      setNewEntry(prev => ({ ...prev, courseId: '', room: '' }));
      fetchData();
    } catch (error) {
      console.error('Failed to add timetable entry:', error);
    }
  };

  const getEntryForSlot = (day, timeSlot) => {
    return timetableEntries.find(e => 
      e.data?.classId === selectedClassId && 
      e.data?.day === day && 
      e.data?.timeSlot === timeSlot
    );
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const availableCoursesForClass = courses.filter(c => c.data?.classId === selectedClassId);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            Class Timetable
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Schedule and view academic periods for each class across the week.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#6F00FF]">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Weekly Schedule</CardTitle>
                <CardDescription>Select a class to view its timetable</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select 
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF] w-full sm:w-48 font-semibold text-slate-700"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.data?.program})</option>
                ))}
              </select>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                disabled={!selectedClassId}
                className="h-10 rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white shadow-md w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" /> Schedule Class
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading timetable...</div>
          ) : !selectedClassId ? (
            <div className="p-16 text-center text-slate-400">Please select a class to view its timetable.</div>
          ) : (
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50/80">
                <div className="p-4 border-r border-slate-100 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Time / Day</div>
                {DAYS.map(day => (
                  <div key={day} className="p-4 border-r border-slate-100 font-bold text-slate-700 text-center">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="divide-y divide-slate-100">
                {TIME_SLOTS.map(slot => {
                  const isBreak = slot.includes('Break') || slot.includes('Lunch');
                  
                  if (isBreak) {
                    return (
                      <div key={slot} className="grid grid-cols-6 bg-slate-50/50">
                        <div className="p-3 border-r border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-center text-center">
                          <Clock className="w-3 h-3 mr-1" /> {slot.split(' (')[0]}
                        </div>
                        <div className="col-span-5 p-3 flex items-center justify-center text-slate-400 font-bold tracking-[0.2em] uppercase text-xs opacity-70">
                          {slot.includes('Break') ? 'SHORT BREAK' : 'LUNCH BREAK'}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={slot} className="grid grid-cols-6 hover:bg-slate-50/30 transition-colors">
                      <div className="p-3 border-r border-slate-100 text-xs font-medium text-slate-600 flex flex-col justify-center text-center bg-slate-50/20">
                        {slot}
                      </div>
                      
                      {DAYS.map(day => {
                        const entry = getEntryForSlot(day, slot);
                        return (
                          <div key={`${day}-${slot}`} className="p-2 border-r border-slate-100 min-h-[100px] relative group">
                            {entry ? (
                              <div className="h-full rounded-xl bg-purple-50 border border-purple-100 p-3 flex flex-col gap-1 transition-all hover:shadow-md hover:border-purple-300">
                                <h4 className="font-bold text-xs text-[#6F00FF] leading-tight">{entry.data?.subjectName}</h4>
                                <div className="mt-auto space-y-1">
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                                    <BookOpen className="w-3 h-3 shrink-0" /> {entry.data?.teacherName || 'TBA'}
                                  </p>
                                  {entry.data?.room && (
                                    <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 shrink-0" /> {entry.data.room}
                                    </p>
                                  )}
                                </div>
                                
                                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 bg-white rounded-full p-1 shadow-sm transition-opacity">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setNewEntry(prev => ({ ...prev, day, timeSlot: slot }));
                                  setIsAddModalOpen(true);
                                }}
                                className="w-full h-full rounded-xl border-2 border-dashed border-transparent hover:border-purple-200 hover:bg-purple-50/50 text-transparent hover:text-purple-300 flex items-center justify-center transition-all"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-[#6F00FF] to-purple-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Schedule Class</DialogTitle>
              <DialogDescription className="text-purple-100">
                Assign a subject to a time slot for {selectedClass?.title}.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh] p-6 bg-slate-50">
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Day</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF]"
                    value={newEntry.day}
                    onChange={e => setNewEntry({...newEntry, day: e.target.value})}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Time Slot</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF]"
                    value={newEntry.timeSlot}
                    onChange={e => setNewEntry({...newEntry, timeSlot: e.target.value})}
                  >
                    {TIME_SLOTS.filter(s => !s.includes('Break') && !s.includes('Lunch')).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Course / Subject</label>
                <select 
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF]"
                  value={newEntry.courseId}
                  onChange={e => setNewEntry({...newEntry, courseId: e.target.value})}
                >
                  <option value="">Select an enrolled course...</option>
                  {availableCoursesForClass.map(c => (
                    <option key={c.id} value={c.id}>{c.data?.subjectName} ({c.data?.teacherName})</option>
                  ))}
                </select>
                {availableCoursesForClass.length === 0 && (
                  <p className="text-xs text-rose-500 font-medium mt-1">This class has no courses assigned yet. Create courses first.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Room Override (Optional)</label>
                <Input 
                  placeholder={`Default: ${selectedClass?.data?.room || 'TBA'}`}
                  className="bg-white border-slate-200 rounded-xl h-11"
                  value={newEntry.room}
                  onChange={e => setNewEntry({...newEntry, room: e.target.value})}
                />
                <p className="text-xs text-slate-400">Leave blank to use the default class room.</p>
              </div>

            </div>
          </ScrollArea>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600">
              Cancel
            </Button>
            <Button 
              onClick={handleAddEntry} 
              disabled={!newEntry.courseId}
              className="rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white font-bold"
            >
              Add to Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
