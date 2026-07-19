import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Lock, Unlock, Clock, Save, ArrowRight, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { writeOrgEvent } from '@/lib/clipadIntelligence';

export default function SaveMeetingPage() {
  const { id } = useParams(); // meeting ID
  const [searchParams] = useSearchParams();
  const spaceId = searchParams.get('spaceId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meeting, setMeeting] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('internal');
  const [isLocked, setIsLocked] = useState(false);
  const [lockType, setLockType] = useState('none'); // 'none', 'manual', 'scheduled'
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockTime, setUnlockTime] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('clipad_meeting_records')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setMeeting(data);
        setTitle(data.title || data.meeting_title || `Meeting - ${new Date().toLocaleDateString()}`);
        setVisibility(data.visibility || 'internal');
        setIsLocked(data.is_locked || false);
        if (data.is_locked) {
            setLockType('manual');
        }
        if (data.unlock_at) {
            setLockType('scheduled');
            const d = new Date(data.unlock_at);
            setUnlockDate(d.toISOString().split('T')[0]);
            setUnlockTime(d.toTimeString().slice(0, 5));
        }

      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Could not load meeting data.', variant: 'destructive' });
        navigate('/clipad');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a meeting title.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    let finalUnlockAt = null;
    let finalIsLocked = false;

    if (lockType === 'manual') {
      finalIsLocked = true;
    } else if (lockType === 'scheduled') {
      if (!unlockDate || !unlockTime) {
        toast({ title: 'Date/Time required', description: 'Please set the unlock schedule.', variant: 'destructive' });
        setSaving(false);
        return;
      }
      finalIsLocked = true;
      finalUnlockAt = new Date(`${unlockDate}T${unlockTime}`).toISOString();
    }

    try {
      const { error } = await supabase
        .from('clipad_meeting_records')
        .update({
          title: title.trim(),
          visibility: visibility,
          is_locked: finalIsLocked,
          unlock_at: finalUnlockAt,
          ended_at: new Date().toISOString() // Ensure ended_at is set if not already
        })
        .eq('id', id);

      if (error) throw error;

      // Write to Org Timeline
      await writeOrgEvent({
        space_id: spaceId,
        workspace_id: user?.company_id,
        event_type: 'meeting_saved',
        title: `Meeting saved: ${title.trim()}`,
        description: meeting?.ai_summary?.substring(0, 200) || null,
        actor_id: user?.id,
        source_id: id,
        source_table: 'clipad_meeting_records',
        importance: 4,
      });

      toast({ title: 'Meeting Saved', description: 'Your meeting record has been updated.' });
      navigate(`/clipad/meeting/${id}`);
    } catch (err) {
      console.error(err);
      toast({ title: 'Save Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-background p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Save Meeting Record</h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-2">
            Your meeting has ended. Review the details and set access controls before publishing.
          </p>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-200 dark:border-border p-8 space-y-8">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-foreground mb-2">Meeting Title</label>
            <Input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q3 Roadmap Planning"
              className="text-lg py-6"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-foreground mb-2">Visibility</label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-900 dark:text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all cursor-pointer shadow-sm"
            >
              <option value="internal">Internal (Company & Space Members Only)</option>
              <option value="external">External (Anyone with link)</option>
            </select>
          </div>

          {/* Lock Settings */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-foreground uppercase tracking-wider shrink-0">Access Control</label>
              <div className="relative inline-block min-w-[220px]">
                <select
                  value={lockType}
                  onChange={e => setLockType(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-900 dark:text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all cursor-pointer font-semibold shadow-sm"
                >
                  <option value="none">Public (Space Members)</option>
                  <option value="manual">Locked (Only Me)</option>
                  <option value="scheduled">Scheduled Release</option>
                </select>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {lockType === 'none' && <Unlock className="w-4 h-4 text-emerald-500" />}
                  {lockType === 'manual' && <Lock className="w-4 h-4 text-indigo-500" />}
                  {lockType === 'scheduled' && <Clock className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          
          {lockType === 'scheduled' && (
              <div className="mt-4 p-5 bg-amber-50 dark:bg-amber-950/10 rounded-xl border border-amber-100 dark:border-amber-900/30 flex gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1.5">Unlock Date</label>
                  <Input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)} className="bg-white dark:bg-card" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1.5">Unlock Time</label>
                  <Input type="time" value={unlockTime} onChange={e => setUnlockTime(e.target.value)} className="bg-white dark:bg-card" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-border flex justify-between items-center">
             <div className="text-sm text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" /> AI is processing the transcript in the background
             </div>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-white rounded-full px-8">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Publish Meeting
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
