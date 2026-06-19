import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Activity, BookOpen, Clock, FileCheck, Target, Zap, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

export default function VTrainingProgress() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [progressRecords, setProgressRecords] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Update dialog
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({ hours_completed: '', practical_score: '', tasks_finished: '', notes: '', status: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [records, tData] = await Promise.all([
        base44.getEntities('voc_progress', user?.company_id),
        base44.getEntities('voc_trainee', user?.company_id)
      ]);
      setProgressRecords(records);
      setTrainees(tData);
      
      if (records.length > 0 && !selectedRecord) {
        setSelectedRecord(records[0]);
      } else if (selectedRecord) {
        const updated = records.find(r => r.id === selectedRecord.id);
        if (updated) setSelectedRecord(updated);
      }
    } catch (error) {
      console.error('Failed to fetch training progress:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) fetchData();
  }, [user]);

  const openUpdate = () => {
    setUpdateForm({
      hours_completed: selectedRecord.data?.hours_completed || '',
      practical_score: selectedRecord.data?.practical_score || '',
      tasks_finished: selectedRecord.data?.tasks_finished || '',
      notes: selectedRecord.data?.notes || '',
      status: selectedRecord.data?.status || 'In Progress'
    });
    setIsUpdateOpen(true);
  };

  const handleUpdateProgress = async () => {
    if (!selectedRecord) return;
    try {
      await base44.updateEntity('voc_progress', selectedRecord.id, {
        data: {
          ...selectedRecord.data,
          hours_completed: parseInt(updateForm.hours_completed) || 0,
          practical_score: parseInt(updateForm.practical_score) || 0,
          tasks_finished: parseInt(updateForm.tasks_finished) || 0,
          notes: updateForm.notes,
          status: updateForm.status
        }
      }, user.company_id);
      
      // Optionally update the associated trainee's progress field
      const assocTrainee = trainees.find(t => t.title === selectedRecord.data?.trainee_name);
      if (assocTrainee) {
        await base44.updateEntity('voc_trainee', assocTrainee.id, {
          data: {
            ...assocTrainee.data,
            progress: parseInt(updateForm.practical_score) || assocTrainee.data.progress
          }
        }, user.company_id);
      }
      
      toast.success('Progress updated');
      setIsUpdateOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const filteredRecords = progressRecords.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.data?.trainee_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('training_progress', 'Training Progress')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('training_progress_desc', 'Track module completion, practical hours, and overall training progression.')}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
              <Input 
                placeholder="Search progress records..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading progress...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No records found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredRecords.map(record => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedRecord?.id === record.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold shrink-0 ${
                      selectedRecord?.id === record.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate">{record.title}</p>
                      <p className={`text-xs truncate ${selectedRecord?.id === record.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {record.data?.trainee_name || 'Unknown Trainee'} • {record.data?.status || 'In Progress'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {selectedRecord ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10 flex items-center px-8">
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <Target className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedRecord.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
                        <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                          {selectedRecord.data?.trainee_name}
                        </Badge>
                        <span>•</span>
                        <span className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-primary" /> Module: {selectedRecord.data?.current_slate || 'N/A'}</span>
                        <span>•</span>
                        <Badge variant="secondary" className={`${selectedRecord.data?.status === 'Completed' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-100'}`}>
                          {selectedRecord.data?.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Hours Completed</CardDescription>
                        <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center gap-2 tracking-[-0.02em]">
                          <Clock className="w-5 h-5 text-primary" />
                          {selectedRecord.data?.hours_completed || 0} <span className="text-sm text-[#71717a] dark:text-gray-400 font-normal">/ {selectedRecord.data?.total_hours || 0}</span>
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Practical Score</CardDescription>
                        <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center gap-2 tracking-[-0.02em]">
                          <Zap className="w-5 h-5 text-primary" />
                          {selectedRecord.data?.practical_score || 0}<span className="text-sm text-[#71717a] dark:text-gray-400 font-normal">%</span>
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Tasks Finished</CardDescription>
                        <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center gap-2 tracking-[-0.02em]">
                          <FileCheck className="w-5 h-5 text-primary" />
                          {selectedRecord.data?.tasks_finished || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <div className="p-5 rounded-2xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider tracking-[0.04em]">Instructor Notes</h3>
                    <p className="text-[#71717a] dark:text-gray-400 text-sm whitespace-pre-wrap bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      {selectedRecord.data?.notes || 'No instructor notes available for this progress record.'}
                    </p>
                    <div className="pt-4 flex justify-end">
                      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={openUpdate} variant="outline" className="text-primary border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:bg-primary/5 rounded-xl">
                            Update Progress
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                          <DialogHeader>
                            <DialogTitle>Update Progress</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select value={updateForm.status} onValueChange={v => setUpdateForm({...updateForm, status: v})}>
                                <SelectTrigger className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="Needs Review">Needs Review</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Hours Completed</Label>
                                <Input type="number" value={updateForm.hours_completed} onChange={e => setUpdateForm({...updateForm, hours_completed: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                              </div>
                              <div className="space-y-2">
                                <Label>Practical Score</Label>
                                <Input type="number" value={updateForm.practical_score} onChange={e => setUpdateForm({...updateForm, practical_score: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Tasks Finished</Label>
                              <Input type="number" value={updateForm.tasks_finished} onChange={e => setUpdateForm({...updateForm, tasks_finished: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                            </div>
                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <textarea 
                                className="w-full h-24 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card resize-none text-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" 
                                value={updateForm.notes} onChange={e => setUpdateForm({...updateForm, notes: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleUpdateProgress} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Record Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select a progress record from the list to view details or update it.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
