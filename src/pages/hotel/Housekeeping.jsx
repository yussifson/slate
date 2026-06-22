import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Brush, Sparkles, AlertCircle, CheckCircle, BedDouble, User, Plus, Search, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateText } from '@/lib/cloudflareAI';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOUSEKEEPERS = ['Maria', 'David', 'Elena', 'Carlos'];

export default function Housekeeping() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('housekeeping');
  
  const { data: dbRooms = [], isLoading: loadingRooms } = useIndustryRecords('room');
  const { data: dbReservations = [], isLoading: loadingRes } = useIndustryRecords('reservation');
  const { data: dbMaintenance = [], isLoading: loadingMaintenance } = useIndustryRecords('maintenance');
  const { data: dbLostFound = [], isLoading: loadingLostFound } = useIndustryRecords('lost_found');
  const isLoading = loadingRooms || loadingRes || loadingMaintenance || loadingLostFound;
  const mutateRecord = useMutateIndustryRecord();

  const [assigningRoom, setAssigningRoom] = useState(null);
  const [selectedCleaner, setSelectedCleaner] = useState('');

  const rooms = dbRooms.map(r => ({
    id: r.id,
    status: r.status || 'Available',
    ...r.data
  }));

  const handleUpdateStatus = (room, newStatus, assignedStaff = room.cleaner) => {
    const updatedPayload = {
      ...room,
      cleaner: newStatus === 'Available' ? null : assignedStaff
    };
    
    // Clean up to avoid nested data inside payload
    delete updatedPayload.id;
    delete updatedPayload.status;

    mutateRecord.mutate({
      id: room.id,
      recordType: 'room',
      payload: updatedPayload,
      status: newStatus,
      searchText: `${room.roomNumber} ${room.type}`
    }, {
      onSuccess: () => {
        toast.success(`Room ${room.roomNumber} marked as ${newStatus}`);
      },
      onError: (err) => {
        toast.error('Failed to update room: ' + err.message);
      }
    });
  };

  const confirmAssignment = () => {
    if (!selectedCleaner) return toast.error("Please select a housekeeper");
    handleUpdateStatus(assigningRoom, 'Cleaning', selectedCleaner);
    setAssigningRoom(null);
    setSelectedCleaner('');
  };

  const columns = {
    dirty: rooms.filter(r => r.status === 'Dirty' || (r.status === 'Cleaning' && !r.cleaner)),
    inProgress: rooms.filter(r => r.status === 'Cleaning' && r.cleaner),
    inspecting: rooms.filter(r => r.status === 'Inspecting'),
    clean: rooms.filter(r => r.status === 'Available')
  };

  const assignmentsByCleaner = HOUSEKEEPERS.map(hk => ({
    name: hk,
    tasks: rooms.filter(r => r.cleaner === hk && (r.status === 'Cleaning' || r.status === 'Inspecting'))
  }));

  if (isLoading) {
    return (
      <div className="py-12 text-center text-[#71717a] dark:text-gray-400" style={{ background: "linear-gradient(135deg, rgba(68,49,153,0.08) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
        {t("loading_housekeeping_records", "Loading records...")}
      </div>
    );
  }

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const handleAIAutoAssign = async () => {
    if (columns.dirty.length === 0) return toast.error("No dirty rooms to schedule.");
    setIsAnalyzing(true);
    const tId = toast.loading('AI calculating optimal cleaning routes based on check-ins...');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const activeRes = dbReservations.map(r => r.data).filter(r => r.checkIn === todayStr || r.checkOut === todayStr);
      
      const prompt = `You are an AI housekeeping manager. There are ${columns.dirty.length} dirty rooms. 
Assign them optimally between the housekeepers: ${HOUSEKEEPERS.join(', ')}. 
Prioritize rooms that have a check-in TODAY over rooms that are just check-outs or empty.
Reply ONLY with a JSON array of assignments like: [{"roomId": "room_id_here", "cleaner": "Maria"}].
Rooms data: ${JSON.stringify(columns.dirty.map(r => ({ id: r.id, roomNumber: r.roomNumber, floor: r.floor })))}
Reservations data (for priority context): ${JSON.stringify(activeRes.map(r => ({ roomNumber: r.roomNumber, checkIn: r.checkIn, checkOut: r.checkOut })))}`;
      
      const response = await generateText(prompt);
      let assignments = [];
      try {
        const jsonMatch = response.match(/\[([\s\S]*?)\]/);
        if (jsonMatch) {
            assignments = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
          console.error("Failed to parse AI JSON", e);
      }
      
      columns.dirty.forEach((room, idx) => {
        const assignment = assignments.find(a => a.roomId === room.id);
        const cleaner = assignment ? assignment.cleaner : HOUSEKEEPERS[idx % HOUSEKEEPERS.length];
        handleUpdateStatus(room, 'Cleaning', cleaner);
      });
      
      toast.success('AI successfully optimized and assigned all routes!', { id: tId });
    } catch (err) {
      toast.error('AI scheduling failed', { id: tId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex gap-4 border-b border-primary/20 pb-4 mb-6">
        <Button variant={activeTab === 'housekeeping' ? 'default' : 'outline'} onClick={() => setActiveTab('housekeeping')}>Housekeeping</Button>
        <Button variant={activeTab === 'schedules' ? 'default' : 'outline'} onClick={() => setActiveTab('schedules')}>Staff Schedules</Button>
        <Button variant={activeTab === 'maintenance' ? 'default' : 'outline'} onClick={() => setActiveTab('maintenance')}>Maintenance</Button>
        <Button variant={activeTab === 'lost_found' ? 'default' : 'outline'} onClick={() => setActiveTab('lost_found')}>Lost & Found</Button>
      </div>

      {activeTab === 'housekeeping' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("housekeeping_board", "Housekeeping Board")}</h1>
              <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
                "manage_daily_cleaning_schedule",
                "Manage daily cleaning schedules and room inspections"
              )}</p>
            </div>
            <Button onClick={handleAIAutoAssign} disabled={isAnalyzing} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg">
              <Sparkles className="w-4 h-4" /> AI Auto-Schedule Routes
            </Button>
          </div>
          {rooms.length === 0 ? (
            <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-12 text-center text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">{t("no_configured_rooms_found", "No configured rooms found.")}</p>
              <p className="text-xs mt-1 tracking-[0.04em]">{t(
                "please_configure_rooms_in_the_",
                "Please configure rooms in the Rooms page first to see them here."
              )}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Column 1: Dirty */}
              <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 min-h-[500px]">
                <h3 className="font-semibold text-foreground flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500"/> {t("dirty", "Dirty")}</span>
                  <span className="bg-slate-200 dark:bg-slate-800 text-[#71717a] dark:text-gray-400 px-2 py-0.5 rounded-full text-xs tracking-[0.04em]">{columns.dirty.length}</span>
                </h3>
                <div className="space-y-3">
                  {columns.dirty.map(room => (
                    <div key={room.id} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-l-4 border-l-red-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <p className="font-semibold text-lg mb-1">{t("room", "Room")} {room.roomNumber}</p>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 mb-3 tracking-[0.04em]">{room.type} {t("needs_clean", "• Needs Clean")}</p>
                      <Button onClick={() => setAssigningRoom(room)} size="sm" className="w-full text-xs bg-primary hover:bg-primary/90 text-white tracking-[0.04em]">{t("assign_cleaning", "Assign Cleaner")}</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="bg-slate-500 dark:bg-slate-100 rounded-xl p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/30 min-h-[500px]">
                <h3 className="font-semibold text-primary/70 dark:text-primary/70 flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2"><Brush className="w-4 h-4 text-primary dark:text-primary"/> {t("in_progress", "In Progress")}</span>
                  <span className="bg-slate-100 dark:bg-primary/60 text-primary/80 dark:text-primary/30 px-2 py-0.5 rounded-full text-xs tracking-[0.04em]">{columns.inProgress.length}</span>
                </h3>
                <div className="space-y-3">
                  {columns.inProgress.map(room => (
                    <div key={room.id} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-l-4 border-l-violet-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <p className="font-semibold text-lg mb-1">{t("room", "Room")} {room.roomNumber}</p>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 mb-3 flex items-center gap-2 tracking-[0.04em]"><User className="w-3.5 h-3.5" /> {t("assigned", "Assigned:")} {room.cleaner}</p>
                      <Button onClick={() => handleUpdateStatus(room, 'Inspecting')} size="sm" variant="outline" className="w-full text-xs border-primary/20 dark:border-primary/70 text-primary/90 dark:text-primary/70 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-primary/35 tracking-[0.04em]">{t("mark_ready_for_inspection", "Mark Ready for Inspection")}</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Inspecting */}
              <div className="bg-slate-500 dark:bg-slate-100 rounded-xl p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/30 min-h-[500px]">
                <h3 className="font-semibold text-primary/70 dark:text-primary/70 flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary dark:text-primary"/> {t("inspecting", "Inspecting")}</span>
                  <span className="bg-slate-100 dark:bg-primary/60 text-primary/80 dark:text-primary/30 px-2 py-0.5 rounded-full text-xs tracking-[0.04em]">{columns.inspecting.length}</span>
                </h3>
                <div className="space-y-3">
                  {columns.inspecting.map(room => (
                    <div key={room.id} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-l-4 border-l-violet-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-lg">{t("room", "Room")} {room.roomNumber}</p>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(room, 'Dirty')} className="text-xs h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">Reject</Button>
                      </div>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 mb-3 tracking-[0.04em]">{t("waiting_approval", "Waiting Approval")} ({room.cleaner})</p>
                      <Button onClick={() => handleUpdateStatus(room, 'Available')} size="sm" className="w-full text-xs bg-primary hover:bg-primary/90 text-white tracking-[0.04em]">{t("approve_as_clean", "Approve as Clean")}</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Clean */}
              <div className="bg-slate-500 dark:bg-slate-100 rounded-xl p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/30 min-h-[500px]">
                <h3 className="font-semibold text-primary/70 dark:text-primary/70 flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary dark:text-primary"/> {t("clean_ready", "Clean & Ready")}</span>
                  <span className="bg-slate-100 dark:bg-primary/60 text-primary/80 dark:text-primary/30 px-2 py-0.5 rounded-full text-xs tracking-[0.04em]">{columns.clean.length}</span>
                </h3>
                <div className="space-y-3 opacity-90">
                  {columns.clean.map(room => (
                    <div key={room.id} className="bg-card p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 dark:border-primary/70 flex justify-between items-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <div>
                        <span className="font-semibold text-primary/80 dark:text-primary/70 block">{t("room", "Room")} {room.roomNumber}</span>
                        <Button variant="link" size="sm" onClick={() => handleUpdateStatus(room, 'Dirty')} className="h-4 p-0 text-[10px] text-red-500/70 hover:text-red-500">Mark Dirty</Button>
                      </div>
                      <CheckCircle className="w-4 h-4 text-primary"/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'schedules' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Staff Cleaning Schedules</h2>
              <p className="text-sm text-gray-500">Track active assignments per housekeeper</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {assignmentsByCleaner.map(cleaner => (
              <div key={cleaner.name} className="bg-card rounded-xl border border-primary/20 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-primary/10">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{cleaner.name}</h3>
                    <p className="text-xs text-muted-foreground">{cleaner.tasks.length} active tasks</p>
                  </div>
                </div>
                {cleaner.tasks.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <CalendarClock className="w-8 h-8 mb-2" />
                    <p className="text-xs">No active assignments</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cleaner.tasks.map(task => (
                      <div key={task.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-lg text-sm">
                        <span className="font-medium">Room {task.roomNumber}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${task.status === 'Inspecting' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Maintenance Issues</h2>
              <p className="text-sm text-gray-500">Track and manage facility repairs</p>
            </div>
            <Button onClick={() => {
              const roomNumber = prompt("Room Number/Location:");
              if(!roomNumber) return;
              const issue = prompt("Issue Description:");
              if(!issue) return;
              const priority = prompt("Priority (Low/Medium/High):", "Medium");
              mutateRecord.mutate({
                id: crypto.randomUUID(),
                recordType: 'maintenance',
                payload: { roomNumber, issue, priority, status: 'Open' },
                status: 'Open',
                searchText: `${roomNumber} ${issue} ${priority}`
              }, { onSuccess: () => toast.success("Issue logged!") });
            }} className="gap-2">
              <Plus className="w-4 h-4"/> Log Issue
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dbMaintenance.map(m => (
              <div key={m.id} className="bg-card p-5 rounded-xl border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-lg">Room {m.data.roomNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    m.data.priority?.toLowerCase() === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    m.data.priority?.toLowerCase() === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {m.data.priority} Priority
                  </span>
                </div>
                <p className="text-sm mb-5 text-gray-700 dark:text-gray-300 min-h-[40px]">{m.data.issue}</p>
                <div className="flex justify-between items-center pt-3 border-t border-primary/10">
                  <span className={`text-xs font-medium ${m.data.status === 'Resolved' ? 'text-green-600' : 'text-blue-600'}`}>
                    Status: {m.data.status}
                  </span>
                  {m.data.status !== 'Resolved' && (
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                      mutateRecord.mutate({
                        id: m.id,
                        recordType: 'maintenance',
                        payload: { ...m.data, status: 'Resolved' },
                        status: 'Resolved',
                        searchText: m.search_text
                      }, { onSuccess: () => toast.success("Marked as resolved!") });
                    }}>Mark Resolved</Button>
                  )}
                </div>
              </div>
            ))}
            {dbMaintenance.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 border border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No maintenance issues found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'lost_found' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Lost & Found</h2>
              <p className="text-sm text-gray-500">Log and track items left behind by guests</p>
            </div>
            <Button onClick={() => {
              const item = prompt("Item Description:");
              if(!item) return;
              const location = prompt("Found Location (e.g., Room 101 or Pool):");
              if(!location) return;
              const date = new Date().toISOString().split('T')[0];
              mutateRecord.mutate({
                id: crypto.randomUUID(),
                recordType: 'lost_found',
                payload: { item, location, date, status: 'Stored' },
                status: 'Stored',
                searchText: `${item} ${location}`
              }, { onSuccess: () => toast.success("Item logged!") });
            }} className="gap-2">
              <Plus className="w-4 h-4"/> Log Item
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dbLostFound.map(lf => (
              <div key={lf.id} className="bg-card p-5 rounded-xl border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-lg truncate pr-2" title={lf.data.item}>{lf.data.item}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                    lf.data.status === 'Claimed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {lf.data.status}
                  </span>
                </div>
                <div className="space-y-1 mb-5">
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Found at:</span> {lf.data.location}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Date:</span> {lf.data.date}</p>
                </div>
                {lf.data.status !== 'Claimed' ? (
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => {
                    mutateRecord.mutate({
                      id: lf.id,
                      recordType: 'lost_found',
                      payload: { ...lf.data, status: 'Claimed' },
                      status: 'Claimed',
                      searchText: lf.search_text
                    }, { onSuccess: () => toast.success("Marked as claimed!") });
                  }}>Mark as Claimed</Button>
                ) : (
                  <Button size="sm" variant="ghost" disabled className="w-full text-xs opacity-50">Claimed</Button>
                )}
              </div>
            ))}
            {dbLostFound.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 border border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No lost and found items recorded.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Housekeeper Assignment Modal */}
      {assigningRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Assign Cleaner to Room {assigningRoom.roomNumber}</h2>
            <div className="space-y-4">
              <label className="text-sm font-semibold">Select Housekeeper</label>
              <select 
                value={selectedCleaner} 
                onChange={e => setSelectedCleaner(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-primary focus:border-primary"
              >
                <option value="">-- Choose a staff member --</option>
                {HOUSEKEEPERS.map(hk => (
                  <option key={hk} value={hk}>{hk}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setAssigningRoom(null)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white" onClick={confirmAssignment}>Assign</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
