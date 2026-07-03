import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellRing, Check, Clock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TimeRemindersTab({ reminders, isLoading }) {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    remind_at: '',
    time: '',
    priority: 'Medium',
    is_recurring: false,
    recurrence_pattern: 'none'
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const dateTimeStr = `${data.remind_at}T${data.time || '00:00'}:00Z`;
      const id = crypto.randomUUID();
      await powerSync.execute(
        `INSERT INTO univ_time_reminders (id, created_at, company_id, user_id, title, description, remind_at, is_recurring, recurrence_pattern, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, new Date().toISOString(), companyId, user.id, data.title, data.description, dateTimeStr,
          data.is_recurring ? 1 : 0, data.recurrence_pattern, data.priority, 'Pending'
        ]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time_reminders', companyId]);
      toast({ title: "Reminder Created", description: "Your reminder has been set." });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', remind_at: '', time: '', priority: 'Medium', is_recurring: false, recurrence_pattern: 'none' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute('UPDATE univ_time_reminders SET status = ? WHERE id = ?', [status, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time_reminders', companyId]);
      toast({ title: "Updated", description: "Reminder status updated." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_time_reminders WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time_reminders', companyId]);
      toast({ title: "Deleted", description: "Reminder deleted." });
    }
  });

  const handleCreate = () => {
    if (!formData.title || !formData.remind_at) {
      toast({ title: "Required Fields", description: "Title and Date are required.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-12 flex justify-center"><OrbitLoader /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2"><BellRing className="w-5 h-5 text-primary" /> Reminders</h2>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 rounded-xl h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="w-4 h-4" /> New Reminder</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reminders.map(r => {
           const priorityColors = {
              'Urgent': 'text-red-600 bg-red-100',
              'High': 'text-orange-600 bg-orange-100',
              'Medium': 'text-blue-600 bg-blue-100',
              'Low': 'text-green-600 bg-green-100'
           };
           const isCompleted = r.status === 'Completed';
           return (
             <div key={r.id} className={`p-5 rounded-2xl border border-border shadow-sm flex flex-col gap-4 transition-all ${isCompleted ? 'bg-muted/50 opacity-70' : 'bg-card hover:shadow-md'}`}>
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className={`font-semibold text-lg ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{r.title}</h3>
                   <p className="text-sm text-muted-foreground mt-1 max-w-sm">{r.description || 'No description'}</p>
                 </div>
                 <div className="flex gap-2">
                   {!isCompleted && (
                     <Button size="icon" variant="outline" className="h-8 w-8 border-green-200 text-green-600 hover:bg-green-100" onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'Completed'})}>
                       <Check className="w-4 h-4" />
                     </Button>
                   )}
                   <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => deleteMutation.mutate(r.id)}>
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
               </div>
               <div className="flex items-center gap-3 text-xs mt-auto">
                  <span className="flex items-center gap-1 font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border"><Clock className="w-3.5 h-3.5" /> {new Date(r.remind_at).toLocaleString()}</span>
                  <span className={`px-2 py-1 rounded-md font-semibold ${priorityColors[r.priority] || priorityColors['Medium']}`}>{r.priority}</span>
                  {r.is_recurring === 1 && <span className="px-2 py-1 rounded-md font-semibold text-purple-600 bg-purple-100">Recurring: {r.recurrence_pattern}</span>}
               </div>
             </div>
           );
        })}
        {reminders.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border rounded-2xl shadow-sm">
             <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground opacity-50" />
             </div>
             <h3 className="text-lg font-medium text-foreground">No Reminders</h3>
             <p className="text-muted-foreground text-sm mt-1 max-w-xs">Stay on top of your tasks by adding reminders. You will be alerted when they are due.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-border shadow-xl bg-card">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
            <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
              <AlertCircle className="w-5 h-5 text-primary" />
              New Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reminder Title</Label>
              <Input 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Submit timesheet"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description (Optional)</Label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Additional details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
                 <Input type="date" value={formData.remind_at} onChange={e => setFormData({...formData, remind_at: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Time</Label>
                 <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Priority</Label>
                 <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                    <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="Low">Low</SelectItem>
                       <SelectItem value="Medium">Medium</SelectItem>
                       <SelectItem value="High">High</SelectItem>
                       <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2 flex flex-col justify-end pb-2">
                 <div className="flex items-center gap-2">
                    <Switch checked={formData.is_recurring} onCheckedChange={c => setFormData({...formData, is_recurring: c})} />
                    <Label className="text-sm">Recurring</Label>
                 </div>
              </div>
            </div>
            {formData.is_recurring && (
               <div className="space-y-2">
                 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Recurrence Pattern</Label>
                 <Select value={formData.recurrence_pattern} onValueChange={v => setFormData({...formData, recurrence_pattern: v})}>
                    <SelectTrigger><SelectValue placeholder="Pattern" /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="daily">Daily</SelectItem>
                       <SelectItem value="weekly">Weekly</SelectItem>
                       <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saveMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">Save Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
