import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Clock, CheckCircle, HelpCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MeetingInsights({ spaceId }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    actionItemsGenerated: 0,
    actionItemsCompleted: 0,
    avgDurationMin: 0,
  });

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      try {
        let query = supabase.from('clipad_meeting_records').select('*');
        if (spaceId) {
          query = query.eq('space_id', spaceId);
        }
        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          let aiCount = 0;
          data.forEach(m => {
            if (Array.isArray(m.action_items)) aiCount += m.action_items.length;
          });

          setStats({
            totalMeetings: data.length,
            actionItemsGenerated: aiCount,
            actionItemsCompleted: Math.floor(aiCount * 0.4), // Mock completed 40%
            avgDurationMin: 45, // Mock duration
          });
        }
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
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-primary" /> AI Insight
          </h4>
          <p className="text-sm text-muted-foreground">
            Your team's meetings generate an average of <strong>{stats.totalMeetings > 0 ? (stats.actionItemsGenerated / stats.totalMeetings).toFixed(1) : 0} action items</strong> per meeting. However, the completion rate is currently tracking at <strong>40%</strong>. Consider reducing meeting sizes to improve accountability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
