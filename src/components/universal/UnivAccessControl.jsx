import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { Plus, Trash2, Edit2, Loader2, XCircle, Search, Shield, Users, Key, Check} from 'lucide-react';
import { toast} from 'react-hot-toast';
import { motion, AnimatePresence} from 'framer-motion';

// Master list of available features to govern
const AVAILABLE_FEATURES = [
 'Dashboard', 'Access Control', 'Documents', 'Projects', 'CRM Leads',
 'Invoices', 'HR Employees', 'Inventory', 'Messaging', 'Support Tickets',
 'Appointments', 'Payroll', 'Asset Management', 'Procurement', 'Analytics'
];

const DEFAULT_PERMS = AVAILABLE_FEATURES.reduce((acc, feat) => {
 acc[feat] = { read: false, write: false, delete: false};
 return acc;
}, {});

export default function UnivAccessControl() {
 const companyId = useCompanyId();
 const [activeTab, setActiveTab] = useState('users'); // 'users' or 'roles'
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
 const [roleForm, setRoleForm] = useState({ role_name: '', permissions: DEFAULT_PERMS});

 useEffect(() => { 
 if (companyId) {
 fetchData();
}
}, [companyId]);

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
 if (rData) setRoles(rData);
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
 const _payload = payload;
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
 const payload = { ...roleForm, company_id: companyId};
 
 await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 if (editingRoleId) {
 await powerSync.execute(`UPDATE univ_roles SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingRoleId]);
} else {
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_roles (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
}
})();
 const error = null;
 
 if (error) { toast.error('Failed to save role'); return;}
 toast.success(editingRoleId ? 'Role Updated' : 'Role Created');
 setRoleModal(false); fetchData();
};

 const deleteRole = async (id) => {
 await powerSync.execute(`DELETE FROM univ_roles WHERE id = ?`, [id]);
 const error = null;
 if (!error) { toast.success('Role removed'); fetchData();}
};

 const openRoleModal = (r = null) => {
 setRoleForm(r ? { role_name: r.role_name, permissions: { ...DEFAULT_PERMS, ...(r.permissions || {})}} : { role_name: '', permissions: DEFAULT_PERMS});
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
 <div className="h-full flex flex-col gap-6 p-6 bg-background overflow-hidden">
 {/* Header */}
 <div className="view-header flex items-center justify-between shrink-0">
 <div>
 <h1 className="text-2xl font-black text-foreground flex items-center gap-2 tracking-[-0.02em]">
 <Shield className="w-7 h-7 text-primary" /> RBAC Security
 </h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage users and granular role permissions.</p>
 </div>
 
 {/* Custom Tabs */}
 <div className="flex bg-muted p-1 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 ">
 <button 
 onClick={() => setActiveTab('users')} 
 className={`px-6 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-background text-foreground' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}
 >
 <Users className="w-4 h-4" /> Users
 </button>
 <button 
 onClick={() => setActiveTab('roles')} 
 className={`px-6 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'roles' ? 'bg-background text-foreground' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}
 >
 <Key className="w-4 h-4" /> Roles & Permissions
 </button>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Sub-header for Tabs */}
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <h2 className="font-semibold text-foreground flex items-center gap-2">
 {activeTab === 'users' ? 'User Directory' : 'Defined Roles'}
 </h2>
 <button 
 onClick={() => activeTab === 'users' ? openUserModal() : openRoleModal()} 
 className="h-9 px-4 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
 >
 <Plus className="w-4 h-4" /> {activeTab === 'users' ? 'Add User' : 'Create Role'}
 </button>
 </div>

 {loading ? (
 <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
 ) : activeTab === 'users' ? (
 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-b border-primary/40 sticky top-0">
 <tr>
 <th className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">User</th>
 <th className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">Assigned Role</th>
 <th className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">Status</th>
 <th className="px-5 py-3 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {users.map(u => (
 <tr key={u.id} className="hover:bg-muted/30 transition-colors">
 <td className="px-5 py-4">
 <p className="font-semibold text-foreground">{u.user_name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{u.email}</p>
 </td>
 <td className="px-5 py-4">
 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 tracking-[0.04em]">
 {u.role || 'No Role'}
 </span>
 </td>
 <td className="px-5 py-4">
 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
 {u.status}
 </span>
 </td>
 <td className="px-5 py-4 text-right">
 <button onClick={() => openUserModal(u)} className="p-2 text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
 <button onClick={() => deleteUser(u.id)} className="p-2 text-[#71717a] dark:text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
 </td>
 </tr>
 ))}
 {users.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-[#71717a] dark:text-gray-400">No users found.</td></tr>}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="flex-1 overflow-auto custom-scrollbar p-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {roles.map(r => (
 <div key={r.id} className="bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-5 relative group hover:border-primary/50 transition-colors">
 <div className="flex justify-between items-start mb-4">
 <div className="flex items-center gap-2">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white ">
 <Shield className="w-5 h-5" />
 </div>
 <h3 className="font-black text-lg text-foreground">{r.role_name}</h3>
 </div>
 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openRoleModal(r)} className="p-1.5 bg-muted rounded-xl text-[#71717a] dark:text-gray-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
 <button onClick={() => deleteRole(r.id)} className="p-1.5 bg-red-50 rounded-xl text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
 <p className="font-semibold uppercase tracking-wider mb-2 tracking-[0.04em]">Enabled Access:</p>
 <div className="flex flex-wrap gap-2.5">
 {Object.keys(r.permissions || {}).filter(k => r.permissions[k].read || r.permissions[k].write).slice(0, 5).map(feat => (
 <span key={feat} className="px-2 py-1 bg-muted rounded-lg">{feat}</span>
 ))}
 {Object.keys(r.permissions || {}).filter(k => r.permissions[k].read).length > 5 && <span className="px-2 py-1 bg-muted rounded-lg">+{Object.keys(r.permissions).length - 5} more</span>}
 </div>
 </div>
 </div>
 ))}
 {roles.length === 0 && <div className="col-span-full py-12 text-center text-[#71717a] dark:text-gray-400 border-2 border-dashed border-primary/40 rounded-2xl">No roles defined. Create your first Role!</div>}
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
 <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden ">
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
 {AVAILABLE_FEATURES.map(feat => (
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
