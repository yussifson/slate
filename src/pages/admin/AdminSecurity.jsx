import { useTranslation } from "react-i18next";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Eye, Lock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminSecurity() {
  const { t } = useTranslation();
  const auditLogs = [
    { type: 'Impersonation', user: 'super_admin@optalflow.com', target: 'Apex Legal Partners', time: '10 mins ago', status: 'Success' },
    { type: 'Failed Login', user: 'unknown_ip@192.168.1.1', target: 'System', time: '15 mins ago', status: 'Blocked' },
    { type: 'Settings Changed', user: 'super_admin@optalflow.com', target: 'Global Configuration', time: '1 hour ago', status: 'Success' },
    { type: 'Firm Suspended', user: 'admin_dashboard', target: 'Test Corp 1', time: '2 hours ago', status: 'Success' },
    { type: 'Quota Exceeded', user: 'Global Logistics Co', target: 'Active Users', time: '5 hours ago', status: 'Warning' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Security & Audit" 
        subtitle="Global monitoring for impersonation events, access logs, and system alerts." 
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-indigo-600/80 uppercase tracking-wider mb-1">{t("system_health", "System Health")}</p>
                <h3 className="text-2xl font-extrabold text-indigo-950">{t("secure_online", "Secure & Online")}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 font-medium">
              {t("0_active_threats_detected", "0 active threats detected")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm rounded-2xl">
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
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 font-medium">
              {t("suspicious_attempts_in_last_24", "Suspicious attempts in last 24h")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-blue-600/80 uppercase tracking-wider mb-1">{t("active_impersonations", "Active Impersonations")}</p>
                <h3 className="text-4xl font-extrabold text-blue-950">1</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 font-medium">
              {t("admins_currently_viewing_tenan", "Admins currently viewing tenants")}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> {t("global_audit_trail", "Global Audit Trail")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 overflow-x-auto">
            <table className="w-full text-sm text-left font-sans">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">{t("event_type", "Event Type")}</th>
                  <th className="px-6 py-4">{t("actor_origin", "Actor / Origin")}</th>
                  <th className="px-6 py-4">{t("target_detail", "Target / Detail")}</th>
                  <th className="px-6 py-4">{t("timestamp", "Timestamp")}</th>
                  <th className="px-6 py-4 text-right">{t("status", "Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map((log, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{log.type}</td>
                      <td className="px-6 py-4 text-slate-600">{log.user}</td>
                      <td className="px-6 py-4 text-slate-600">{log.target}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{log.time}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge className={`text-[10px] font-bold uppercase py-0.5 px-2 border-none ${
                          log.status === 'Success' ? 'bg-emerald-50 text-emerald-700' :
                          log.status === 'Blocked' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
