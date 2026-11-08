import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { Plus, Trash2, Edit2, Loader2, XCircle, Search, Shield, Users, Key, Check} from 'lucide-react';
import { toast} from 'react-hot-toast';
import { motion, AnimatePresence} from 'framer-motion';

import { getIndustryNav } from '@/config/industries';
import { DEFAULT_PLATFORM_ROLES } from '@/config/jclRolePermissions';
import { Link } from 'react-router-dom';
// We will build features dynamically based on the industry
const DEFAULT_GLOBAL_FEATURES = [
  'Dashboard', 'Access Control', 'Documents', 'Projects', 'CRM Leads',
  'Invoices', 'HR Employees', 'Inventory', 'Messaging', 'Support Tickets',
  'Appointments', 'Payroll', 'Asset Management', 'Procurement', 'Analytics'
];

export default function UnivAccessControl() {
 const companyId = useCompanyId();
 const [activeTab, setActiveTab] = useState('roles'); // 'users' or 'roles'
 const [loading, setLoading] = useState(true);

 // Users State
 const [users, setUsers] = useState([]);
 const [userModal, setUserModal] = useState(false);
 const [editingUserId, setEditingUserId] = useState(null);
 const [userForm, setUserForm] = useState({ user_name: '', email: '', role: '', status: 'Active', default_password: ''});

 // Roles State
 const [roles, setRoles] = useState([]);
 const [roleModal, setRoleModal] = useState(false);
 const [editingRoleId, setEditingRoleId] = useState(null);
 const [availableFeatures, setAvailableFeatures] = useState(DEFAULT_GLOBAL_FEATURES);
 const [roleForm, setRoleForm] = useState({ role_name: '', permissions: {} });

 useEffect(() => { 
  if (companyId) {
    fetchIndustryNav();
    fetchData();
  }
 }, [companyId]);

 const fetchIndustryNav = async () => {
   try {
     const __res = await powerSync.execute('SELECT industry_type FROM companies WHERE id = ? LIMIT 1', [companyId]);
     const industry_type = __res.rows._array[0]?.industry_type || 'law';
     const navItems = getIndustryNav(industry_type);
     
     // Build feature list from nav items and sections
     const features = new Set();
     navItems.forEach(n => {
       if (n.label) features.add(n.label);
       if (n.section) features.add(n.section);
     });
     
     const featureList = Array.from(features);
     setAvailableFeatures(featureList);
     
     // Initialize default perms
     const defaultPerms = featureList.reduce((acc, feat) => {
       acc[feat] = { read: false, write: false, delete: false};
       return acc;
     }, {});
     
     // Update role form if it's empty
     setRoleForm(prev => ({
       ...prev,
       permissions: Object.keys(prev.permissions).length > 0 ? prev.permissions : defaultPerms
     }));
   } catch(e) {
     console.error("Failed to fetch industry nav", e);
   }
 };

 const fetchData = async () => {
 setLoading(true);
 try {
 // Fetch users
 const __resU = await powerSync.execute(`SELECT * FROM univ_accesscontrols WHERE company_id = ?`, [companyId]); 
 const uData = __resU.rows ? (__resU.rows._array || Array.from(__resU.rows)) : [];
 if (uData) setUsers(uData);

  // Fetch roles
  const __resR = await powerSync.execute(`SELECT * FROM univ_roles WHERE company_id = ?`, [companyId]); 
  const rData = __resR.rows ? (__resR.rows._array || Array.from(__resR.rows)) : [];
  // Match predefined roles with any saved overrides in univ_roles
  const predefinedRoles = DEFAULT_PLATFORM_ROLES.map(r => {
    const saved = rData.find(item => item.id === r.id || item.role_name === r.label || item.role_name?.toLowerCase() === r.id);
    return {
      id: r.id,
      role_name: r.label,
      description: r.description + ' (' + r.department + ')',
      department: r.department,
      permissions: saved?.permissions || availableFeatures.reduce((acc, feat) => {
        acc[feat] = { read: true, write: true, delete: false };
        return acc;
      }, {}),
      is_predefined: true,
      has_override: !!saved
    };
  });

  // Include custom roles (roles that do not match predefined IDs)
  const customRoles = rData.filter(item => !DEFAULT_PLATFORM_ROLES.some(r => r.id === item.id || r.label === item.role_name || r.id === item.role_name?.toLowerCase()));
  setRoles([...predefinedRoles, ...customRoles]);
} catch (e) {
 console.error(e);
} finally {
 setLoading(false);
}
};

 /* --- USERS LOGIC --- */
 const saveUser = async (e) => {
 e.preventDefault();
 const payload = { ...userForm, company_id: companyId};
 
 // Cleanup deprecated fields if necessary
 payload.resource = 'Managed by Role';
 payload.permission_level = 'Managed by Role';

 if (payload.role === 'Company Admin' || payload.role === 'Managing Partner') {
   payload.role = 'company_admin';
 }

 if (!editingUserId) {
 // Register auth user first
 const { registerSchoolUser} = await import('@/api/authUtils');
 const tempPass = payload.default_password || Math.random().toString(36).slice(-8) + 'A1!';
 const { error: authError} = await registerSchoolUser(
 payload.email,
 tempPass,
 payload.role,
 companyId,
 payload.user_name
 );

 if (authError && authError.message !== 'already registered in this firm' && authError.message !== 'User already exists globally') {
 toast.error('Failed to register auth user: ' + authError.message);
 return;
}
 
 // If the user already existed globally, we don't need a temp password
 if (authError && authError.message === 'User already exists globally') {
 payload.default_password = 'Use existing password';
} else {
 payload.default_password = tempPass;
}
}

 await (async () => {
 const _payload = editingUserId ? payload : { id: crypto.randomUUID(), ...payload };
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 if (editingUserId) {
 await powerSync.execute(`UPDATE univ_accesscontrols SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingUserId]);
} else {
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_accesscontrols (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
}
})();
 const error = null;
 
 if (error) { toast.error('Failed to save user access control record'); return;}
 
 if (!editingUserId) {
 if (payload.default_password === 'Use existing password') {
 toast.success(`User Added! They can log in with their existing password.`, { duration: 6000});
} else {
 toast.success(`User Added! Temp password: ${payload.default_password}`, { duration: 10000});
}
} else {
 toast.success('User Updated');
}
 
 setUserModal(false); fetchData();
};

 const deleteUser = async (id) => {
 await powerSync.execute(`DELETE FROM univ_accesscontrols WHERE id = ?`, [id]);
 const error = null;
 if (!error) { toast.success('User removed'); fetchData();}
};

 const openUserModal = (u = null) => {
 setUserForm(u ? { ...u} : { user_name: '', email: '', role: '', status: 'Active', default_password: ''});
 setEditingUserId(u?.id || null);
 setUserModal(true);
};

 /* --- ROLES LOGIC --- */
 const saveRole = async (e) => {
   e.preventDefault();
   const roleId = editingRoleId || crypto.randomUUID();
   const payload = {
     id: roleId,
     company_id: companyId,
     role_name: roleForm.role_name,
     permissions: roleForm.permissions || {},
     created_at: new Date().toISOString()
   };
   
   try {
     // 1. Direct Supabase upsert to sync across all web and mobile apps immediately
     await supabase.from('univ_roles').upsert({
       id: payload.id,
       company_id: payload.company_id,
       role_name: payload.role_name,
       permissions: payload.permissions
     }, { onConflict: 'id' });

     // 2. Local PowerSync write
     const _vals = [payload.id, payload.company_id, payload.role_name, JSON.stringify(payload.permissions), payload.created_at];
     const existing = await powerSync.getOptional('SELECT id FROM univ_roles WHERE id = ?', [payload.id]);
     if (existing) {
       await powerSync.execute('UPDATE univ_roles SET company_id = ?, role_name = ?, permissions = ? WHERE id = ?', [payload.company_id, payload.role_name, JSON.stringify(payload.permissions), payload.id]);
     } else {
       await powerSync.execute('INSERT INTO univ_roles (id, company_id, role_name, permissions, created_at) VALUES (?, ?, ?, ?, ?)', _vals);
     }
     toast.success(editingRoleId ? 'Role permissions updated successfully' : 'Role created successfully');
     setRoleModal(false);
     fetchData();
   } catch (err) {
     console.error('Failed to save role:', err);
     toast.error('Failed to save role: ' + (err.message || 'Error'));
   }
 };

 const deleteRole = async (id) => {
 await powerSync.execute(`DELETE FROM univ_roles WHERE id = ?`, [id]);
 const error = null;
 if (!error) { toast.success('Role removed'); fetchData();}
};

 const openRoleModal = (r = null) => {
 setRoleForm(r ? { role_name: r.role_name, permissions: r.permissions || {} } : { role_name: '', permissions: {} });
 setEditingRoleId(r?.id || null);
 setRoleModal(true);
};

 const togglePermission = (feature, level) => {
 setRoleForm(prev => {
 const currentVal = prev.permissions[feature]?.[level] || false;
 return {
 ...prev,
 permissions: {
 ...prev.permissions,
 [feature]: {
 ...prev.permissions[feature],
 [level]: !currentVal
}
}
}
});
};

 return (
  <div className="w-full max-w-full overflow-x-hidden flex flex-col gap-4 font-sans">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 tracking-[-0.02em]">
          <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" /> Roles & Permissions
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">Configure role definitions and access permissions.</p>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <Link 
          to="/employees" 
          className="flex-1 sm:flex-initial h-9 px-3 sm:px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border border-border shrink-0"
        >
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span className="hidden sm:inline">Manage Employees</span>
          <span className="sm:hidden">Employees</span>
        </Link>
        <button 
          onClick={() => openRoleModal()} 
          className="flex-1 sm:flex-initial h-9 px-3 sm:px-4 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-xs shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Create Custom Role</span>
          <span className="sm:hidden">Add Role</span>
        </button>
      </div>
    </div>

    <div className="w-full max-w-full flex-1 bg-card border-[0.5px] border-border rounded-2xl overflow-hidden flex flex-col shadow-xs">
      <div className="p-3 sm:p-4 border-b border-border flex justify-between items-center bg-muted/20">
        <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <Key className="w-4 h-4 text-primary shrink-0" /> System Roles & Permissions
        </h2>
        <span className="text-xs text-muted-foreground font-medium hidden md:inline">
          To assign roles to staff, visit the <strong>Employees</strong> directory.
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="w-full max-w-full flex-1 overflow-x-hidden p-3 sm:p-6">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {roles.map(r => (
              <div 
                key={r.id} 
                className="w-full max-w-full bg-background border-[0.5px] border-border rounded-2xl p-4 sm:p-5 relative group hover:border-primary/50 transition-colors shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{r.role_name}</h3>
                          {r.is_predefined && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-primary/10 text-primary rounded-full uppercase tracking-wider shrink-0">
                              Default
                            </span>
                          )}
                        </div>
                        {r.department && (
                          <p className="text-[11px] text-muted-foreground truncate">{r.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => openRoleModal(r)} 
                        className="p-1.5 bg-primary/10 rounded-xl text-primary hover:bg-primary/20 transition-colors"
                        title="Edit Role Permissions"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!r.is_predefined && (
                        <button 
                          onClick={() => deleteRole(r.id)} 
                          className="p-1.5 bg-red-500/10 text-destructive rounded-xl hover:bg-red-500/20 transition-colors"
                          title="Delete Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {r.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground pt-3 border-t border-border/60">
                  <p className="font-semibold uppercase text-[10px] tracking-wider mb-2 text-foreground/80">
                    Enabled Access
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(r.permissions || {}).filter(k => r.permissions[k]?.read || r.permissions[k]?.write).slice(0, 6).map(feat => (
                      <span key={feat} className="px-2 py-0.5 bg-muted rounded-md text-[11px] font-medium text-foreground">
                        {feat}
                      </span>
                    ))}
                    {Object.keys(r.permissions || {}).filter(k => r.permissions[k]?.read || r.permissions[k]?.write).length > 6 && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[11px] font-semibold">
                        +{Object.keys(r.permissions || {}).filter(k => r.permissions[k]?.read || r.permissions[k]?.write).length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                No roles defined. Create your first Role!
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  {/* User Modal */}
 {userModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
 <div className="bg-card w-full max-w-md rounded-2xl flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 flex justify-between items-center">
 <h2 className="text-xl font-black">{editingUserId ? 'Edit User' : 'Add User'}</h2>
 <button onClick={() => setUserModal(false)} className="p-2 hover:bg-muted rounded-full"><XCircle className="w-5 h-5" /></button>
 </div>
 <form onSubmit={saveUser} className="p-5 flex flex-col gap-4">
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">User Name</label><input required type="text" value={userForm.user_name} onChange={e => setUserForm({...userForm, user_name: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" /></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Email</label><input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" /></div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Assign Role</label>
 <select required value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none">
 <option value="">Select a role...</option>
 {roles.map(r => <option key={r.id} value={r.role_name}>{r.role_name}</option>)}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Status</label><select value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"><option>Active</option><option>Suspended</option></select></div>
 <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Default Password</label><input type="text" value={userForm.default_password} onChange={e => setUserForm({...userForm, default_password: e.target.value})} placeholder="e.g. Temp123!" className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" /></div>
 </div>
 <div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => setUserModal(false)} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold ">{editingUserId ? 'Update' : 'Add User'}</button></div>
 </form>
 </div>
 </div>
 )}

 {/* Role & Permission Matrix Modal */}
 {roleModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
 <div className="bg-card w-full max-w-4xl rounded-2xl flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 flex justify-between items-center shrink-0">
 <h2 className="text-xl font-black flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> {editingRoleId ? 'Edit Role Permissions' : 'Define New Role'}</h2>
 <button onClick={() => setRoleModal(false)} className="p-2 hover:bg-muted rounded-full"><XCircle className="w-5 h-5" /></button>
 </div>
 
 <div className="p-6 shrink-0 bg-muted/10 border-b border-primary/40">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-2 tracking-[0.04em]">Role Name</label>
 <input required type="text" value={roleForm.role_name} onChange={e => setRoleForm({...roleForm, role_name: e.target.value})} placeholder="e.g. Regional Manager, HR Admin" className="w-full max-w-md h-12 px-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-base font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none " />
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar p-6">
 <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> Granular Permission Matrix</h3>
 <div className="border-[0.5px] border-border rounded-xl overflow-x-auto w-full">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-b border-primary/40">
 <tr>
 <th className="px-4 py-3 text-left font-semibold text-[#71717a] dark:text-gray-400">Feature / Slate</th>
 <th className="px-4 py-3 text-center font-semibold text-[#71717a] dark:text-gray-400">Read Access</th>
 <th className="px-4 py-3 text-center font-semibold text-[#71717a] dark:text-gray-400">Write Access</th>
 <th className="px-4 py-3 text-center font-semibold text-[#71717a] dark:text-gray-400">Delete Access</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border-[0.5px] border-black/9 dark:border-white/8 bg-background">
 {availableFeatures.map(feat => (
 <tr key={feat} className="hover:bg-muted/20 transition-colors">
 <td className="px-4 py-3 font-semibold text-foreground">{feat}</td>
 {['read', 'write', 'delete'].map(level => {
 const isChecked = roleForm.permissions[feat]?.[level] || false;
 return (
 <td key={level} className="px-4 py-3 text-center">
 <button 
 onClick={() => togglePermission(feat, level)}
 className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors ${isChecked ? 'bg-primary text-white ' : 'bg-muted border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-transparent hover:bg-muted/80'}`}
 >
 <Check className="w-4 h-4" />
 </button>
 </td>
 )
})}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="p-5 border-t border-primary/40 flex justify-end gap-3 shrink-0 bg-background">
 <button onClick={() => setRoleModal(false)} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">Cancel</button>
 <button onClick={saveRole} disabled={!roleForm.role_name} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">Save Role</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
