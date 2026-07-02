import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Users, Lock, Globe, Clock, CalendarIcon, Briefcase } from 'lucide-react';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { Switch } from '@/components/ui/switch';
import { NotificationService } from '@/services/NotificationService';
import { base44 } from '@/api/base44Client';

export default function ScheduleMeetingDialog({ open, onOpenChange, onScheduled }) {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (open && companyId) {
      loadEmployees();
    }
  }, [open, companyId]);

  const loadEmployees = async () => {
    try {
      const [staffData, clientsData] = await Promise.all([
        base44.entities.StaffRecord.filter({ company_id: companyId }),
        base44.entities.Client.filter({ company_id: companyId }),
      ]);
      const staffMembers = (staffData || []).map(s => ({ ...s, id: s.id || s.user_id, full_name: s.first_name + ' ' + s.last_name, type: 'team' }));
      const clientMembers = (clientsData || []).map(c => ({ ...c, id: c.id, full_name: c.first_name + ' ' + c.last_name || c.name, type: 'client' }));
      setEmployees([...staffMembers, ...clientMembers]);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  };

  const handleToggleParticipant = (emp) => {
    if (selectedParticipants.find((p) => p.id === emp.id)) {
      setSelectedParticipants(selectedParticipants.filter((p) => p.id !== emp.id));
    } else {
      setSelectedParticipants([...selectedParticipants, emp]);
    }
  };

  const handleSchedule = async () => {
    if (!title || !date || !time) {
      toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledStart = new Date(`${date}T${time}`);
      
      const roomName = `scheduled-${Math.random().toString(36).substring(2, 10)}`;
      
      // 1. Create Daily Room
      const { data: dailyData, error: functionError } = await supabase.functions.invoke('create-daily-room', {
        body: { roomName, privacy: isPrivate ? 'private' : 'public' }
      });

      if (functionError) throw new Error(functionError.message || 'Failed to create Daily room via edge function');

      const realUrl = dailyData.url;
      const roomId = crypto.randomUUID();

      // 2. Save to PowerSync / Supabase
      const _payload = {
        id: roomId,
        company_id: companyId,
        title: title,
        description: `Scheduled meeting for ${scheduledStart.toLocaleString()}`,
        daily_room_url: realUrl,
        daily_room_name: dailyData.name || roomName,
        host_id: user.id,
        status: 'scheduled',
        meeting_type: 'scheduled',
        privacy_type: isPrivate ? 'private' : 'public',
        scheduled_start_time: scheduledStart.toISOString(),
        participants: JSON.stringify(selectedParticipants.map(p => ({ id: p.id, email: p.email, name: p.full_name }))),
        meeting_link: `${window.location.origin}/join/${roomId}` // generic join link to handle tokens
      };

      const _keys = Object.keys(_payload);
      const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
      await powerSync.execute(`INSERT INTO video_rooms (${_keys.join(', ')}) VALUES (${_keys.map(() => '?').join(', ')})`, _vals);

      // 3. Send Email Invites
      if (selectedParticipants.length > 0) {
        for (const participant of selectedParticipants) {
          await NotificationService.emit({
            companyId: companyId,
            recipientEmail: participant.email,
            title: `Meeting Invite: ${title}`,
            message: `You have been invited to a scheduled video meeting on ${scheduledStart.toLocaleString()}. Join here: ${_payload.meeting_link}`,
            type: 'video_meeting',
            relatedId: _payload.meeting_link
          });
        }
        toast({ title: 'Invites Sent', description: `Emailed ${selectedParticipants.length} participants.` });
      }

      toast({ title: 'Meeting Scheduled', description: 'Your meeting is set!' });
      onScheduled && onScheduled();
      onOpenChange(false);

    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to schedule meeting', variant: 'destructive' });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogDescription>Set a time and invite team members to a video call.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Meeting Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Sync" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                {isPrivate ? <Lock className="h-4 w-4 text-rose-500" /> : <Globe className="h-4 w-4 text-emerald-500" />}
                {isPrivate ? 'Private Meeting' : 'Public Meeting'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPrivate ? 'Only invited participants can join this room.' : 'Anyone with the link can join.'}
              </p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          <div className="space-y-2 pt-2">
            <Label>Invite Participants ({selectedParticipants.length})</Label>
            <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 space-y-1">
              {employees.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No other employees found in your company.</p>
              ) : (
                employees.map((emp) => {
                  const isSelected = selectedParticipants.find((p) => p.id === emp.id);
                  return (
                    <div
                      key={emp.id || emp.email}
                      onClick={() => handleToggleParticipant(emp)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-500'}`}>
                          {emp.type === 'client' ? <Briefcase className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{emp.full_name || emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </div>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={isScheduling}>
            {isScheduling ? <OrbitLoader size="sm" /> : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
