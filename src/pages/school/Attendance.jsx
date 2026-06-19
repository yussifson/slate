import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { CalendarDays, Check, X, Clock, Users, ClipboardList } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { toast } from 'react-hot-toast';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const CLASS_LIST = ['Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'];

export default function Attendance() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const today = new Date().toISOString().split('T')[0];
  const [selectedClass, setSelectedClass] = useState('Grade 9A');
  const [date, setDate] = useState(today);
  const [statusMap, setStatusMap] = useState({});

  const { data: studentRecords = [] } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }),
    enabled: !!companyId
  });
  
  const { data: attendanceRecords = [] } = useIndustryRecords('attendance');
  const mutateRecord = useMutateIndustryRecord();

  const classStudents = studentRecords
    .filter(r => {
      let extra = {};
      try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
      return extra.class === selectedClass;
    })
    .map(r => ({ id: r.id, name: r.name || 'Unknown', studentId: r.id_number || '' }));

  const savedAttendance = attendanceRecords.map(r => ({ id: r.id, ...r.data }));
  const existingRecord = savedAttendance.find(a => a.className === selectedClass && a.date === date);

  // Initialize statusMap if existing record found
  if (existingRecord && Object.keys(statusMap).length === 0 && classStudents.length > 0) {
    const newMap = {};
    if (Array.isArray(existingRecord.records)) {
      existingRecord.records.forEach(r => { newMap[r.studentId] = r.status; });
    }
    setStatusMap(newMap);
  }

  const handleToggle = (studentId, currentStatus) => {
    const sequence = ['Present', 'Absent', 'Late'];
    let nextIdx = sequence.indexOf(currentStatus) + 1;
    if (nextIdx >= sequence.length) nextIdx = 0;
    setStatusMap(prev => ({ ...prev, [studentId]: sequence[nextIdx] }));
  };

  const handleBulkMark = (status) => {
    const newMap = { ...statusMap };
    classStudents.forEach(s => newMap[s.id] = status);
    setStatusMap(newMap);
  };

  const handleSubmit = () => {
    if (Object.keys(statusMap).length === 0) return toast.error('Mark attendance first.');

    const records = classStudents.map(s => ({
      studentId: s.studentId,
      studentName: s.name,
      status: statusMap[s.id] || 'Present'}));

    mutateRecord.mutate({
      id: existingRecord?.id,
      recordType: 'attendance',
      payload: { date, className: selectedClass, takenBy: 'Staff', records },
      status: 'active',
      searchText: `${selectedClass} ${date}`
    }, {
      onSuccess: () => toast.success('Attendance saved!'),
      onError: (err) => toast.error('Failed: ' + err.message)
    });
  };

  return (
    <div className="space-y-6 font-dmsans max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-green-500/10 p-6 text-white border-2 border-green-600">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase tracking-[-0.02em] tracking-[0.04em]">Daily Roster</h1>
          <p className="font-medium text-green-100">Bulk toggle attendance records rapidly</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="date" 
            value={date} 
            onChange={e => { setDate(e.target.value); setStatusMap({}); }} 
            className="bg-white text-green-900 border-2 border-green-800 px-3 py-2 font-semibold focus:outline-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          />
          <select 
            value={selectedClass} 
            onChange={e => { setSelectedClass(e.target.value); setStatusMap({}); }} 
            className="bg-white text-green-900 border-2 border-green-800 px-3 py-2 font-semibold focus:outline-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          >
            {CLASS_LIST.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border-2 border-green-800 p-4 flex gap-4 overflow-x-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <button onClick={() => handleBulkMark('Present')} className="flex-1 py-3 bg-green-100 border-2 border-green-500 text-green-800 font-semibold hover:bg-green-200 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2 tracking-[0.04em]"><Check className="w-4 h-4"/> Mark All Present</button>
        <button onClick={() => handleBulkMark('Absent')} className="flex-1 py-3 bg-red-100 border-2 border-red-500 text-red-800 font-semibold hover:bg-red-200 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2 tracking-[0.04em]"><X className="w-4 h-4"/> Mark All Absent</button>
        <button onClick={() => handleBulkMark('Late')} className="flex-1 py-3 bg-amber-100 border-2 border-amber-500 text-amber-800 font-semibold hover:bg-amber-200 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2 tracking-[0.04em]"><Clock className="w-4 h-4"/> Mark All Late</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {classStudents.map(student => {
          const status = statusMap[student.id] || 'Present';
          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={student.id}
              onClick={() => handleToggle(student.id, status)}
              className={`p-4 border-2 text-left flex flex-col justify-between h-32 transition-colors ${
                status === 'Present' ? 'bg-green-50 border-green-500' :
                status === 'Absent' ? 'bg-red-50 border-red-500' :
                'bg-amber-50 border-amber-500'
              }`}
            >
              <div>
                <p className="font-semibold text-lg text-slate-900 leading-tight">{student.name}</p>
                <p className="text-xs font-mono font-semibold text-slate-500 mt-1 tracking-[0.04em]">{student.studentId}</p>
              </div>
              <div className="flex justify-between items-end">
                <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 border-2 ${
                  status === 'Present' ? 'bg-green-200 border-green-600 text-green-900' :
                  status === 'Absent' ? 'bg-red-200 border-red-600 text-red-900' :
                  'bg-amber-200 border-amber-600 text-amber-900'
                }`}>
                  {status}
                </span>
                {status === 'Present' && <Check className="w-6 h-6 text-green-600 stroke-[3]" />}
                {status === 'Absent' && <X className="w-6 h-6 text-red-600 stroke-[3]" />}
                {status === 'Late' && <Clock className="w-6 h-6 text-amber-600 stroke-[3]" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {classStudents.length > 0 && (
        <button 
          onClick={handleSubmit} 
          disabled={mutateRecord.isPending}
          className="w-full py-4 bg-green-600 text-white font-black text-xl tracking-widest uppercase border-4 border-green-900 hover:bg-green-500/10 transition-colors disabled:opacity-50 tracking-[0.04em]"
        >
          {mutateRecord.isPending ? 'Saving...' : 'Save Register'}
        </button>
      )}
    </div>
  );
}
