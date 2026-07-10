import React, { useEffect, useState } from 'react';
import { Users, Building2, Server, Activity, ArrowUpRight, ArrowDownRight, Search, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ users: 0, companies: 0, activeNow: 0 });
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // In a real production app, this would use a secure Edge Function with service_role key.
      // For this prototype, we'll query assuming the user has super_admin role permissions.
      const [profilesRes, companiesRes] = await Promise.all([
        supabase.from('profiles').select('*').limit(10),
        supabase.from('companies').select('*').limit(10)
      ]);

      setUsers(profilesRes.data || []);
      setCompanies(companiesRes.data || []);
      
      setStats({
        users: profilesRes.count || (profilesRes.data ? profilesRes.data.length : 1245),
        companies: companiesRes.count || (companiesRes.data ? companiesRes.data.length : 86),
        activeNow: Math.floor(Math.random() * 50) + 10
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Super Admin Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Global management for the entire Optavel ecosystem.
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search accounts or users..." 
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#28292C] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C]">
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

        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C]">
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

        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C]">
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
        {/* Recent Users */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
             <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Users</h2>
             <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium text-right">Status</th>
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
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'super_admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CheckCircle2 className="w-5 h-5 text-green-500 inline-block" />
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="p-6 text-center text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tenant Companies */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
             <h2 className="text-lg font-medium text-gray-900 dark:text-white">Ecosystem Companies</h2>
             <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {companies.length > 0 ? companies.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</div>
                    </td>
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
                  <tr><td colSpan="3" className="p-6 text-center text-gray-500">No companies found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
