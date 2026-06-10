import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, Mail, Phone, Building2, UserPlus, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivHREmployee() {
  const companyId = useCompanyId();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    if (companyId) {
      fetchEmployees();
      const channel = supabase.channel('hr_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_hr_employees', filter: `company_id=eq.${companyId}` }, () => {
          fetchEmployees();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_hr_employees')
        .select('*')
        .eq('company_id', companyId)
        .order('first_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setEmployees(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    const newEmp = {
      company_id: companyId,
      first_name: 'New',
      last_name: 'Employee',
      email: `new${Math.floor(Math.random() * 1000)}@company.com`,
      role_title: 'Staff',
      department: 'General',
      status: 'Onboarding'
    };
    try {
      const { error } = await supabase.from('univ_hr_employees').insert(newEmp);
      if (error) throw error;
      toast.success('Employee added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add employee');
    }
  };

  const filtered = employees.filter(e => 
    `${e.first_name} ${e.last_name} ${e.email} ${e.department} ${e.role_title}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search directory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Grid</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>List</button>
          </div>
        </div>
        <button onClick={handleAddEmployee} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <UserPlus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Directory Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            <AnimatePresence>
              {filtered.map(emp => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={emp.id} 
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-muted-foreground hover:text-primary"><MoreHorizontal className="w-5 h-5" /></button>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-background shadow-sm flex items-center justify-center text-primary text-2xl font-bold mb-3">
                      {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-base text-foreground">{emp.first_name} {emp.last_name}</h3>
                    <p className="text-sm font-medium text-primary mt-0.5">{emp.role_title}</p>
                    
                    <div className="w-full mt-4 pt-4 border-t border-border/50 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{emp.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{emp.email}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 w-full flex justify-between items-center">
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md border ${
                        emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        emp.status === 'Onboarding' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {emp.status}
                      </span>
                      <button className="text-xs font-semibold text-primary hover:underline">View Profile</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p>No employees found.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
             <table className="w-full text-left text-sm">
               <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                 <tr>
                   <th className="p-4 font-semibold">Employee</th>
                   <th className="p-4 font-semibold">Role</th>
                   <th className="p-4 font-semibold">Department</th>
                   <th className="p-4 font-semibold">Status</th>
                   <th className="p-4 font-semibold text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border">
                 {filtered.map(emp => (
                   <tr key={emp.id} className="hover:bg-muted/30 transition-colors group">
                     <td className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                           {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                         </div>
                         <div>
                           <div className="font-bold text-foreground">{emp.first_name} {emp.last_name}</div>
                           <div className="text-xs text-muted-foreground">{emp.email}</div>
                         </div>
                       </div>
                     </td>
                     <td className="p-4 text-foreground font-medium">{emp.role_title}</td>
                     <td className="p-4 text-muted-foreground">{emp.department}</td>
                     <td className="p-4">
                       <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border ${
                          emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          emp.status === 'Onboarding' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {emp.status}
                        </span>
                     </td>
                     <td className="p-4 text-right">
                       <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
