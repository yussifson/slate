import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Brush, Sparkles, AlertCircle, CheckCircle, BedDouble, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

export default function Housekeeping() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading } = useIndustryRecords('room');
  const mutateRecord = useMutateIndustryRecord();

  const rooms = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Available',
    ...r.data
  }));

  const handleUpdateStatus = (room, newStatus, assignedStaff = room.cleaner) => {
    const updatedPayload = {
      roomNumber: room.roomNumber,
      type: room.type,
      rate: room.rate,
      floor: room.floor,
      amenities: room.amenities,
      guest: room.guest || null,
      cleaner: assignedStaff || null
    };

    mutateRecord.mutate({
      id: room.id,
      recordType: 'room',
      payload: updatedPayload,
      status: newStatus,
      searchText: `${room.roomNumber} ${room.type}`
    }, {
      onSuccess: () => {
        toast.success(`Room ${room.roomNumber} updated successfully!`);
      },
      onError: (err) => {
        toast.error('Failed to update room: ' + err.message);
      }
    });
  };

  // Group rooms by Kanban column
  // Columns: Dirty (we treat 'Dirty' and 'Cleaning' with no staff as Dirty)
  // In Progress (we treat 'Cleaning' with staff as In Progress)
  // Inspecting (we treat 'Inspecting')
  // Clean ('Available')
  const columns = {
    dirty: rooms.filter(r => r.status === 'Dirty' || (r.status === 'Cleaning' && !r.cleaner)),
    inProgress: rooms.filter(r => r.status === 'Cleaning' && r.cleaner),
    inspecting: rooms.filter(r => r.status === 'Inspecting'),
    clean: rooms.filter(r => r.status === 'Available')
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground" style={{ backgroundColor: "rgba(68, 49, 153, 0.03)", minHeight: "100vh" }}>
        {t("loading_housekeeping_records", "Loading housekeeping records...")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("housekeeping_board", "Housekeeping Board")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "manage_daily_cleaning_schedule",
            "Manage daily cleaning schedules and room inspections"
          )}</p>
        </div>
      </div>
      {rooms.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">{t("no_configured_rooms_found", "No configured rooms found.")}</p>
          <p className="text-xs mt-1">{t(
            "please_configure_rooms_in_the_",
            "Please configure rooms in the Rooms page first to see them here."
          )}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {/* Column 1: Dirty */}
           <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-border min-h-[500px]">
              <h3 className="font-bold text-foreground flex items-center justify-between mb-4">
                 <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500"/> {t("dirty", "Dirty")}</span>
                 <span className="bg-slate-200 dark:bg-slate-800 text-muted-foreground px-2 py-0.5 rounded-full text-xs">{columns.dirty.length}</span>
              </h3>
              <div className="space-y-3">
                 {columns.dirty.map(room => {
                   return (
                     <div key={room.id} className="bg-card p-4 rounded-lg shadow-sm border border-border border-l-4 border-l-red-500">
                       <p className="font-bold text-lg mb-1">{t("room", "Room")} {room.roomNumber}</p>
                       <p className="text-xs text-muted-foreground mb-3">{room.type} {t("needs_clean", "• Needs Clean")}</p>
                       <Button onClick={() => handleUpdateStatus(room, 'Cleaning', 'Housekeeper A')} size="sm" className="w-full text-xs bg-[#443199] hover:bg-[#362878] text-white">{t("start_cleaning", "Start Cleaning")}</Button>
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Column 2: In Progress */}
           <div className="bg-violet-50/50 dark:bg-violet-950/10 rounded-xl p-4 border border-violet-100 dark:border-violet-900/30 min-h-[500px]">
              <h3 className="font-bold text-violet-900 dark:text-violet-400 flex items-center justify-between mb-4">
                 <span className="flex items-center gap-2"><Brush className="w-4 h-4 text-violet-600 dark:text-violet-500"/> {t("in_progress", "In Progress")}</span>
                 <span className="bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 px-2 py-0.5 rounded-full text-xs">{columns.inProgress.length}</span>
              </h3>
              <div className="space-y-3">
                 {columns.inProgress.map(room => {
                   return (
                     <div key={room.id} className="bg-card p-4 rounded-lg shadow-sm border border-border border-l-4 border-l-violet-500">
                       <p className="font-bold text-lg mb-1">{t("room", "Room")} {room.roomNumber}</p>
                       <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><User className="w-3.5 h-3.5" /> {t("assigned", "Assigned:")} {room.cleaner}</p>
                       <Button onClick={() => handleUpdateStatus(room, 'Inspecting')} size="sm" variant="outline" className="w-full text-xs border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/35">{t("mark_ready_for_inspection", "Mark Ready for Inspection")}</Button>
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Column 3: Inspecting */}
           <div className="bg-violet-50/50 dark:bg-violet-950/10 rounded-xl p-4 border border-violet-100 dark:border-violet-900/30 min-h-[500px]">
              <h3 className="font-bold text-violet-900 dark:text-violet-400 flex items-center justify-between mb-4">
                 <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-500"/> {t("inspecting", "Inspecting")}</span>
                 <span className="bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 px-2 py-0.5 rounded-full text-xs">{columns.inspecting.length}</span>
              </h3>
              <div className="space-y-3">
                 {columns.inspecting.map(room => {
                   return (
                     <div key={room.id} className="bg-card p-4 rounded-lg shadow-sm border border-border border-l-4 border-l-violet-500">
                       <p className="font-bold text-lg mb-1">{t("room", "Room")} {room.roomNumber}</p>
                       <p className="text-xs text-muted-foreground mb-3">{t("waiting_approval", "Waiting Approval")}</p>
                       <Button onClick={() => handleUpdateStatus(room, 'Available', null)} size="sm" className="w-full text-xs bg-[#443199] hover:bg-[#362878] text-white">{t("approve_as_clean", "Approve as Clean")}</Button>
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Column 4: Clean */}
           <div className="bg-green-50/50 dark:bg-green-950/10 rounded-xl p-4 border border-green-100 dark:border-green-900/30 min-h-[500px]">
              <h3 className="font-bold text-green-900 dark:text-green-400 flex items-center justify-between mb-4">
                 <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500"/> {t("clean_ready", "Clean & Ready")}</span>
                 <span className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full text-xs">{columns.clean.length}</span>
              </h3>
              <div className="space-y-3 opacity-80">
                 {columns.clean.map(room => {
                   return (
                     <div key={room.id} className="bg-card p-3 rounded-lg border border-green-200 dark:border-green-900 flex justify-between items-center shadow-sm">
                       <span className="font-bold text-green-800 dark:text-green-400">{t("room", "Room")} {room.roomNumber}</span>
                       <CheckCircle className="w-4 h-4 text-green-500"/>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

