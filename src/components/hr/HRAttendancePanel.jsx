import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, CheckCircle2, XCircle, AlertTriangle, Users, LogIn, LogOut, Timer, CalendarClock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function avatarInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function hoursWorked(clockIn, clockOut) {
  if (!clockIn || !clockOut) return null;
  const diff = (new Date(clockOut) - new Date(clockIn)) / 3600000;
  return diff > 0 ? diff.toFixed(1) : null;
}

function formatTime(iso) {
  if (!iso) return "â€”";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES = {
  present: { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", label: "Present", icon: CheckCircle2 },
  late:    { bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",  label: "Late",    icon: AlertTriangle },
  absent:  { bg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800",    label: "Absent",   icon: XCircle },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.absent;
  const Icon = s.icon;
  return (
    <span className={cn(`flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase border shadow-sm`, s.bg)}>
      <Icon className="w-3 h-3" />{s.label}
    </span>
  );
}

export default function HRAttendancePanel({ companyId, isAdmin, staff = [] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];

  const [todayRecords, setTodayRecords] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [myRecord, setMyRecord] = useState(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ status: "all", staff_id: "all", date: "" });
  const [gpsStatus, setGpsStatus] = useState(null);

  const loadTodayRecords = useCallback(async () => {
    if (companyId === undefined) return;
    try {
      const res = await powerSync.execute(
        "SELECT a.*, s.name as full_name FROM hr_attendance a LEFT JOIN univ_hr_employees s ON a.staff_id = s.id WHERE a.company_id = ? AND a.date = ? ORDER BY a.clock_in DESC",
        [companyId, today]
      );
      const rows = res.rows?._array || [];
      setTodayRecords(rows);
      const mine = rows.find(r => r.staff_id === user?.id);
      setMyRecord(mine || null);
    } catch (e) {
      console.error(e);
    }
  }, [companyId, today, user?.id]);

  const loadHistory = useCallback(async () => {
    if (companyId === undefined) return;
    try {
      const res = await powerSync.execute(
        "SELECT a.*, s.name as full_name FROM hr_attendance a LEFT JOIN univ_hr_employees s ON a.staff_id = s.id WHERE a.company_id = ? ORDER BY a.date DESC, a.clock_in DESC",
        [companyId]
      );
      setHistoryRecords(res.rows?._array || []);
    } catch (e) {
      console.error(e);
    }
  }, [companyId]);

  useEffect(() => {
    loadTodayRecords();
    loadHistory();
  }, [loadTodayRecords, loadHistory]);

  const clockIn = async () => {
    setClockingIn(true);
    setGpsStatus("Acquiring GPS...");
    const clockInTime = new Date().toISOString();
    const clockInHour = new Date().getHours();
    const status = clockInHour >= 9 ? "late" : "present";

    const doInsert = async (lat, lng) => {
      try {
        await powerSync.execute(
          "INSERT INTO hr_attendance (id, created_at, company_id, staff_id, date, clock_in, status, location_lat, location_lng) VALUES (?,?,?,?,?,?,?,?,?)",
          [crypto.randomUUID(), new Date().toISOString(), companyId, user?.id, today, clockInTime, status, lat, lng]
        );
        await loadTodayRecords();
        await loadHistory();
        toast({ title: status === "late" ? "Clocked in â€” You are late" : "Clocked in successfully âœ“" });
      } catch (err) {
        toast({ title: "Failed to clock in", variant: "destructive" });
      } finally {
        setClockingIn(false);
        setGpsStatus(null);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setGpsStatus("GPS acquired"); doInsert(pos.coords.latitude, pos.coords.longitude); },
        () => { setGpsStatus("GPS unavailable"); doInsert(null, null); },
        { timeout: 5000 }
      );
    } else {
      doInsert(null, null);
    }
  };

  const clockOut = async () => {
    if (!myRecord) return;
    try {
      const clockOutTime = new Date().toISOString();
      await powerSync.execute(
        "UPDATE hr_attendance SET clock_out = ? WHERE id = ?",
        [clockOutTime, myRecord.id]
      );
      await loadTodayRecords();
      await loadHistory();
      toast({ title: "Clocked out. Have a great evening!" });
    } catch (err) {
      toast({ title: "Failed to clock out", variant: "destructive" });
    }
  };

  const boardData = staff.map(s => {
    const record = todayRecords.find(r => r.staff_id === s.id);
    return { ...s, record };
  });

  const totalPresent = todayRecords.filter(r => r.status === "present").length;
  const totalLate    = todayRecords.filter(r => r.status === "late").length;
  const totalAbsent  = Math.max(0, staff.length - todayRecords.length);

  const filteredHistory = historyRecords.filter(r => {
    if (historyFilter.status !== "all" && r.status !== historyFilter.status) return false;
    if (historyFilter.staff_id !== "all" && r.staff_id !== historyFilter.staff_id) return false;
    if (historyFilter.date && r.date !== historyFilter.date) return false;
    return true;
  });

  const kpis = [
    { label: 'Total Staff', value: staff.length, sub: 'Active roster', icon: Users, alt: false, trend: '', trendUp: true },
    { label: 'Present Today', value: totalPresent, sub: 'Checked in on time', icon: CheckCircle2, alt: true, trend: `${Math.round((totalPresent/Math.max(1, staff.length))*100)}%`, trendUp: true },
    { label: 'Late Today', value: totalLate, sub: 'Checked in after 9 AM', icon: AlertTriangle, alt: false, trend: totalLate > 0 ? `${totalLate} late` : 'On track', trendUp: totalLate === 0 },
    { label: 'Absent Today', value: totalAbsent, sub: 'Not checked in', icon: XCircle, alt: true },
  ];

  return (
    <div className="space-y-6 p-6 font-dmsans">
      {/* â”€â”€ Hero Header â”€â”€ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <CalendarClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("time_and_attendance", "Time & Attendance")}</h1>
                <p className="text-green-100 text-sm">Manage daily check-ins and remote tracking.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!myRecord ? (
              <Button onClick={clockIn} disabled={clockingIn} className="bg-white text-green-700 hover:bg-green-50 rounded-xl shadow-sm gap-2 font-bold px-6 h-10">
                <LogIn className="w-4 h-4" /> {clockingIn ? gpsStatus || "Processing..." : "Clock In"}
              </Button>
            ) : !myRecord.clock_out ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-sm font-bold text-white border border-white/20">
                  <Timer className="w-4 h-4" />
                  Clocked in at {formatTime(myRecord.clock_in)}
                </div>
                <Button onClick={clockOut} className="bg-white text-green-700 hover:bg-green-50 rounded-xl shadow-sm gap-2 font-bold px-6 h-10">
                  <LogOut className="w-4 h-4" /> Clock Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white rounded-xl text-sm font-bold border border-white/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4" /> Shift Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ KPI Cards â”€â”€ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${kpi.trendUp ? 'text-green-700 bg-green-50 dark:bg-green-900/40' : 'text-orange-700 bg-orange-50 dark:bg-orange-900/40'}`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1 tabular-nums">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className={`text-xs ${(!kpi.trendUp && kpi.icon === AlertTriangle) ? 'text-orange-500' : 'text-muted-foreground'}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="today" className="w-full pt-4">
        <TabsList className="bg-muted p-1 rounded-xl mb-6 inline-flex">
          <TabsTrigger value="today" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Today's Board</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Attendance History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {boardData.map(s => (
              <div key={s.id} className="bg-slate-50 dark:bg-secondary/30 border border-border/50 rounded-2xl p-5 flex flex-col hover:border-emerald-500/30 hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-card flex items-center justify-center font-bold text-foreground shadow-sm border border-border/50 shrink-0">
                      {avatarInitials(s.name || s.full_name)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm leading-tight">{s.name || s.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{s.role || "Staff"}</p>
                    </div>
                  </div>
                </div>
                
                {s.record ? (
                  <div className="space-y-3 mt-auto relative z-10">
                    <div className="flex justify-between items-center bg-white dark:bg-card p-2 rounded-lg border border-border/50">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><LogIn className="w-3.5 h-3.5"/> In</span>
                      <span className="text-xs font-bold text-foreground">{formatTime(s.record.clock_in)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-card p-2 rounded-lg border border-border/50">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5"/> Out</span>
                      <span className="text-xs font-bold text-foreground">{formatTime(s.record.clock_out)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <StatusBadge status={s.record.status} />
                      {s.record.location_lat && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800" title="GPS Verified">
                          <MapPin className="w-3 h-3" /> GPS
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto pt-6 pb-2 text-center relative z-10">
                    <StatusBadge status="absent" />
                    <p className="text-xs text-muted-foreground mt-3 font-medium">No check-in recorded yet.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="bg-card border border-border/50 rounded-2xl p-0 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50 flex flex-wrap gap-4 bg-slate-50/50 dark:bg-secondary/30">
            <Select value={historyFilter.status} onValueChange={v => setHistoryFilter({...historyFilter, status: v})}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-card rounded-xl border-border/50 font-semibold"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={historyFilter.staff_id} onValueChange={v => setHistoryFilter({...historyFilter, staff_id: v})}>
              <SelectTrigger className="w-[200px] bg-white dark:bg-card rounded-xl border-border/50 font-semibold"><SelectValue placeholder="All Staff" /></SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={historyFilter.date} onChange={e => setHistoryFilter({...historyFilter, date: e.target.value})} className="w-[160px] bg-white dark:bg-card rounded-xl border-border/50 font-semibold" />
            <Button variant="ghost" onClick={() => setHistoryFilter({status:"all", staff_id:"all", date:""})} className="rounded-xl font-bold">Clear Filters</Button>
          </div>

          <div className="p-6">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <CalendarClock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No history records match your filters.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-secondary/50 border-b border-border/50">
                    <tr>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Staff</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Clock In</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Clock Out</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Hours</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredHistory.map(r => {
                      const sname = r.full_name || staff.find(st => st.id === r.staff_id)?.name || "Unknown";
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 font-semibold text-foreground">{r.date}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-secondary flex items-center justify-center font-bold text-xs">
                                {avatarInitials(sname)}
                              </div>
                              <span className="font-bold text-foreground">{sname}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-foreground">{formatTime(r.clock_in)}</td>
                          <td className="p-4 font-medium text-foreground">{formatTime(r.clock_out)}</td>
                          <td className="p-4 font-bold text-foreground">{hoursWorked(r.clock_in, r.clock_out) || "â€”"}</td>
                          <td className="p-4"><StatusBadge status={r.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
