import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Activity, BookOpen, Clock, FileCheck, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VTrainingProgress() {
  const { user } = useAuth();
  const [progressRecords, setProgressRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_progress', user?.company_id);
      setProgressRecords(records);
      if (records.length > 0 && !selectedRecord) {
        setSelectedRecord(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch training progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchProgress();
    }
  }, [user]);

  const filteredRecords = progressRecords.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.data?.trainee_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary via-primary to-slate-900 bg-clip-text text-transparent">
            Training Progress
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Track module completion, practical hours, and overall training progression.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
          <div className="p-4 border-b border-primary/5 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <Input 
                placeholder="Search progress records..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900 border-primary/10 dark:border-slate-700 rounded-xl focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-primary/50 text-sm">Loading progress...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No records found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredRecords.map(record => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedRecord?.id === record.id 
                        ? 'bg-primary text-white shadow-md shadow-emerald-500/20' 
                        : 'hover:bg-primary/5 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedRecord?.id === record.id ? 'bg-white/20' : 'bg-primary/10 dark:bg-slate-800 text-primary'
                    }`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{record.title}</p>
                      <p className={`text-xs truncate ${selectedRecord?.id === record.id ? 'text-primary/10' : 'text-slate-500'}`}>
                        {record.data?.trainee_name || 'Unknown Trainee'} • {record.data?.status || 'In Progress'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
          {selectedRecord ? (
            <>
              <div className="h-32 bg-gradient-to-r from-primary to-primary relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/connected.png')] opacity-20"></div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-primary/5 dark:bg-slate-800 flex items-center justify-center text-primary">
                        <Target className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedRecord.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Badge variant="outline" className="border-primary/20 dark:border-slate-600 bg-primary/5 dark:bg-slate-800 text-primary">{selectedRecord.data?.trainee_name}</Badge></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> Module: {selectedRecord.data?.current_module || 'N/A'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Badge className={selectedRecord.data?.status === 'Completed' ? 'bg-primary' : 'bg-primary'}>
                            {selectedRecord.data?.status || 'Active'}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-primary/50 dark:bg-slate-800/50 border-primary/10 dark:border-slate-700">
                        <CardHeader className="pb-2">
                          <CardDescription>Hours Completed</CardDescription>
                          <CardTitle className="text-2xl text-primary/90 dark:text-primary/70 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {selectedRecord.data?.hours_completed || 0} / {selectedRecord.data?.total_hours || 0}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="bg-primary/50 dark:bg-slate-800/50 border-primary/10 dark:border-slate-700">
                        <CardHeader className="pb-2">
                          <CardDescription>Practical Score</CardDescription>
                          <CardTitle className="text-2xl text-primary/90 dark:text-primary/70 flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            {selectedRecord.data?.practical_score || 'N/A'}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="bg-primary/50 dark:bg-slate-800/50 border-primary/10 dark:border-slate-700">
                        <CardHeader className="pb-2">
                          <CardDescription>Tasks Finished</CardDescription>
                          <CardTitle className="text-2xl text-primary/90 dark:text-primary/70 flex items-center gap-2">
                            <FileCheck className="w-5 h-5" />
                            {selectedRecord.data?.tasks_finished || 0}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Instructor Notes</h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">
                        {selectedRecord.data?.notes || 'No instructor notes available for this progress record.'}
                      </p>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/5">
                          Update Progress
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/5 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Activity className="w-10 h-10 text-primary/30" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Record Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select a progress record from the left to view details and update module progression.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
