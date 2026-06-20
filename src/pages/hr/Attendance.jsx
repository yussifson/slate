import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Clock, Search, Plus, Calendar, CheckCircle2, XCircle, MoreVertical, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function Attendance() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsDbLoading(true);
      try {
        const empRes = await powerSync.execute('SELECT * FROM univ_hr_employees WHERE company_id = ?', [companyId]);
        if (active) setEmployees(empRes.rows._array || Array.from(empRes.rows));

        const attRes = await powerSync.execute('SELECT * FROM univ_hr_attendance WHERE company_id = ? ORDER BY date DESC, created_at DESC', [companyId]);
        if (active) setAttendance(attRes.rows._array || Array.from(attRes.rows));
      } catch (e) {
        console.error(e);
      }
      setIsDbLoading(false);
    };
    if (companyId) fetchData();
    return () => { active = false; };
  }, [companyId]);

  const handleClockIn = async (employeeId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      await powerSync.execute(
        `INSERT INTO univ_hr_attendance (id, created_at, company_id, employee_id, date, clock_in, status) VALUES (gen_random_uuid(), NOW(), ?, ?, ?, ?, 'Present')`,
        [companyId, employeeId, today, now]
      );
      toast.success('Clocked in successfully!');
      
      const attRes = await powerSync.execute('SELECT * FROM univ_hr_attendance WHERE company_id = ? ORDER BY date DESC, created_at DESC', [companyId]);
      setAttendance(attRes.rows._array || Array.from(attRes.rows));
    } catch (err) {
      toast.error('Failed to clock in: ' + err.message);
    }
  };

  const handleClockOut = async (attendanceId) => {
    try {
      const now = new Date().toISOString();
      await powerSync.execute(
        `UPDATE univ_hr_attendance SET clock_out = ? WHERE id = ?`,
        [now, attendanceId]
      );
      toast.success('Clocked out successfully!');
      
      const attRes = await powerSync.execute('SELECT * FROM univ_hr_attendance WHERE company_id = ? ORDER BY date DESC, created_at DESC', [companyId]);
      setAttendance(attRes.rows._array || Array.from(attRes.rows));
    } catch (err) {
      toast.error('Failed to clock out: ' + err.message);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  
  const filteredEmployees = employees.filter(e => {
    const name = e.first_name ? `${e.first_name} ${e.last_name || ''}` : e.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">Attendance & Time Tracking</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">Track employee check-ins and hours worked</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4">
          <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Total Employees</p>
          <h2 className="text-2xl font-semibold text-card-foreground">{employees.length}</h2>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4">
          <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Present Today</p>
          <h2 className="text-2xl font-semibold text-card-foreground">{attendance.filter(a => a.date === todayStr && a.status === 'Present').length}</h2>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4">
          <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Absent Today</p>
          <h2 className="text-2xl font-semibold text-card-foreground">{employees.length - attendance.filter(a => a.date === todayStr && a.status === 'Present').length}</h2>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-muted/50 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
            <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>

        {isDbLoading ? (
          <div className="p-8 text-center text-[#71717a]">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[#71717a] dark:text-gray-400 uppercase bg-muted/50 border-b border-primary/40">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Employee</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Date</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Status</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Clock In</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Clock Out</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {filteredEmployees.map(emp => {
                  const name = emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.name || 'Unnamed';
                  const todaysAtt = attendance.find(a => a.employee_id === emp.id && a.date === todayStr);
                  
                  return (
                    <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{name}</td>
                      <td className="px-6 py-4">{todayStr}</td>
                      <td className="px-6 py-4">
                        {todaysAtt ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3 mr-1" /> Absent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#71717a]">
                        {todaysAtt?.clock_in ? new Date(todaysAtt.clock_in).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-[#71717a]">
                        {todaysAtt?.clock_out ? new Date(todaysAtt.clock_out).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!todaysAtt ? (
                          <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleClockIn(emp.id)}>
                            Clock In
                          </Button>
                        ) : !todaysAtt.clock_out ? (
                          <Button size="sm" variant="outline" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleClockOut(todaysAtt.id)}>
                            Clock Out
                          </Button>
                        ) : (
                          <span className="text-xs text-[#71717a]">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#71717a]">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
