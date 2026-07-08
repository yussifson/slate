import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, Clock, PlayCircle, UserPlus, ListTodo, Building2, Calendar as CalIcon, Sparkles, AlertCircle } from 'lucide-react';
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
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 h-[calc(100vh-4rem)] p-4 lg:p-8 font-dmsans flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-500" />
              Onboarding Experience
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Orchestrate seamless transitions for your new team members.</p>
          </div>
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/50 rounded-full px-6 py-5 transition-all duration-300 hover:scale-105"
          >
            {isAdding ? (
              <><Plus className="w-5 h-5 mr-2 rotate-45 transition-transform" /> Cancel</>
            ) : (
              <><Plus className="w-5 h-5 mr-2" /> Assign New Task</>
            )}
          </Button>
        </div>

        {/* Add Task Form (Glassmorphic) */}
        {isAdding && (
          <form onSubmit={handleAddTask} className="relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 p-8 shadow-2xl shadow-indigo-100/50 dark:shadow-black/50 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
              <UserPlus className="w-6 h-6 text-indigo-500" /> 
              Create Task Assignment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</label>
                <select 
                  className="w-full h-12 rounded-xl border-0 bg-white/80 dark:bg-slate-800/80 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 px-4 text-sm transition-all"
                  value={newEmployeeId} onChange={e => setNewEmployeeId(e.target.value)} required>
                  <option value="">Select Employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.first_name ? `${e.first_name} ${e.last_name || ''}` : e.name || 'Unnamed'}</option>
                  ))}
                  {employees.length === 0 && <option value="test-emp-1">Test Employee</option>}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task Name</label>
                <Input 
                  className="h-12 rounded-xl border-0 bg-white/80 dark:bg-slate-800/80 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 px-4 transition-all"
                  placeholder="e.g. IT Provisioning" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</label>
                <Input 
                  className="h-12 rounded-xl border-0 bg-white/80 dark:bg-slate-800/80 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 px-4 transition-all"
                  placeholder="e.g. IT, HR" value={newDepartment} onChange={e => setNewDepartment(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</label>
                <Input 
                  className="h-12 rounded-xl border-0 bg-white/80 dark:bg-slate-800/80 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 px-4 transition-all"
                  type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end pt-8 relative z-10">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-12 shadow-md shadow-indigo-200 dark:shadow-none transition-all hover:scale-105">
                Assign to Employee
              </Button>
            </div>
          </form>
        )}

        {/* Progress Overview Section */}
        {!isDbLoading && Object.keys(employeeProgress).length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2 px-2">
              <ListTodo className="w-5 h-5 text-purple-500" /> 
              Progress Dashboard
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.values(employeeProgress).map(ep => {
                const perc = Math.round((ep.completed / ep.total) * 100);
                return (
                  <div key={ep.employeeId} className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg shadow-inner">
                        {getEmployeeName(ep.employeeId).charAt(0).toUpperCase()}
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {perc}%
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate mb-1">{getEmployeeName(ep.employeeId)}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">{ep.completed} of {ep.total} tasks complete</p>
                    
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out relative" 
                        style={{ width: `${perc}%` }}
                      >
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]"></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Search & Tasks Grid */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-2">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" /> 
              Active Tasks
            </h3>
            <div className="relative w-full sm:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <Input 
                placeholder="Search tasks or people..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-11 h-12 w-full rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/50 dark:border-slate-800 shadow-sm focus:bg-white dark:focus:bg-slate-900 transition-all text-sm" 
              />
            </div>
          </div>

          {isDbLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="mt-4 font-medium text-slate-500">Syncing tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No tasks found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your search or assign a new task.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTasks.map(task => (
                <div key={task.id} className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                  
                  {/* Decorative corner blur */}
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                      task.status === 'Completed' ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800/50' : 
                      task.status === 'In Progress' ? 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800/50' : 
                      'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800/50'
                    }`}>
                      {task.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : 
                       task.status === 'In Progress' ? <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> : 
                       <Clock className="w-3.5 h-3.5 mr-1.5" />}
                      {task.status}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <ListTodo className="w-4 h-4" />
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 leading-tight relative z-10">
                    {task.task_name}
                  </h4>

                  <div className="space-y-3 mb-6 flex-1 relative z-10">
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3 text-xs font-bold">
                        {getEmployeeName(task.employee_id).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium truncate">{getEmployeeName(task.employee_id)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {task.department && (
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                          <Building2 className="w-3.5 h-3.5 mr-2 text-slate-400" />
                          <span className="truncate">{task.department}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                          <CalIcon className="w-3.5 h-3.5 mr-2 text-slate-400" />
                          <span className="truncate">{task.due_date}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
                    {task.status !== 'In Progress' && task.status !== 'Completed' && (
                      <Button 
                        onClick={() => handleStatusChange(task.id, 'In Progress')}
                        className="flex-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 shadow-sm transition-all rounded-xl"
                      >
                        Start Task
                      </Button>
                    )}
                    {task.status !== 'Completed' && (
                      <Button 
                        onClick={() => handleStatusChange(task.id, 'Completed')}
                        className={`flex-1 text-white shadow-sm transition-all rounded-xl ${
                          task.status === 'In Progress' 
                            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none' 
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50'
                        }`}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
