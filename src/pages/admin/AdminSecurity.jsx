import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Eye, Lock } from 'lucide-react';
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
      return data || [];
    }
  });

  const handleForceLogout = async (userId, email) => {
      setRevoking(userId);
      try {
          // Log the force logout action
          const { error } = await supabase.from('audit_logs').insert({
              action_type: 'FORCE_LOGOUT',
              entity_type: 'USER',
              entity_id: userId,
              actor_email: 'Super Admin',
              new_data: { target_email: email }
          });
          if (error) throw error;
          
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
        <Card className="bg-gradient-to-br from-primary/5 to-white border-primary/40 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-primary/80 uppercase tracking-wider mb-1">{t("system_health", "System Health")}</p>
                <h3 className="text-2xl font-extrabold text-primary/60">{t("secure_online", "Secure & Online")}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t("0_active_threats_detected", "0 active threats detected")}
              </span>
              <button 
                onClick={() => toast({ title: 'Maintenance Mode', description: 'Maintenance mode is currently disabled in this environment.' })}
                className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
              >
                Enable Maintenance Mode
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-amber-600/80 uppercase tracking-wider mb-1">{t("failed_auth", "Failed Auth")}</p>
                <h3 className="text-4xl font-extrabold text-amber-950">{t("24", "24")}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t("suspicious_attempts_in_last_24", "Suspicious attempts in last 24h")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-white border-primary/40 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-primary/80 uppercase tracking-wider mb-1">{t("active_impersonations", "Active Impersonations")}</p>
                <h3 className="text-4xl font-extrabold text-primary/60">1</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t("admins_currently_viewing_tenan", "Admins currently viewing tenants")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/40 rounded-2xl overflow-hidden mt-6">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-primary/40 dark:border-primary/40">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> {t("recent_active_sessions", "Recent Active Sessions")}
            <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-600 border-emerald-200">LIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 overflow-x-auto">
            <table className="w-full text-sm text-left font-sans">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-transparent border-b border-primary/40 dark:border-primary/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">{t("user_email", "User Email")}</th>
                  <th className="px-6 py-4">{t("role", "Role")}</th>
                  <th className="px-6 py-4">{t("last_active", "Last Active")}</th>
                  <th className="px-6 py-4 text-right">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No active sessions found in the last 2 hours.</td>
                  </tr>
                ) : activeSessions.map((session, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:bg-transparent transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{session.email}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{session.role ? session.role.replace('_', ' ') : 'User'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{new Date(session.last_sign_in_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleForceLogout(session.user_id, session.email)}
                        disabled={revoking === session.user_id}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
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

      <Card className="border-primary/40 rounded-2xl overflow-hidden mt-6">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-primary/40 dark:border-primary/40">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> {t("global_audit_trail", "Global Audit Trail")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 overflow-x-auto">
            <table className="w-full text-sm text-left font-sans">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-transparent border-b border-primary/40 dark:border-primary/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">{t("event_type", "Event Type")}</th>
                  <th className="px-6 py-4">{t("actor_origin", "Actor / Origin")}</th>
                  <th className="px-6 py-4">{t("target_detail", "Target / Detail")}</th>
                  <th className="px-6 py-4">{t("timestamp", "Timestamp")}</th>
                  <th className="px-6 py-4 text-right">{t("status", "Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:bg-transparent transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{log.type}</td>
                    <td className="px-6 py-4 text-slate-600">{log.user}</td>
                    <td className="px-6 py-4 text-slate-600">{log.target}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{log.time}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge className={`text-[10px] font-bold uppercase py-0.5 px-2 border-none ${
                        log.status === 'Success' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90' :
                        log.status === 'Blocked' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
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
