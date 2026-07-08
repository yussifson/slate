import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, CheckCircle2, XCircle, AlertTriangle, Users, LogIn, LogOut, Timer, Map, CalendarClock, Target } from "lucide-react";
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
  if (!iso) return "—";
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
  const today = new Date().toISOString().split("T")[0];

  const [todayRecords, setTodayRecords] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [myRecord, setMyRecord] = useState(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ status: "all", staff_id: "all", date: "" });
  const [gpsStatus, setGpsStatus] = useState(null);

  const loadTodayRecords = useCallback(async () => {
    if (!companyId) return;
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
    if (!companyId) return;
    try {
      const res = await powerSync.execute(
        "SELECT a.*, s.name as full_name FROM hr_attendance a LEFT JOIN univ_hr_employees s ON a.staff_id = s.id WHERE a.company_id = ? ORDER BY a.date DESC, a.clock_in DESC LIMIT 200",
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
        toast({ title: status === "late" ? "Clocked in — You are late" : "Clocked in successfully ✓" });
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

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 h-[calc(100vh-4rem)] p-4 lg:p-8 font-dmsans flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full space-y-6">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-primary" /> Time & Attendance
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage daily check-ins, remote tracking, and attendance history.</p>
          </div>
          
          {/* My Action Button */}
          <div className="flex gap-3">
            {!myRecord ? (
              <Button onClick={clockIn} disabled={clockingIn} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm gap-2 font-bold px-6 h-10">
                <LogIn className="w-4 h-4" /> {clockingIn ? gpsStatus || "Processing..." : "Clock In"}
              </Button>
            ) : !myRecord.clock_out ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-muted-foreground border-[0.5px] border-black/9 dark:border-white/8">
                  <Timer className="w-4 h-4 text-emerald-500" />
                  Clocked in at {formatTime(myRecord.clock_in)}
                </div>
                <Button onClick={clockOut} className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl shadow-sm gap-2 font-bold px-6 h-10">
                  <LogOut className="w-4 h-4" /> Clock Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-100 dark:border-emerald-800 shadow-sm">
                <CheckCircle2 className="w-4 h-4" /> Shift Completed
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Summary ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
          <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Staff</p>
              <p className="text-3xl font-black text-foreground mt-0.5">{staff.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50 shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Present</p>
              <p className="text-3xl font-black text-foreground mt-0.5">{totalPresent}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800/50 shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Late</p>
              <p className="text-3xl font-black text-foreground mt-0.5">{totalLate}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-800/50 shrink-0">
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Absent</p>
              <p className="text-3xl font-black text-foreground mt-0.5">{totalAbsent}</p>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-[0.5px] border-black/9 dark:border-white/8 flex flex-col overflow-hidden">
          <Tabs defaultValue="today" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 border-b border-border/50 shrink-0 flex items-center justify-between">
              <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl h-auto flex gap-1">
                <TabsTrigger value="today" className="rounded-lg px-6 py-2 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary data-[state=active]:shadow-sm">Today's Board</TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg px-6 py-2 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary data-[state=active]:shadow-sm">Attendance History</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="today" className="flex-1 overflow-y-auto custom-scrollbar p-6 m-0 outline-none bg-slate-50/30 dark:bg-slate-950/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {boardData.map(s => (
                  <div key={s.id} className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-bold text-foreground shadow-inner shrink-0">
                          {avatarInitials(s.name || s.full_name)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-tight">{s.name || s.full_name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{s.role || "Staff"}</p>
                        </div>
                      </div>
                    </div>
                    
                    {s.record ? (
                      <div className="space-y-3 mt-auto relative z-10">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-border/50">
                          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><LogIn className="w-3.5 h-3.5"/> In</span>
                          <span className="text-xs font-bold text-foreground">{formatTime(s.record.clock_in)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-border/50">
                          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5"/> Out</span>
                          <span className="text-xs font-bold text-foreground">{formatTime(s.record.clock_out)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <StatusBadge status={s.record.status} />
                          {s.record.location_lat && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full" title="GPS Verified">
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

            <TabsContent value="history" className="flex-1 flex flex-col min-h-0 p-0 m-0 outline-none">
              <div className="p-4 border-b border-border/50 flex flex-wrap gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                <Select value={historyFilter.status} onValueChange={v => setHistoryFilter({...historyFilter, status: v})}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 rounded-xl border-border/50 font-semibold"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={historyFilter.staff_id} onValueChange={v => setHistoryFilter({...historyFilter, staff_id: v})}>
                  <SelectTrigger className="w-[200px] bg-white dark:bg-slate-900 rounded-xl border-border/50 font-semibold"><SelectValue placeholder="All Staff" /></SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    <SelectItem value="all">All Staff</SelectItem>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" value={historyFilter.date} onChange={e => setHistoryFilter({...historyFilter, date: e.target.value})} className="w-[160px] bg-white dark:bg-slate-900 rounded-xl border-border/50 font-semibold" />
                <Button variant="ghost" onClick={() => setHistoryFilter({status:"all", staff_id:"all", date:""})} className="rounded-xl font-bold">Clear Filters</Button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 dark:bg-slate-950/30">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No history records match your filters.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-border/50">
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
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                                    {avatarInitials(sname)}
                                  </div>
                                  <span className="font-bold text-foreground">{sname}</span>
                                </div>
                              </td>
                              <td className="p-4 font-medium text-foreground">{formatTime(r.clock_in)}</td>
                              <td className="p-4 font-medium text-foreground">{formatTime(r.clock_out)}</td>
                              <td className="p-4 font-bold text-foreground">{hoursWorked(r.clock_in, r.clock_out) || "—"}</td>
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

      </div>
    </div>
  );
}
