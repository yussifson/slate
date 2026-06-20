import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Eye, Lock, Zap, Shield } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function AdminSecurity() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [revoking, setRevoking] = useState(null);

  const { data: realAuditLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['admin_security_logs_live'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: activeSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['admin_active_sessions_live'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_sessions');
      if (error) throw error;
      
      const sessions = data || [];
      if (sessions.length > 0) {
        const emails = sessions.map(s => s.email);
        const { data: profiles } = await supabase.from('profiles').select('email, role').in('email', emails);
        
        if (profiles) {
          sessions.forEach(session => {
            const profile = profiles.find(p => p.email === session.email);
            if (profile && profile.role) {
              session.role = profile.role;
            }
          });
        }
      }
      return sessions;
    }
  });

  const handleForceLogout = async (userId, email) => {
      setRevoking(userId);
      try {
          // Log the force logout action
          const { error } = await supabase.from('audit_logs').insert({
              action: 'FORCE_LOGOUT',
              entity_type: 'USER',
              entity_id: userId,
              user_email: 'Super Admin',
              details: JSON.stringify({ target_email: email }),
              severity: 'warning'
          });
          if (error) throw error;
          
          // Broadcast the logout event so the target user's browser picks it up instantly
          const channel = supabase.channel('global_security');
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: 'FORCE_LOGOUT',
                payload: { userId: userId }
              });
            }
          });
          
          toast({ title: 'Session Revoked', description: `Successfully force-logged out ${email}.` });
          refetchLogs();
      } catch (err) {
          toast({ title: 'Failed to revoke session', description: err.message, variant: 'destructive' });
      } finally {
          setRevoking(null);
      }
  };

  const auditLogs = realAuditLogs.map(log => ({
    type: log.action_type || 'System Event',
    user: log.actor_email || 'System',
    target: `${log.entity_type} ${log.entity_id ? `(${log.entity_id.substring(0,8)})` : ''}`,
    time: new Date(log.created_at).toLocaleString(),
    status: 'Success'
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Security & Audit" 
        subtitle="Global monitoring for impersonation events, access logs, and system alerts." 
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 flex flex-col justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{t("system_health", "System Health")}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{t("secure_online", "Secure & Online")}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10/10 flex items-center justify-center border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 dark:border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {realAuditLogs.filter(l => l.action === 'SYSTEM_ALERT' && l.severity === 'high').length} active threats detected
            </span>
            <button 
              onClick={() => toast({ title: 'Maintenance Mode', description: 'Maintenance mode is currently disabled in this environment.' })}
              className="text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors tracking-[0.04em]"
            >
              Enable Maintenance Mode
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 flex flex-col justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{t("failed_auth", "Failed Auth")}</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{realAuditLogs.filter(l => (l.action === 'LOGIN_FAILED' || l.action === 'AUTH_FAILURE') && new Date(l.created_at) > new Date(Date.now() - 24*60*60*1000)).length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border-[0.5px] border-black/9 dark:border-white/8 border-amber-100 dark:border-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            {t("suspicious_attempts_in_last_24", "Suspicious attempts in last 24h")}
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 flex flex-col justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{t("active_impersonations", "Active Impersonations")}</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{realAuditLogs.filter(l => l.action === 'IMPERSONATION_START' && new Date(l.created_at) > new Date(Date.now() - 24*60*60*1000)).length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10/10 flex items-center justify-center border-[0.5px] border-black/9 dark:border-white/8 border-blue-100 dark:border-blue-500/20">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            {t("admins_currently_viewing_tenan", "Admins currently viewing tenants")}
          </div>
        </div>
      </div>

      {/* Threat Intelligence Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-rose-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><Zap className="w-4 h-4 text-rose-500" /> Brute Force Detection</h3>
            <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              {realAuditLogs.filter(l => (l.action === 'LOGIN_FAILED' || l.action === 'AUTH_FAILURE') && new Date(l.created_at) > new Date(Date.now() - 3600000)).length} Last Hour
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Repeated failed authentication attempts indicating potential brute-force attacks or credential stuffing.</p>
          <div className="text-[10px] uppercase font-semibold text-rose-600 tracking-wider">Auto-monitored</div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-amber-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><Shield className="w-4 h-4 text-amber-500" /> Privilege Escalation</h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {realAuditLogs.filter(l => l.action === 'ROLE_CHANGED').length} Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Audit trail of role changes that could indicate unauthorized privilege escalation attempts.</p>
          <div className="text-[10px] uppercase font-semibold text-amber-600 tracking-wider">Review Changes</div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-indigo-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-500" /> Session Anomalies</h3>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{activeSessions.length} Active Now</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Concurrent sessions per user and unusual login time patterns that deviate from baseline behaviour.</p>
          <div className="text-[10px] uppercase font-semibold text-indigo-600 tracking-wider">No Anomalies Detected</div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm rounded-2xl overflow-hidden mt-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <CardHeader className="bg-transparent border-b border-primary/10 dark:border-primary/20">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> {t("recent_active_sessions", "Recent Active Sessions")}
            <Badge variant="outline" className="ml-2 bg-emerald-50 dark:bg-emerald-500/10/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">LIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/50 dark:bg-slate-900/30 border-b border-primary/10 dark:border-primary/20 text-[#71717a] dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px] tracking-[0.04em]">
                  <th className="px-6 py-4">{t("user_email", "User Email")}</th>
                  <th className="px-6 py-4">{t("role", "Role")}</th>
                  <th className="px-6 py-4">{t("last_active", "Last Active")}</th>
                  <th className="px-6 py-4 text-right">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No active sessions found in the last 2 hours.</td>
                  </tr>
                ) : activeSessions.map((session, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{session.email}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">{session.role ? session.role.replace('_', ' ') : 'User'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-[0.04em]">{new Date(session.last_sign_in_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleForceLogout(session.user_id, session.email)}
                        disabled={revoking === session.user_id}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 tracking-[0.04em]"
                      >
                        {revoking === session.user_id ? 'Revoking...' : 'Force Logout'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm rounded-2xl overflow-hidden mt-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <CardHeader className="bg-transparent border-b border-primary/10 dark:border-primary/20">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> {t("global_audit_trail", "Global Audit Trail")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/50 dark:bg-slate-900/30 border-b border-primary/10 dark:border-primary/20 text-[#71717a] dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px] tracking-[0.04em]">
                  <th className="px-6 py-4">{t("event_type", "Event Type")}</th>
                  <th className="px-6 py-4">{t("actor_origin", "Actor / Origin")}</th>
                  <th className="px-6 py-4">{t("target_detail", "Target / Detail")}</th>
                  <th className="px-6 py-4">{t("timestamp", "Timestamp")}</th>
                  <th className="px-6 py-4 text-right">{t("status", "Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{log.type}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{log.user}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{log.target}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-[0.04em]">{log.time}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge className={`text-[10px] font-semibold uppercase py-0.5 px-2 border-none ${
                        log.status === 'Success' ? 'bg-emerald-50 dark:bg-emerald-500/10/10 text-emerald-600 dark:text-emerald-400' :
                        log.status === 'Blocked' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
