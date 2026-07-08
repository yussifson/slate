import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, CheckCircle2, XCircle, AlertTriangle, Users, LogIn, LogOut, Timer, Map } from "lucide-react";

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
  present: { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", label: "Present", icon: CheckCircle2 },
  late:    { bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",  label: "Late",    icon: AlertTriangle },
  absent:  { bg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",    label: "Absent",   icon: XCircle },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.absent;
  const Icon = s.icon;
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${s.bg}`}>
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
    const res = await powerSync.execute(
      "SELECT a.*, s.name as full_name FROM hr_attendance a LEFT JOIN univ_hr_employees s ON a.staff_id = s.id WHERE a.company_id = ? AND a.date = ? ORDER BY a.clock_in DESC",
      [companyId, today]
    );
    const rows = res.rows?._array || [];
    setTodayRecords(rows);
    const mine = rows.find(r => r.staff_id === user?.id);
    setMyRecord(mine || null);
  }, [companyId, today, user?.id]);

  const loadHistory = useCallback(async () => {
    if (!companyId) return;
    const res = await powerSync.execute(
      "SELECT a.*, s.name as full_name FROM hr_attendance a LEFT JOIN univ_hr_employees s ON a.staff_id = s.id WHERE a.company_id = ? ORDER BY a.date DESC, a.clock_in DESC LIMIT 200",
      [companyId]
    );
    setHistoryRecords(res.rows?._array || []);
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
      await powerSync.execute(
        "INSERT INTO hr_attendance (id, created_at, company_id, staff_id, date, clock_in, status, location_lat, location_lng) VALUES (?,?,?,?,?,?,?,?,?)",
        [crypto.randomUUID(), new Date().toISOString(), companyId, user?.id, today, clockInTime, status, lat, lng]
      );
      await loadTodayRecords();
      setClockingIn(false);
      setGpsStatus(null);
      toast({ title: status === "late" ? "Clocked in — You are late" : "Clocked in successfully ✓" });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setGpsStatus("GPS acquired"); doInsert(pos.coords.latitude, pos.coords.longitude); },
        () => { setGpsStatus("GPS unavailable"); doInsert(null, null); }
      );
    } else {
      doInsert(null, null);
    }
  };

  const clockOut = async () => {
    if (!myRecord) return;
    const clockOutTime = new Date().toISOString();
    await powerSync.execute(
      "UPDATE hr_attendance SET clock_out = ? WHERE id = ?",
      [clockOutTime, myRecord.id]
    );
    await loadTodayRecords();
    toast({ title: "Clocked out. Have a great evening!" });
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
    <div className="space-y-6 max-w-[1600px] mx-auto font-dmsans">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Time & Attendance</h2>
            <p className="text-teal-50 mt-1 opacity-90">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>

          {/* My Clock In/Out */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6 border border-white/20 shadow-inner">
            <div>
              <p className="font-bold text-sm uppercase tracking-wider text-teal-100">My Attendance</p>
              <p className="text-white text-sm font-medium mt-1">
                {myRecord ? (
                  <>In: {formatTime(myRecord.clock_in)} {myRecord.clock_out ? `· Out: ${formatTime(myRecord.clock_out)}` : "· Still Active"}</>
                ) : "Not clocked in yet"}
              </p>
              {gpsStatus && <p className="text-teal-200 text-xs mt-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{gpsStatus}</p>}
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              {!myRecord ? (
                <Button className="w-full sm:w-auto bg-white text-teal-700 hover:bg-teal-50 rounded-xl font-bold shadow-sm h-11" onClick={clockIn} disabled={clockingIn}>
                  <LogIn className="w-4 h-4 mr-2" />{clockingIn ? "Clocking in..." : "Clock In"}
                </Button>
              ) : !myRecord.clock_out ? (
                <Button variant="outline" className="w-full sm:w-auto bg-transparent border-white/40 text-white hover:bg-white/20 rounded-xl font-bold h-11" onClick={clockOut}>
                  <LogOut className="w-4 h-4 mr-2" />Clock Out
                </Button>
              ) : (
                <span className="text-sm bg-white/20 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2">
                  <Timer className="w-4 h-4" />{hoursWorked(myRecord.clock_in, myRecord.clock_out)}h Logged
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-teal-100 uppercase tracking-wider">Present</p>
            <p className="text-3xl font-bold mt-1">{totalPresent}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-teal-100 uppercase tracking-wider">Late</p>
            <p className="text-3xl font-bold mt-1">{totalLate}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-teal-100 uppercase tracking-wider">Absent</p>
            <p className="text-3xl font-bold mt-1">{totalAbsent}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full pt-4">
        <TabsList className="bg-muted p-1 rounded-xl mb-6 inline-flex">
          <TabsTrigger value="today" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Today's Board</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Attendance History</TabsTrigger>
        </TabsList>

        {/* ── Today's Board ── */}
        <TabsContent value="today">
          {staff.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-bold text-foreground">No Staff Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boardData.map(member => (
                <div key={member.id} className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-foreground font-bold text-sm shadow-inner shrink-0">
                        {avatarInitials(member.full_name)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-tight truncate max-w-[120px]">{member.full_name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{member.department || 'Staff'}</p>
                      </div>
                    </div>
                    <StatusBadge status={member.record?.status || "absent"} />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs border border-border/50">
                    <div>
                      <p className="text-muted-foreground font-medium mb-0.5">Clock In</p>
                      <p className="font-bold text-foreground">{member.record ? formatTime(member.record.clock_in) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium mb-0.5">Clock Out</p>
                      <p className="font-bold text-foreground">{member.record?.clock_out ? formatTime(member.record.clock_out) : "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    {member.record?.location_lat ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-lg">
                        <Map className="w-3.5 h-3.5" /> Location verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Map className="w-3.5 h-3.5 opacity-50" /> No location data
                      </span>
                    )}
                    {member.record?.clock_out && (
                      <span className="text-xs font-bold text-foreground">{hoursWorked(member.record.clock_in, member.record.clock_out)}h</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="history">
          <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden p-1">
            <div className="p-4 border-b border-border/50 flex flex-wrap gap-4 bg-muted/20">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Status</label>
                <Select value={historyFilter.status} onValueChange={v => setHistoryFilter(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="w-40 rounded-xl bg-white dark:bg-slate-900"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Staff Member</label>
                <Select value={historyFilter.staff_id} onValueChange={v => setHistoryFilter(f => ({ ...f, staff_id: v }))}>
                  <SelectTrigger className="w-48 rounded-xl bg-white dark:bg-slate-900"><SelectValue placeholder="Staff Member" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Date</label>
                <Input type="date" className="w-44 rounded-xl bg-white dark:bg-slate-900" value={historyFilter.date} onChange={e => setHistoryFilter(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clock In</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clock Out</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hours</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-muted-foreground font-medium">No records match your filters</td></tr>
                  ) : filteredHistory.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{r.full_name || "Unknown"}</td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">{r.date}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{formatTime(r.clock_in)}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{formatTime(r.clock_out)}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{hoursWorked(r.clock_in, r.clock_out) ? `${hoursWorked(r.clock_in, r.clock_out)}h` : "—"}</td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {r.location_lat ? <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400"><MapPin className="w-3.5 h-3.5" />Verified</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
