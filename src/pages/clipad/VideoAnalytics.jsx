import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, BarChart2, Eye, MousePointerClick, Clock, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function VideoAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 1250,
    avgCompletion: 78,
    ctr: 12.4,
    topVideos: []
  });

  useEffect(() => {
    // Mock analytics fetching
    setTimeout(() => {
      setStats({
        totalViews: 1250,
        avgCompletion: 78,
        ctr: 12.4,
        topVideos: [
          { id: 1, title: 'Q3 Feature Walkthrough', views: 450, completion: 82 },
          { id: 2, title: 'Sales Pitch - Enterprise', views: 320, completion: 91 },
          { id: 3, title: 'Engineering All Hands', views: 280, completion: 65 }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl mt-8" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales & Video Analytics</h1>
        <p className="text-muted-foreground mt-1">Track engagement and conversion on your async videos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Eye className="w-4 h-4" /> Total Views (30d)</CardDescription>
            <CardTitle className="text-4xl">{stats.totalViews.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 flex items-center font-medium">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +14% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Clock className="w-4 h-4" /> Avg. Completion Rate</CardDescription>
            <CardTitle className="text-4xl">{stats.avgCompletion}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 flex items-center font-medium">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><MousePointerClick className="w-4 h-4" /> CTA Click-Through</CardDescription>
            <CardTitle className="text-4xl">{stats.ctr}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-rose-600 flex items-center font-medium">
              -0.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top Performing Videos</CardTitle>
            <CardDescription>Based on total views and completion rate.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topVideos.map((video, i) => (
                <div key={video.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{i + 1}</div>
                    <div>
                      <div className="font-semibold text-sm">{video.title}</div>
                      <div className="text-xs text-muted-foreground">{video.views} views</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{video.completion}%</div>
                    <div className="text-[10px] text-muted-foreground">Completion</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Audience Engagement Map</CardTitle>
            <CardDescription className="text-slate-400">Where viewers are dropping off in your latest sales pitch.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-48 relative">
            {/* Mock Chart Area */}
            <div className="absolute inset-x-6 bottom-6 top-6 flex items-end justify-between gap-1">
              {[80, 85, 90, 88, 75, 60, 50, 45, 42, 40].map((h, i) => (
                <div key={i} className="w-full bg-blue-500/80 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow-xl border border-white/10">Significant drop-off at 2:14 (Pricing Slide)</span>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
