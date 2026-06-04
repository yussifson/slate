import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, Clock } from "lucide-react";

export default function SHSTimetable() {
  const { t } = useTranslation();
  const [activeDay, setActiveDay] = useState('Monday');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const schedule = [
    { time: '08:00 AM - 09:30 AM', subject: 'Core Mathematics', teacher: 'Mr. Osei', room: 'Block A, Rm 1' },
    { time: '09:30 AM - 11:00 AM', subject: 'Integrated Science', teacher: 'Mrs. Mensah', room: 'Lab 2' },
    { time: '11:00 AM - 11:30 AM', subject: 'BREAK', teacher: '', room: '' },
    { time: '11:30 AM - 01:00 PM', subject: 'English Language', teacher: 'Miss Baidoo', room: 'Block A, Rm 1' },
    { time: '01:00 PM - 02:30 PM', subject: 'Social Studies', teacher: 'Mr. Kumi', room: 'Block A, Rm 1' },
  ];

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("timetable", "Class Timetable")} 
        subtitle="Manage master schedules for classes and teachers." 
        metrics={[
          { title: "Active Periods", value: "45 / week", icon: Clock }
        ]}
      />
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex gap-2 overflow-x-auto">
          {days.map(day => (
            <button 
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeDay === day ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              {day}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900">{activeDay} Schedule - Form 1 Science A</h3>
            <Button size="sm" variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Add Period</Button>
          </div>
          
          <div className="space-y-3">
            {schedule.map((s, i) => (
              <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${s.subject === 'BREAK' ? 'bg-slate-50 border-slate-200 border-dashed' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-24 shrink-0 text-sm font-bold text-slate-500">{s.time.split(' - ')[0]}</div>
                  <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                  <div>
                    <h4 className={`font-bold ${s.subject === 'BREAK' ? 'text-slate-400 uppercase tracking-widest' : 'text-slate-900'}`}>{s.subject}</h4>
                    {s.teacher && <p className="text-xs text-slate-500 mt-1">{s.teacher} • {s.room}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
