import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Brush, Sparkles, AlertCircle, CheckCircle, BedDouble, User, Plus, Search, CalendarClock, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateText } from '@/lib/cloudflareAI';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Housekeeping() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('housekeeping');
  
  const [activeStaff, setActiveStaff] = useState([
    { name: 'Maria', shift: 'Morning', active: true },
    { name: 'David', shift: 'Morning', active: true },
    { name: 'Elena', shift: 'Afternoon', active: true },
    { name: 'Carlos', shift: 'Night', active: false }
  ]);
  const HOUSEKEEPERS = activeStaff.filter(s => s.active).map(s => s.name);

  const { data: dbRooms = [], isLoading: loadingRooms } = useIndustryRecords('room');
  const { data: dbReservations = [], isLoading: loadingRes } = useIndustryRecords('reservation');
  const { data: dbMaintenance = [], isLoading: loadingMaintenance } = useIndustryRecords('maintenance');
  const { data: dbLostFound = [], isLoading: loadingLostFound } = useIndustryRecords('lost_found');
  const { data: dbStages = [], isLoading: loadingStages } = useIndustryRecords('hotel_housekeeping_stage');
  const isLoading = loadingRooms || loadingRes || loadingMaintenance || loadingLostFound || loadingStages;
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const predefinedStages = ['Dirty', 'Cleaning', 'Inspecting', 'Available'];
  const customStages = dbStages.map(s => s.data.name);
  const allStages = [...new Set([...predefinedStages, ...customStages])];

  const [showStagesModal, setShowStagesModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  const [assigningRoom, setAssigningRoom] = useState(null);
  const [selectedCleaner, setSelectedCleaner] = useState('');

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffShift, setNewStaffShift] = useState('Morning');

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({ roomNumber: '', issue: '', priority: 'Medium' });

  const [showLostFoundModal, setShowLostFoundModal] = useState(false);
  const [lostFoundForm, setLostFoundForm] = useState({ item: '', location: '', date: new Date().toISOString().split('T')[0] });

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

  const assignmentsByCleaner = HOUSEKEEPERS.map(hk => ({
    name: hk,
    tasks: rooms.filter(r => r.cleaner === hk && (r.status === 'Cleaning' || r.status === 'Inspecting'))
  }));

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-[#71717a] dark:text-gray-400" style={{ background: "linear-gradient(135deg, rgba(68,49,153,0.08) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
        {t("loading_housekeeping_records", "Loading records...")}
      </div>
    );
  }
  const handleAIAutoAssign = async () => {
    const dirtyRooms = rooms.filter(r => r.status === 'Dirty');
    if (dirtyRooms.length === 0) return toast.error("No dirty rooms to schedule.");
    setIsAnalyzing(true);
    const tId = toast.loading('AI calculating optimal cleaning routes based on check-ins...');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const activeRes = dbReservations.map(r => r.data).filter(r => r.checkIn === todayStr || r.checkOut === todayStr);
      
      const prompt = `You are an AI housekeeping manager. There are ${dirtyRooms.length} dirty rooms. 
Assign them optimally between the housekeepers: ${HOUSEKEEPERS.join(', ')}. 
Prioritize rooms that have a check-in TODAY over rooms that are just check-outs or empty.
Reply ONLY with a JSON array of assignments like: [{"roomId": "room_id_here", "cleaner": "Maria"}].
Rooms data: ${JSON.stringify(dirtyRooms.map(r => ({ id: r.id, roomNumber: r.roomNumber, floor: r.floor })))}
Reservations data (for priority context): ${JSON.stringify(activeRes.map(r => ({ roomNumber: r.roomNumber, checkIn: r.checkIn, checkOut: r.checkOut })))}`;
      
      const response = await generateText(prompt);
      let assignments = [];
      try {
        const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
        const jsonMatch = responseStr.match(/\[([\s\S]*?)\]/);
        if (jsonMatch) {
            assignments = JSON.parse(jsonMatch[0]);
        } else if (Array.isArray(response)) {
            assignments = response;
        }
      } catch (e) {
          console.error("Failed to parse AI JSON", e);
      }
      
      dirtyRooms.forEach((room, idx) => {
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
        <Button variant={activeTab === 'schedules' ? 'default' : 'outline'} onClick={() => setActiveTab('schedules')}>Shift Schedules</Button>
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
            <div className="flex gap-3">
              <Button onClick={() => setShowStagesModal(true)} variant="outline" className="gap-2 shadow-sm">
                <Settings className="w-4 h-4" /> Manage Stages
              </Button>
              <Button onClick={handleAIAutoAssign} disabled={isAnalyzing} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg">
                <Sparkles className="w-4 h-4" /> AI Auto-Schedule Routes
              </Button>
            </div>
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
            <div className={`grid gap-6 overflow-x-auto pb-4`} style={{ gridTemplateColumns: `repeat(${allStages.length}, minmax(300px, 1fr))` }}>
              {allStages.map(stage => {
                const stageRooms = rooms.filter(r => r.status === stage);
                return (
                  <div key={stage} className="bg-card rounded-xl p-4 border border-border min-h-[500px]">
                    <h3 className="font-semibold text-foreground flex items-center justify-between mb-4">
                      <span className="flex items-center gap-2">{stage}</span>
                      <span className="bg-slate-200 dark:bg-slate-800 text-[#71717a] dark:text-gray-400 px-2 py-0.5 rounded-full text-xs tracking-[0.04em]">{stageRooms.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {stageRooms.map(room => (
                        <div key={room.id} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-l-4 border-l-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                          <p className="font-semibold text-lg mb-1">{t("room", "Room")} {room.roomNumber}</p>
                          <p className="text-xs text-[#71717a] dark:text-gray-400 mb-3 tracking-[0.04em] flex justify-between items-center">
                            <span>{room.type}</span>
                            {room.cleaner && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{room.cleaner}</span>}
                          </p>
                          <Select value={room.status} onValueChange={(val) => handleUpdateStatus(room, val)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {allStages.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!room.cleaner && stage === 'Dirty' && (
                            <Button onClick={() => setAssigningRoom(room)} size="sm" className="w-full mt-2 text-xs bg-primary hover:bg-primary/90 text-white tracking-[0.04em]">{t("assign_cleaning", "Assign Cleaner")}</Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Manage Stages Modal */}
          {showStagesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-card rounded-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">Manage Kanban Stages</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowStagesModal(false)}><Trash2 className="w-4 h-4 opacity-0"/></Button>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto mb-6 pr-2">
                  {predefinedStages.map(s => (
                    <div key={s} className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border">
                      <span className="font-medium text-sm">{s}</span>
                      <span className="text-xs text-muted-foreground bg-slate-200 px-2 py-1 rounded">Default (Locked)</span>
                    </div>
                  ))}
                  {dbStages.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-card rounded-lg border border-border shadow-sm">
                      <span className="font-medium text-sm">{s.data.name}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteRecord.mutate({ id: s.id, recordType: 'hotel_housekeeping_stage' })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="New Stage Name (e.g. Deep Clean)" className="flex-1" />
                  <Button onClick={() => {
                    if(!newStageName.trim()) return toast.error("Enter a stage name");
                    mutateRecord.mutate({
                      recordType: 'hotel_housekeeping_stage',
                      payload: { name: newStageName },
                      status: 'Active',
                      searchText: newStageName
                    }, {
                      onSuccess: () => {
                        setNewStageName('');
                        toast.success("Stage added!");
                      }
                    });
                  }} className="bg-primary text-white">Add</Button>
                </div>
                <Button className="w-full mt-6" variant="outline" onClick={() => setShowStagesModal(false)}>Close</Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'schedules' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Shift Schedules & Task Assignment</h2>
              <p className="text-sm text-gray-500">Toggle staff shifts to make them available for AI auto-routing.</p>
            </div>
          </div>
          
          <div className="bg-card border border-primary/20 rounded-xl p-6 mb-8 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Active Shift Roster</h3>
              <div className="flex gap-2">
                <Input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="New Staff Name" className="h-8 text-sm w-32" />
                <Select value={newStaffShift} onValueChange={setNewStaffShift}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8" onClick={() => {
                  if(!newStaffName) return;
                  setActiveStaff([...activeStaff, { name: newStaffName, shift: newStaffShift, active: true }]);
                  setNewStaffName('');
                }}>Add</Button>
              </div>
            </div>
            <div className="flex gap-4">
              {activeStaff.map((staff, idx) => (
                <div key={idx} className="flex-shrink-0 w-48 border border-border rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold">{staff.name}</span>
                    <button 
                      onClick={() => {
                        const newStaff = [...activeStaff];
                        newStaff[idx].active = !newStaff[idx].active;
                        setActiveStaff(newStaff);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${staff.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {staff.active ? 'On Shift' : 'Off Shift'}
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3"/> {staff.shift}</span>
                </div>
              ))}
            </div>
          </div>
          
          <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground tracking-wider mt-8">Current Task Load</h3>
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
            <Button onClick={() => setShowMaintenanceModal(true)} className="gap-2">
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
            <Button onClick={() => setShowLostFoundModal(true)} className="gap-2">
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

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Log Maintenance Issue</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Room Number / Location</label>
                <Input value={maintenanceForm.roomNumber} onChange={e => setMaintenanceForm({...maintenanceForm, roomNumber: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-semibold">Issue Description</label>
                <Input value={maintenanceForm.issue} onChange={e => setMaintenanceForm({...maintenanceForm, issue: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-semibold">Priority</label>
                <Select value={maintenanceForm.priority} onValueChange={val => setMaintenanceForm({...maintenanceForm, priority: val})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowMaintenanceModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white" onClick={() => {
                if(!maintenanceForm.roomNumber || !maintenanceForm.issue) return toast.error("Fill required fields");
                mutateRecord.mutate({
                  id: crypto.randomUUID(),
                  recordType: 'maintenance',
                  payload: { ...maintenanceForm, status: 'Open' },
                  status: 'Open',
                  searchText: `${maintenanceForm.roomNumber} ${maintenanceForm.issue} ${maintenanceForm.priority}`
                }, { onSuccess: () => { toast.success("Issue logged!"); setShowMaintenanceModal(false); setMaintenanceForm({ roomNumber: '', issue: '', priority: 'Medium' }); } });
              }}>Log Issue</Button>
            </div>
          </div>
        </div>
      )}

      {/* Lost & Found Modal */}
      {showLostFoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Log Lost & Found Item</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Item Description</label>
                <Input value={lostFoundForm.item} onChange={e => setLostFoundForm({...lostFoundForm, item: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-semibold">Found Location</label>
                <Input value={lostFoundForm.location} onChange={e => setLostFoundForm({...lostFoundForm, location: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-semibold">Date Found</label>
                <Input type="date" value={lostFoundForm.date} onChange={e => setLostFoundForm({...lostFoundForm, date: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowLostFoundModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white" onClick={() => {
                if(!lostFoundForm.item || !lostFoundForm.location) return toast.error("Fill required fields");
                mutateRecord.mutate({
                  id: crypto.randomUUID(),
                  recordType: 'lost_found',
                  payload: { ...lostFoundForm, status: 'Stored' },
                  status: 'Stored',
                  searchText: `${lostFoundForm.item} ${lostFoundForm.location}`
                }, { onSuccess: () => { toast.success("Item logged!"); setShowLostFoundModal(false); setLostFoundForm({ item: '', location: '', date: new Date().toISOString().split('T')[0] }); } });
              }}>Log Item</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
