import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlayCircle, Video, CheckSquare, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VSkillDemonstrations() {
  const { user } = useAuth();
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDemo, setSelectedDemo] = useState(null);

  const fetchDemos = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_demonstration', user?.company_id);
      setDemos(records);
      if (records.length > 0 && !selectedDemo) {
        setSelectedDemo(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch skill demonstrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchDemos();
    }
  }, [user]);

  const filteredDemos = demos.filter(d => 
    d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.data?.skill_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-violet-600 via-purple-600 to-slate-900 bg-clip-text text-transparent">
            Skill Demonstrations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Review live or recorded demonstrations of specific vocational competencies.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-violet-100/50">
          <div className="p-4 border-b border-violet-50 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" />
              <Input 
                placeholder="Search demonstrations..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900 border-violet-100 dark:border-slate-700 rounded-xl focus-visible:ring-violet-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-violet-500/50 text-sm">Loading demonstrations...</div>
            ) : filteredDemos.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No demonstrations found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredDemos.map(demo => (
                  <button
                    key={demo.id}
                    onClick={() => setSelectedDemo(demo)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedDemo?.id === demo.id 
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                        : 'hover:bg-violet-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedDemo?.id === demo.id ? 'bg-white/20' : 'bg-violet-100 dark:bg-slate-800 text-violet-600'
                    }`}>
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{demo.title}</p>
                      <p className={`text-xs truncate ${selectedDemo?.id === demo.id ? 'text-violet-100' : 'text-slate-500'}`}>
                        {demo.data?.skill_name || 'General Skill'} • {demo.data?.trainee_name || 'Unknown'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-violet-100/50 overflow-hidden relative">
          {selectedDemo ? (
            <>
              <div className="h-32 bg-gradient-to-r from-violet-500 to-purple-600 relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-violet-50 dark:bg-slate-800 flex items-center justify-center text-violet-600">
                        <Video className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedDemo.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Badge variant="outline" className="border-violet-200 dark:border-slate-600 bg-violet-50 dark:bg-slate-800 text-violet-600">{selectedDemo.data?.skill_name}</Badge></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">Trainee: {selectedDemo.data?.trainee_name || 'N/A'}</span>
                        <span>•</span>
                        <Badge className={selectedDemo.data?.approved ? 'bg-emerald-500' : 'bg-amber-500'}>
                          {selectedDemo.data?.approved ? 'Approved' : 'Needs Review'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-slate-900 rounded-2xl aspect-video flex items-center justify-center text-slate-500 border-4 border-slate-800 relative overflow-hidden">
                        {selectedDemo.data?.video_url ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800/80">
                             <PlayCircle className="w-16 h-16 text-violet-400 mb-2" />
                             <span>Click to play demonstration video</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Video className="w-12 h-12 text-slate-700" />
                            <span>No video recording attached</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center px-2">
                        <span className="text-sm text-slate-500">Date: {new Date(selectedDemo.created_date).toLocaleDateString()}</span>
                        <Button size="sm" variant="outline" className="text-violet-600 border-violet-200"><Eye className="w-4 h-4 mr-2" /> View Full Details</Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Card className="border-violet-100 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2"><CheckSquare className="w-5 h-5 text-violet-500" /> Assessment Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-sm font-medium">Safety Gear Worn</span>
                            <Badge variant={selectedDemo.data?.check_safety ? 'default' : 'secondary'} className={selectedDemo.data?.check_safety ? 'bg-emerald-500' : ''}>
                              {selectedDemo.data?.check_safety ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-sm font-medium">Proper Tool Usage</span>
                            <Badge variant={selectedDemo.data?.check_tools ? 'default' : 'secondary'} className={selectedDemo.data?.check_tools ? 'bg-emerald-500' : ''}>
                              {selectedDemo.data?.check_tools ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-sm font-medium">Completion Time</span>
                            <Badge variant={selectedDemo.data?.check_time ? 'default' : 'secondary'} className={selectedDemo.data?.check_time ? 'bg-emerald-500' : ''}>
                              {selectedDemo.data?.check_time ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="bg-violet-50 dark:bg-slate-800 p-4 rounded-xl border border-violet-100 dark:border-slate-700">
                        <h4 className="text-sm font-bold text-violet-700 dark:text-violet-400 mb-2">Evaluator Remarks</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {selectedDemo.data?.remarks || 'No remarks provided for this demonstration.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <PlayCircle className="w-10 h-10 text-violet-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Demonstration Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select a demonstration from the list to review the video, checklist, and evaluator remarks.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
