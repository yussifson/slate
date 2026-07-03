import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  MapPin, Clock, CheckCircle2, XCircle, AlertTriangle,
  Users, LogIn, LogOut, Calendar, Filter, Timer
} from "lucide-react";

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
  present: { cls: "bg-green-100 text-green-700", label: "Present", icon: CheckCircle2 },
  late:    { cls: "bg-amber-100 text-amber-700",  label: "Late",    icon: AlertTriangle },
  absent:  { cls: "bg-red-100 text-red-700",    label: "Absent",   icon: XCircle },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.absent;
  const Icon = s.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
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
      "SELECT a.*, s.full_name FROM hr_attendance a LEFT JOIN staff_records s ON a.staff_id = s.id WHERE a.company_id = ? AND a.date = ? ORDER BY a.clock_in DESC",
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
      "SELECT a.*, s.full_name FROM hr_attendance a LEFT JOIN staff_records s ON a.staff_id = s.id WHERE a.company_id = ? ORDER BY a.date DESC, a.clock_in DESC LIMIT 200",
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

  // Merge staff list with today's attendance
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
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Attendance</h2>
              <p className="text-teal-100 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="flex gap-6 text-center">
              <div><p className="text-2xl font-bold">{totalPresent}</p><p className="text-xs text-teal-200">Present</p></div>
              <div><p className="text-2xl font-bold">{totalLate}</p><p className="text-xs text-teal-200">Late</p></div>
              <div><p className="text-2xl font-bold">{totalAbsent}</p><p className="text-xs text-teal-200">Absent</p></div>
            </div>
          </div>

          {/* My Clock In/Out */}
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">My Attendance Today</p>
              <p className="text-teal-100 text-xs mt-0.5">
                {myRecord ? (
                  <>In: {formatTime(myRecord.clock_in)} {myRecord.clock_out ? `· Out: ${formatTime(myRecord.clock_out)}` : "· Still clocked in"}</>
                ) : "Not clocked in yet"}
              </p>
              {gpsStatus && <p className="text-teal-200 text-xs mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{gpsStatus}</p>}
            </div>
            {!myRecord ? (
              <Button size="sm" className="bg-white text-teal-700 hover:bg-white/90 gap-2" onClick={clockIn} disabled={clockingIn}>
                <LogIn className="w-4 h-4" />{clockingIn ? "Clocking in..." : "Clock In"}
              </Button>
            ) : !myRecord.clock_out ? (
              <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 gap-2" onClick={clockOut}>
                <LogOut className="w-4 h-4" />Clock Out
              </Button>
            ) : (
              <span className="text-xs bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />{hoursWorked(myRecord.clock_in, myRecord.clock_out)}h worked
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Today's Board</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">History</TabsTrigger>
        </TabsList>

        {/* TODAY */}
        <TabsContent value="today" className="mt-4">
          {staff.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">No staff found</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {boardData.map(member => (
                <div key={member.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {avatarInitials(member.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.record ? `In: ${formatTime(member.record.clock_in)}` : "Not yet clocked in"}</p>
                    {member.record?.clock_out && (
                      <p className="text-xs text-muted-foreground">Out: {formatTime(member.record.clock_out)} · {hoursWorked(member.record.clock_in, member.record.clock_out)}h</p>
                    )}
                    {member.record?.location_lat && (
                      <p className="text-xs text-teal-600 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />GPS tracked</p>
                    )}
                  </div>
                  <StatusBadge status={member.record?.status || "absent"} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="mt-4">
          <div className="flex gap-3 mb-4 flex-wrap">
            <Select value={historyFilter.status} onValueChange={v => setHistoryFilter(f => ({ ...f, status: v }))}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={historyFilter.staff_id} onValueChange={v => setHistoryFilter(f => ({ ...f, staff_id: v }))}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Staff Member" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" className="w-44" value={historyFilter.date} onChange={e => setHistoryFilter(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Staff</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Clock In</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Clock Out</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Hours</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">No records found</td></tr>
                ) : filteredHistory.map((r, i) => (
                  <tr key={r.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3 font-medium">{r.full_name || "Unknown"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTime(r.clock_in)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTime(r.clock_out)}</td>
                    <td className="px-4 py-3 font-medium">{hoursWorked(r.clock_in, r.clock_out) ? `${hoursWorked(r.clock_in, r.clock_out)}h` : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.location_lat ? <span className="flex items-center gap-1 text-teal-600"><MapPin className="w-3 h-3" />GPS</span> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
