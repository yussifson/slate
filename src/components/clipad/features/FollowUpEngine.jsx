import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Target, MessageCircle, AlertCircle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function FollowUpEngine({ spaceId, workspaceId }) {
  const { user } = useAuth();
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function analyzeFollowUps() {
      setLoading(true);
      try {
        let query = supabase
          .from('clipad_action_items')
          .select('*, assignee:assigned_to(full_name, email)')
          .eq('is_complete', false);

        if (spaceId) query = query.eq('space_id', spaceId);
        else if (workspaceId) query = query.eq('workspace_id', workspaceId);

        const { data: items } = await query;
        if (!items) return;

        const generatedNudges = [];
        const now = new Date();

        items.forEach(item => {
          if (!item.due_date) return;
          const dueDate = new Date(item.due_date);
          const diffDays = Math.round((now - dueDate) / (1000 * 60 * 60 * 24));

          if (diffDays > 0) {
            // Overdue
            generatedNudges.push({
              id: `overdue_${item.id}`,
              type: 'overdue',
              title: `Overdue Task: ${item.title}`,
              description: `${item.assignee?.full_name || 'Someone'} is ${diffDays} day(s) late on this commitment.`,
              draftMessage: `Hi ${item.assignee?.full_name?.split(' ')[0] || 'there'}, just checking in on "${item.title}". Do you need any blockers cleared to get this over the line?`,
              item
            });
          } else if (diffDays === 0) {
            // Due today
            generatedNudges.push({
              id: `today_${item.id}`,
              type: 'today',
              title: `Due Today: ${item.title}`,
              description: `This is scheduled for completion today by ${item.assignee?.full_name || 'someone'}.`,
              draftMessage: `Hey ${item.assignee?.full_name?.split(' ')[0] || ''}, gentle reminder that "${item.title}" is due today. Let me know if you need help!`,
              item
            });
          }
        });

        // Sort nudges: overdue first, then today
        setNudges(generatedNudges.sort((a, b) => {
          if (a.type === 'overdue' && b.type !== 'overdue') return -1;
          if (b.type === 'overdue' && a.type !== 'overdue') return 1;
          return 0;
        }));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    analyzeFollowUps();
  }, [spaceId, workspaceId]);

  if (loading) return (
    <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  );

  if (nudges.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Target className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">Follow-Up Engine</h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 rounded-full">
          {nudges.length} Nudges
        </span>
      </div>
      
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {nudges.map((nudge) => (
          <div key={nudge.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {nudge.type === 'overdue' ? (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{nudge.title}</h4>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mb-3">{nudge.description}</p>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 relative">
              <div className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> AI Draft
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic mt-1">"{nudge.draftMessage}"</p>
            </div>
            
            <div className="mt-3 flex justify-end">
              <button className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                Send Nudge <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
