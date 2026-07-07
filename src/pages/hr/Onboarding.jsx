import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, Clock, PlayCircle, UserPlus, ListTodo, Building2, Calendar as CalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function Onboarding() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsDbLoading(true);
      try {
        const empRes = await powerSync.execute('SELECT * FROM univ_hr_employees WHERE company_id = ?', [companyId]);
        if (active) setEmployees(empRes.rows._array || Array.from(empRes.rows));

        const taskRes = await powerSync.execute('SELECT * FROM univ_erp_onboarding WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if (active) setTasks(taskRes.rows._array || Array.from(taskRes.rows));
      } catch (e) {
        console.error(e);
      }
      setIsDbLoading(false);
    };
    if (companyId) fetchData();
    return () => { active = false; };
  }, [companyId]);

  const fetchTasks = async () => {
    try {
      const taskRes = await powerSync.execute('SELECT * FROM univ_erp_onboarding WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setTasks(taskRes.rows._array || Array.from(taskRes.rows));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName || !newEmployeeId) {
      toast.error('Task name and Employee are required');
      return;
    }
    try {
      await powerSync.execute(
        `INSERT INTO univ_erp_onboarding (id, created_at, company_id, employee_id, task_name, department, assigned_to, due_date, status) VALUES (gen_random_uuid(), NOW(), ?, ?, ?, ?, ?, ?, 'Pending')`,
        [companyId, newEmployeeId, newTaskName, newDepartment, '', newDueDate]
      );
      toast.success('Task assigned successfully!');
      setIsAdding(false);
      setNewTaskName('');
      setNewDueDate('');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to assign task: ' + err.message);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_erp_onboarding SET status = ? WHERE id = ?`,
        [newStatus, taskId]
      );
      toast.success(`Task marked as ${newStatus}`);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return empId;
    return emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.name || empId;
  };

  // Group tasks by employee to calculate progress
  const employeeProgress = {};
  tasks.forEach(task => {
    if (!employeeProgress[task.employee_id]) {
      employeeProgress[task.employee_id] = { total: 0, completed: 0, employeeId: task.employee_id };
    }
    employeeProgress[task.employee_id].total += 1;
    if (task.status === 'Completed') {
      employeeProgress[task.employee_id].completed += 1;
    }
  });

  const filteredTasks = tasks.filter(t => {
    const ename = getEmployeeName(t.employee_id).toLowerCase();
    const tname = (t.task_name || '').toLowerCase();
    return ename.includes(search.toLowerCase()) || tname.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 school-page-enter font-dmsans max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Onboarding</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage new hire tasks and track onboarding progress</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-primary text-white shadow-sm hover:shadow transition-all">
          <Plus className="w-4 h-4 mr-2" /> {isAdding ? 'Cancel' : 'Assign Task'}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTask} className="bg-card p-6 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Assign New Onboarding Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-[#71717a] mb-1 block">Employee</label>
              <select 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={newEmployeeId} onChange={e => setNewEmployeeId(e.target.value)} required>
                <option value="">Select Employee...</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name ? `${e.first_name} ${e.last_name || ''}` : e.name || 'Unnamed'}</option>
                ))}
                {employees.length === 0 && <option value="test-emp-1">Test Employee</option>}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717a] mb-1 block">Task Name</label>
              <Input placeholder="e.g. IT Provisioning" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717a] mb-1 block">Department</label>
              <Input placeholder="e.g. IT, HR" value={newDepartment} onChange={e => setNewDepartment(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717a] mb-1 block">Due Date</label>
              <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-primary text-white">Save Task</Button>
          </div>
        </form>
      )}

      {/* Progress Overview Section */}
      {!isDbLoading && Object.keys(employeeProgress).length > 0 && (
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 shadow-sm">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><ListTodo className="w-4 h-4 text-primary" /> Overall Onboarding Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(employeeProgress).map(ep => {
              const perc = Math.round((ep.completed / ep.total) * 100);
              return (
                <div key={ep.employeeId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate">{getEmployeeName(ep.employeeId)}</span>
                    <span className="text-[#71717a]">{ep.completed}/{ep.total} ({perc}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${perc}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-primary/40 bg-muted/50 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
            <Input placeholder="Search tasks or employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>

        {isDbLoading ? (
          <div className="p-8 text-center text-[#71717a]">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[#71717a] dark:text-gray-400 uppercase bg-muted/50 border-b border-primary/40">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Task Name</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Employee</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Department</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Due Date</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em]">Status</th>
                  <th className="px-6 py-4 font-semibold tracking-[0.04em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-primary/40" />
                      {task.task_name}
                    </td>
                    <td className="px-6 py-4">{getEmployeeName(task.employee_id)}</td>
                    <td className="px-6 py-4">
                      {task.department ? (
                        <span className="flex items-center gap-1.5 text-[#71717a]"><Building2 className="w-3.5 h-3.5"/> {task.department}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {task.due_date ? (
                        <span className="flex items-center gap-1.5 text-[#71717a]"><CalIcon className="w-3.5 h-3.5"/> {task.due_date}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {task.status === 'Completed' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                        </span>
                      ) : task.status === 'In Progress' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                          <PlayCircle className="w-3 h-3 mr-1" /> In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {task.status !== 'In Progress' && task.status !== 'Completed' && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleStatusChange(task.id, 'In Progress')}>
                            Start
                          </Button>
                        )}
                        {task.status !== 'Completed' && (
                          <Button size="sm" variant="outline" className="h-8 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20" onClick={() => handleStatusChange(task.id, 'Completed')}>
                            Complete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#71717a] dark:text-gray-400">No onboarding tasks found.</td>
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
