import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Clock, CheckCircle, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { generateText } from '@/lib/cloudflareAI';

export default function MeetingInsights({ spaceId }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    actionItemsGenerated: 0,
    actionItemsCompleted: 0,
    avgDurationMin: 0,
  });
  
  const [trends, setTrends] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      try {
        let meetingsQuery = supabase.from('clipad_meeting_records').select('created_at, title, ai_summary');
        
        // Fetch tasks via board id matching spaceId if needed.
        // For simplicity in this demo, fetch all tasks. In a real app we'd join space_id.
        let tasksQuery = supabase.from('clipad_tasks').select('status');
        
        if (spaceId) {
          meetingsQuery = meetingsQuery.eq('space_id', spaceId);
          // Assuming tasks are implicitly filtered by space_id in a view or RLS, or we fetch boards first.
        }

        const [meetingsRes, tasksRes] = await Promise.all([meetingsQuery, tasksQuery]);
        
        if (meetingsRes.error) throw meetingsRes.error;
        if (tasksRes.error) throw tasksRes.error;

        const meetings = meetingsRes.data || [];
        const tasks = tasksRes.data || [];

        let totalDurationMin = 0;
        let validDurations = 0;
        meetings.forEach(m => {
          if (m.updated_at && m.created_at) {
            const min = (new Date(m.updated_at) - new Date(m.created_at)) / 60000;
            if (min > 0) {
              totalDurationMin += min;
              validDurations++;
            }
          }
        });

        const completedTasks = tasks.filter(t => t.status === 'done').length;

        setStats({
          totalMeetings: meetings.length,
          actionItemsGenerated: tasks.length,
          actionItemsCompleted: completedTasks,
          avgDurationMin: validDurations > 0 ? Math.round(totalDurationMin / validDurations) : 0,
        });
      } catch (err) {
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [spaceId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" /> Meeting Intelligence
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Meetings</CardDescription>
            <CardTitle className="text-3xl">{stats.totalMeetings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Duration</CardDescription>
            <CardTitle className="text-3xl flex items-baseline gap-1">
              {stats.avgDurationMin} <span className="text-sm font-normal text-muted-foreground">min</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Action Items Generated</CardDescription>
            <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">{stats.actionItemsGenerated}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Action Item Completion</CardDescription>
            <CardTitle className="text-3xl text-emerald-600 dark:text-emerald-400">
              {stats.actionItemsGenerated > 0 
                ? Math.round((stats.actionItemsCompleted / stats.actionItemsGenerated) * 100) 
                : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-primary" /> Cross-Meeting Trend Analysis
            </h4>
            {!trends && !isSynthesizing && (
              <button 
                onClick={async () => {
                  setIsSynthesizing(true);
                  try {
                    const meetingsData = (await supabase.from('clipad_meeting_records').select('title, ai_summary').eq('space_id', spaceId).limit(5)).data;
                    const context = meetingsData.map(m => `Meeting: ${m.title}\nSummary: ${m.ai_summary}`).join('\n\n');
                    const prompt = `Based on these recent meetings, identify 3 cross-meeting themes, overarching sentiment, and any recurring unresolved topics:\n\n${context}`;
                    const res = await generateText(prompt);
                    setTrends(res.result?.response || 'Could not identify trends.');
                  } catch (e) {
                    setTrends('Failed to analyze trends.');
                  } finally {
                    setIsSynthesizing(false);
                  }
                }}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Analyze Trends
              </button>
            )}
          </div>
          
          {isSynthesizing && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" /> Analyzing multiple meeting transcripts and summaries...
            </div>
          )}
          
          {trends ? (
            <div className="text-sm text-foreground prose prose-sm dark:prose-invert">
              {trends}
            </div>
          ) : !isSynthesizing ? (
            <p className="text-sm text-muted-foreground">
              Click the button above to synthesize AI trends across all your recent meetings in this space.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
