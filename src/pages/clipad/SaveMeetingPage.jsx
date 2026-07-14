import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Lock, Unlock, Clock, Save, ArrowRight, Loader2, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Save Meeting Record</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Your meeting has ended. Review the details and set access controls before publishing.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-8">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meeting Title</label>
            <Input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q3 Roadmap Planning"
              className="text-lg py-6"
            />
          </div>

          {/* Lock Settings */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Access Control</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <button
                onClick={() => setLockType('none')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  lockType === 'none' 
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Unlock className={`w-6 h-6 mb-3 ${lockType === 'none' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Public</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Available immediately to all space members.</p>
              </button>

              <button
                onClick={() => setLockType('manual')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  lockType === 'manual' 
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-500' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Lock className={`w-6 h-6 mb-3 ${lockType === 'manual' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Locked</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Only you can view until manually unlocked.</p>
              </button>

              <button
                onClick={() => setLockType('scheduled')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  lockType === 'scheduled' 
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Clock className={`w-6 h-6 mb-3 ${lockType === 'scheduled' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Scheduled</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Unlocks automatically at a specific time.</p>
              </button>
            </div>

            {lockType === 'scheduled' && (
              <div className="mt-4 p-5 bg-amber-50 dark:bg-amber-950/10 rounded-xl border border-amber-100 dark:border-amber-900/30 flex gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1.5">Unlock Date</label>
                  <Input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)} className="bg-white dark:bg-slate-900" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1.5">Unlock Time</label>
                  <Input type="time" value={unlockTime} onChange={e => setUnlockTime(e.target.value)} className="bg-white dark:bg-slate-900" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
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
