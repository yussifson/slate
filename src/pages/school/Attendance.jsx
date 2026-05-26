import { useState } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Clock, Users, ClipboardList, Plus, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

const CLASS_LIST = ['Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'];

export default function Attendance() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedClass, setSelectedClass] = useState('Grade 9A');
  const [date, setDate] = useState(today);
  const [takenBy, setTakenBy] = useState('');
  // Local per-student status map: { studentId: 'Present'|'Absent'|'Late' }
  const [statusMap, setStatusMap] = useState({});
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Fetch student list for populating the sheet
  const { data: studentRecords = [] } = useIndustryRecords('student');
  // Fetch saved attendance records
  const { data: attendanceRecords = [], isLoading } = useIndustryRecords('attendance');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  // Students in selected class
  const classStudents = studentRecords
    .filter(r => r.data?.class === selectedClass)
    .map(r => ({ id: r.id, name: r.data?.name || 'Unknown', studentId: r.data?.studentId || '' }));

  // Attendance records for this class/date combo
  const savedAttendance = attendanceRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data,
  }));
  const filteredSaved = savedAttendance.filter(
    a => a.className === selectedClass && a.date === date
  );

  // Live stats from statusMap
  const markedCount = Object.keys(statusMap).length;
  const presentCount = Object.values(statusMap).filter(v => v === 'Present').length;
  const absentCount = Object.values(statusMap).filter(v => v === 'Absent').length;
  const lateCount = Object.values(statusMap).filter(v => v === 'Late').length;
  const presentPct = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;

  const handleStatusChange = (studentId, status) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = () => {
    if (Object.keys(statusMap).length === 0) {
      return toast.error('Please mark attendance for at least one student.');
    }

    const records = classStudents.map(s => ({
      studentId: s.studentId,
      studentName: s.name,
      status: statusMap[s.id] || 'Absent',
    }));

    mutateRecord.mutate({
      recordType: 'attendance',
      payload: {
        date,
        className: selectedClass,
        takenBy: takenBy || 'Staff',
        records,
      },
      status: 'Active',
      searchText: `${selectedClass} ${date} ${takenBy}`,
    }, {
      onSuccess: () => {
        toast.success(editingId ? 'Attendance updated successfully!' : 'Attendance submitted successfully!');
        setStatusMap({});
        setTakenBy('');
        setEditingId(null);
      },
      onError: (err) => toast.error('Failed to save: ' + err.message),
    });
  };

  const handleEdit = (rec) => {
    setEditingId(rec.id);
    setDate(rec.date);
    setSelectedClass(rec.className);
    setTakenBy(rec.takenBy || '');
    const newStatusMap = {};
    if (Array.isArray(rec.records)) {
      rec.records.forEach(r => {
        newStatusMap[r.studentId] = r.status;
      });
    }
    setStatusMap(newStatusMap);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'attendance' }, {
      onSuccess: () => { toast.success('Attendance record deleted.'); setDeleteTargetId(null); },
      onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null); },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Daily class attendance register</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setStatusMap({}); }}
            className="w-auto"
          />
          <select
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setStatusMap({}); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm text-foreground"
          >
            {CLASS_LIST.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{classStudents.length}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border border-l-4 border-l-green-500 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present ({presentPct}%)</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border border-l-4 border-l-red-500 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border border-l-4 border-l-amber-500 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </div>
        </div>
      </div>

      {/* Attendance Sheet */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-card-foreground font-semibold">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span>{selectedClass} — {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Taken by</label>
            <Input
              value={takenBy}
              onChange={e => setTakenBy(e.target.value)}
              placeholder="Teacher name..."
              className="h-8 text-sm w-40 bg-background"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-green-600 uppercase tracking-wide">Present</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-red-600 uppercase tracking-wide">Absent</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-amber-600 uppercase tracking-wide">Late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classStudents.map(student => (
                <tr key={student.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-card-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{student.studentId}</p>
                      </div>
                    </div>
                  </td>
                  {['Present', 'Absent', 'Late'].map(status => (
                    <td key={status} className="px-4 py-3 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`att-${student.id}`}
                          checked={statusMap[student.id] === status}
                          onChange={() => handleStatusChange(student.id, status)}
                          className={`w-5 h-5 cursor-pointer ${
                            status === 'Present' ? 'accent-green-600' :
                            status === 'Absent' ? 'accent-red-600' : 'accent-amber-500'
                          }`}
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-blue-600" />
                    <p className="font-medium">No students enrolled in {selectedClass}</p>
                    <p className="text-xs mt-1">Enroll students in the Students page first.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {classStudents.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={mutateRecord.isPending || Object.keys(statusMap).length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              {mutateRecord.isPending ? 'Submitting...' : `Submit Attendance (${markedCount}/${classStudents.length})`}
            </Button>
          </div>
        )}
      </div>

      {/* Saved Attendance Records */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <h3 className="font-bold text-card-foreground flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Saved Records — {selectedClass} on {date}
          </h3>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading records...</div>
        ) : filteredSaved.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
            <p>No attendance saved for this date and class yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Taken By</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Late</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSaved.map(rec => {
                  const recs = Array.isArray(rec.records) ? rec.records : [];
                  const p = recs.filter(r => r.status === 'Present').length;
                  const a = recs.filter(r => r.status === 'Absent').length;
                  const l = recs.filter(r => r.status === 'Late').length;
                  return (
                    <tr key={rec.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3 text-foreground font-medium">{rec.date}</td>
                      <td className="px-6 py-3"><Link to="/classes" className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md hover:underline">{rec.className}</Link></td>
                      <td className="px-6 py-3 text-muted-foreground">{rec.takenBy || '—'}</td>
                      <td className="px-6 py-3 text-center font-bold text-green-600">{p}</td>
                      <td className="px-6 py-3 text-center font-bold text-red-600">{a}</td>
                      <td className="px-6 py-3 text-center font-bold text-amber-600">{l}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setViewDetails(rec)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(rec)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 font-medium" onClick={() => setDeleteTargetId(rec.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteRecord}
        title="Delete Attendance Record"
        message="Are you sure you want to permanently delete this attendance record? This cannot be undone."
      />

      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Attendance Details</SheetTitle>
            <SheetDescription>View attendance records for this class session.</SheetDescription>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Class</p>
                  <Link to="/classes" className="text-primary hover:underline font-medium">{viewDetails.className}</Link>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Date</p>
                  <p className="font-medium text-foreground">{viewDetails.date}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Taken By</p>
                  <p className="font-medium text-foreground">{viewDetails.takenBy || '—'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground">Student Roster</h4>
                <div className="space-y-2">
                  {viewDetails.records && viewDetails.records.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border bg-card">
                      <span className="text-sm font-medium">{r.studentName}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.status === 'Present' ? 'bg-green-100 text-green-700' :
                        r.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
