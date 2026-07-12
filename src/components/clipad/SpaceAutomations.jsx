import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Settings, Zap, Plus, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

export default function SpaceAutomations({ spaceId }) {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [newTrigger, setNewTrigger] = useState('meeting_ended');
  const [newAction, setNewAction] = useState('create_task');

  useEffect(() => {
    fetchAutomations();
  }, [spaceId]);

  const fetchAutomations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clipad_automations')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false });
      
      // If table doesn't exist, this will error. We handle it gracefully.
      if (error) {
        if (error.code === '42P01') {
          console.warn("Automations table not found. Please push migrations.");
          setAutomations([]);
        } else {
          throw error;
        }
      } else {
        setAutomations(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('clipad_automations')
        .insert({
          space_id: spaceId,
          trigger_type: newTrigger,
          action_type: newAction,
          config: {}
        })
        .select()
        .single();
        
      if (error) throw error;
      setAutomations([data, ...automations]);
      toast({ title: 'Automation created successfully' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to create automation', description: err.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('clipad_automations').delete().eq('id', id);
      if (error) throw error;
      setAutomations(automations.filter(a => a.id !== id));
      toast({ title: 'Automation deleted' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="w-6 h-6 text-amber-500" /> Smart Automations</h2>
          <p className="text-muted-foreground mt-1 text-sm">Create workflows to automatically handle tasks when events occur in this space.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Create New Workflow</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold mb-1 block">When this happens (Trigger)</label>
            <select 
              value={newTrigger}
              onChange={e => setNewTrigger(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="meeting_ended">A meeting ends</option>
              <option value="video_recorded">A new video is recorded</option>
              <option value="task_completed">A task is marked done</option>
            </select>
          </div>
          <ArrowRight className="hidden md:block w-5 h-5 text-muted-foreground mt-5" />
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold mb-1 block">Do this (Action)</label>
            <select 
              value={newAction}
              onChange={e => setNewAction(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="create_task">Auto-generate Action Items</option>
              <option value="send_message">Send summary to Chat</option>
              <option value="notify_members">Notify Space Members</option>
            </select>
          </div>
          <div className="pt-5">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-8">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Active Workflows</h3>
        {automations.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground">
            <Settings className="w-8 h-8 opacity-20 mx-auto mb-2" />
            <p>No automations configured yet.</p>
          </div>
        ) : (
          automations.map(auto => (
            <div key={auto.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    When <span className="bg-secondary px-2 py-0.5 rounded text-sm">{auto.trigger_type.replace('_', ' ')}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    ↳ Then <span className="font-medium text-foreground">{auto.action_type.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(auto.id)}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
