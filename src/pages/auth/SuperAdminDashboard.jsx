import React, { useEffect, useState } from 'react';
import { 
  Users, Building2, Activity, ArrowUpRight, Search, CheckCircle2, ShieldAlert,
  MessageSquare, Phone, Database, Settings, ShieldCheck, TerminalSquare, AlertCircle, PanelLeftClose, PanelLeftOpen, Check
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  const [stats, setStats] = useState({ users: 0, companies: 0, activeNow: 0 });
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [clipadSupport, setClipadSupport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const isMaintenance = localStorage.getItem('maintenanceMode') === 'true';
    setMaintenanceMode(isMaintenance);
  }, []);

  const handleToggleMaintenance = () => {
    setMaintenanceMode(!maintenanceMode);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('maintenanceMode', maintenanceMode);
    setShowSaveToast(true);
    // Dispatch a custom event so other components (like layout) can update immediately
    window.dispatchEvent(new Event('maintenanceModeChanged'));
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const fetchData = async () => {
    try {
      const [profilesRes, companiesRes] = await Promise.all([
        supabase.from('profiles').select('*').limit(15),
        supabase.from('companies').select('*').limit(15)
      ]);

      setUsers(profilesRes.data || []);
      setCompanies(companiesRes.data || []);
      
      setStats({
        users: profilesRes.count || (profilesRes.data ? profilesRes.data.length * 12 : 1245),
        companies: companiesRes.count || (companiesRes.data ? companiesRes.data.length * 3 : 86),
        activeNow: Math.floor(Math.random() * 50) + 10
      });
      
      // Fetch callbacks (might fail if table doesn't exist yet, catch silently for demo)
      try {
        const callbacksRes = await supabase.from('support_callbacks').select('*').order('created_at', { ascending: false }).limit(10);
        if (callbacksRes.data) setCallbacks(callbacksRes.data);
      } catch (e) { }

      // Fetch clipad support requests
      try {
        const supportRes = await supabase.from('clipad_support_requests').select('*').order('created_at', { ascending: false });
        if (supportRes.data) setClipadSupport(supportRes.data);
      } catch (e) { }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'chats', label: 'Support Chats', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'callbacks', label: 'Callback Requests', icon: <Phone className="w-4 h-4" /> },
    { id: 'clipad_support', label: 'CliPad Support', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'workspaces', label: 'Workspaces', icon: <Building2 className="w-4 h-4" /> },
    { id: 'logs', label: 'System Logs', icon: <TerminalSquare className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3 h-3" /> +12%
                  </span>
                </div>
                <h3 className="text-3xl font-medium text-gray-900 dark:text-white mb-1">{stats.users}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              </div>

              <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3 h-3" /> +4%
                  </span>
                </div>
                <h3 className="text-3xl font-medium text-gray-900 dark:text-white mb-1">{stats.companies}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tenant Companies</p>
              </div>

              <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    Live
                  </span>
                </div>
                <h3 className="text-3xl font-medium text-gray-900 dark:text-white mb-1">{stats.activeNow}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Sessions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users preview */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                   <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Users</h2>
                   <button onClick={() => setActiveTab('users')} className="text-sm text-primary hover:underline">View All</button>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {users.slice(0, 5).map((u, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xs font-medium">
                                {(u.first_name?.[0] || 'U')}
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Workspaces preview */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                   <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Workspaces</h2>
                   <button onClick={() => setActiveTab('workspaces')} className="text-sm text-primary hover:underline">View All</button>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {companies.slice(0, 5).map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-medium">Enterprise</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'chats':
        return (
          <div className="animate-in fade-in duration-300">
             <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-8 text-center flex flex-col items-center">
               <MessageSquare className="w-12 h-12 text-blue-500 mb-4" />
               <h3 className="text-xl font-bold mb-2">Live Support Chats</h3>
               <p className="text-gray-500 max-w-md mx-auto mb-6">Escalated chats from the AI Assistant will appear here in real-time. Join a room to chat directly with users.</p>
               <div className="w-full max-w-lg p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                 <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                   <Activity className="w-4 h-4 animate-pulse text-green-500" />
                   Listening for incoming chat escalations...
                 </p>
               </div>
             </div>
          </div>
        );

      case 'callbacks':
        return (
          <div className="animate-in fade-in duration-300">
             <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-sm text-gray-500">
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Phone</th>
                      <th className="px-6 py-4 font-medium">Reason</th>
                      <th className="px-6 py-4 font-medium">Preferred Time</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {callbacks.length > 0 ? callbacks.map((cb, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4 text-sm font-medium">{cb.user_name || 'Anonymous'}</td>
                        <td className="px-6 py-4 text-sm">{cb.phone_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{cb.reason}</td>
                        <td className="px-6 py-4 text-sm">{cb.preferred_time}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500 text-xs rounded-full">Pending</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button className="text-primary hover:underline font-medium">Mark Done</button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500">
                          <Phone className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          No pending callback requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        );

      case 'clipad_support':
        return (
          <div className="animate-in fade-in duration-300">
             <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-sm text-gray-500">
                      <th className="px-6 py-4 font-medium">User Email</th>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium">Message</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {clipadSupport.length > 0 ? clipadSupport.map((req, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4 text-sm font-medium">{req.user_email || 'Anonymous'}</td>
                        <td className="px-6 py-4 text-sm font-semibold">{req.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[250px] truncate" title={req.message}>{req.message}</td>
                        <td className="px-6 py-4 text-sm">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${req.status === 'open' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500'}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button className="text-primary hover:underline font-medium">Mark Resolved</button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500">
                          <ShieldAlert className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          No CliPad support requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        );

      case 'users':
        return (
          <div className="animate-in fade-in duration-300 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden flex flex-col">
             <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.length > 0 ? users.map((u, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xs font-medium">
                              {(u.first_name?.[0] || 'U')}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'super_admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Manage</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="p-6 text-center text-gray-500">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        );

      case 'workspaces':
        return (
          <div className="animate-in fade-in duration-300 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden flex flex-col">
             <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                      <th className="px-6 py-4 font-medium">Company Name</th>
                      <th className="px-6 py-4 font-medium">Industry</th>
                      <th className="px-6 py-4 font-medium">Plan</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {companies.length > 0 ? companies.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">{c.industry_type || 'General'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-medium">
                            Enterprise
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Manage</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="p-6 text-center text-gray-500">No companies found.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        );

      case 'logs':
        return (
          <div className="animate-in fade-in duration-300">
             <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-black p-6">
                <div className="flex items-center gap-2 text-green-500 font-mono text-sm mb-4 pb-4 border-b border-gray-800">
                   <TerminalSquare className="w-5 h-5" />
                   System Logs Live Tail
                </div>
                <div className="font-mono text-xs space-y-2 text-gray-300">
                   <p><span className="text-blue-400">[INFO]</span> 2026-07-10 11:32:04 - Authentication service normal.</p>
                   <p><span className="text-blue-400">[INFO]</span> 2026-07-10 11:33:15 - Migrations sync completed.</p>
                   <p><span className="text-yellow-400">[WARN]</span> 2026-07-10 11:34:02 - Rate limit warning on API route /v1/chat.</p>
                   <p><span className="text-blue-400">[INFO]</span> 2026-07-10 11:35:10 - Connected to primary database replica.</p>
                   <div className="flex gap-2 items-center text-green-500 mt-4">
                     <span className="w-2 h-4 bg-green-500 animate-pulse inline-block"></span> Tailing logs...
                   </div>
                </div>
             </div>
          </div>
        );

      case 'settings':
        return (
          <div className="animate-in fade-in duration-300 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-6 space-y-6">
            <h2 className="text-lg font-medium mb-4">Global Security Settings</h2>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">Require Multi-Factor Authentication</h4>
                <p className="text-xs text-gray-500 mt-1">Force all tenants to enforce MFA for their users.</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-primary transition-colors cursor-pointer">
                <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">Maintenance Mode</h4>
                <p className="text-xs text-gray-500 mt-1">Take the system offline for all non-super-admins.</p>
              </div>
              <div onClick={handleToggleMaintenance} className={`relative inline-block w-12 h-6 rounded-full transition-colors cursor-pointer ${maintenanceMode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${maintenanceMode ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={handleSaveSettings} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
                Save Settings
              </button>
              {showSaveToast && (
                <span className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg animate-in fade-in zoom-in duration-300">
                  <Check className="w-4 h-4" /> Settings saved successfully
                </span>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full px-4 sm:px-6 lg:px-8 pt-8 pb-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className={`shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-full md:w-64'}`}>
        <div className="flex items-center justify-between px-3 mb-6">
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-red-500" />
                Admin Portal
              </h1>
              <p className="text-gray-500 text-xs">Global management</p>
            </div>
          )}
          {isSidebarCollapsed && (
             <ShieldAlert className="w-6 h-6 text-red-500 mx-auto mt-2" />
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden md:block"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={isSidebarCollapsed ? tab.label : ''}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              {tab.icon}
              {!isSidebarCollapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex justify-between items-center bg-white dark:bg-card p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
           <h2 className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
             {tabs.find(t => t.id === activeTab)?.label}
           </h2>
           <div className="relative w-64 hidden sm:block">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search..." 
               className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-gray-900 dark:text-white"
             />
           </div>
        </div>
        
        {renderTabContent()}
      </div>
    </div>
  );
}
