import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlayCircle, Video, CheckSquare, Eye, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VSkillDemonstrations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDemo, setSelectedDemo] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDemo, setNewDemo] = useState({ title: '', skill_name: '', trainee_name: '', check_safety: false, check_tools: false, check_time: false });

  const fetchDemos = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_demonstration', user?.company_id);
      setDemos(records);
      if (records.length > 0 && !selectedDemo) {
        setSelectedDemo(records[0]);
      } else if (selectedDemo) {
        const updated = records.find(r => r.id === selectedDemo.id);
        if (updated) setSelectedDemo(updated);
      }
    } catch (error) {
      console.error('Failed to fetch skill demonstrations:', error);
      toast.error('Failed to load demonstrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchDemos();
    }
  }, [user]);

  const handleCreateDemo = async () => {
    if (!newDemo.title || !newDemo.trainee_name) {
      toast.error('Title and Trainee are required');
      return;
    }
    try {
      const allPassed = newDemo.check_safety && newDemo.check_tools && newDemo.check_time;
      const created = await base44.createEntity('voc_demonstration', {
        title: newDemo.title,
        data: {
          skill_name: newDemo.skill_name,
          trainee_name: newDemo.trainee_name,
          check_safety: newDemo.check_safety,
          check_tools: newDemo.check_tools,
          check_time: newDemo.check_time,
          approved: allPassed,
          video_url: null,
          notes: ''
        }
      }, user?.company_id);
      toast.success('Demonstration recorded');
      setIsDialogOpen(false);
      setNewDemo({ title: '', skill_name: '', trainee_name: '', check_safety: false, check_tools: false, check_time: false });
      fetchDemos();
      setSelectedDemo(created);
    } catch (error) {
      console.error('Failed to record demonstration:', error);
      toast.error('Failed to record demonstration');
    }
  };

  const handleApprove = async () => {
    if (!selectedDemo) return;
    try {
      await base44.updateEntity('voc_demonstration', selectedDemo.id, {
        data: { ...selectedDemo.data, approved: true }
      }, user.company_id);
      toast.success('Demonstration Approved');
      fetchDemos();
    } catch (error) {
      console.error('Failed to approve demo:', error);
      toast.error('Failed to approve demonstration');
    }
  };

  const filteredDemos = demos.filter(d => 
    d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.data?.skill_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.data?.trainee_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('skill_demonstrations', 'Skill Demonstrations')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {t('skill_demos_desc', 'Review live or recorded demonstrations of specific vocational competencies.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-none">
              <Plus className="w-4 h-4 mr-2" /> {t('add_demonstration', 'Record Demonstration')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-none bg-card">
            <DialogHeader>
              <DialogTitle>{t('record_demo', 'Record Skill Demonstration')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('title', 'Demo Title')}</Label>
                <Input id="title" placeholder="e.g. TIG Welding Final" value={newDemo.title} onChange={e => setNewDemo({...newDemo, title: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trainee">{t('trainee', 'Trainee Name')}</Label>
                <Input id="trainee" placeholder="e.g. John Doe" value={newDemo.trainee_name} onChange={e => setNewDemo({...newDemo, trainee_name: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill">{t('skill', 'Skill Name')}</Label>
                <Input id="skill" placeholder="e.g. Overhead Welding" value={newDemo.skill_name} onChange={e => setNewDemo({...newDemo, skill_name: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
              </div>
              
              <div className="space-y-3 mt-2">
                <Label>{t('assessment_criteria', 'Assessment Criteria')}</Label>
                <label className="flex items-center gap-3 p-3 border border-primary/10 rounded-xl hover:bg-primary/5 cursor-pointer transition-colors">
                  <input type="checkbox" checked={newDemo.check_safety} onChange={e => setNewDemo({...newDemo, check_safety: e.target.checked})} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Safety Gear Worn Correctly</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-primary/10 rounded-xl hover:bg-primary/5 cursor-pointer transition-colors">
                  <input type="checkbox" checked={newDemo.check_tools} onChange={e => setNewDemo({...newDemo, check_tools: e.target.checked})} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Proper Tool Usage</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-primary/10 rounded-xl hover:bg-primary/5 cursor-pointer transition-colors">
                  <input type="checkbox" checked={newDemo.check_time} onChange={e => setNewDemo({...newDemo, check_time: e.target.checked})} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Completed within Time Limit</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateDemo} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-none">{t('save', 'Save Demonstration')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-2xl border border-primary/40 bg-card shadow-none">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search demonstrations..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading demonstrations...</div>
            ) : filteredDemos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No demonstrations found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredDemos.map(demo => (
                  <button
                    key={demo.id}
                    onClick={() => setSelectedDemo(demo)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedDemo?.id === demo.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      selectedDemo?.id === demo.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{demo.title}</p>
                      <p className={`text-xs truncate ${selectedDemo?.id === demo.id ? 'text-primary' : 'text-muted-foreground'}`}>
                        {demo.data?.skill_name || 'General Skill'} • {demo.data?.trainee_name || 'Unknown'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-2xl border border-primary/40 bg-card shadow-none overflow-hidden relative">
          {selectedDemo ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10 flex items-center px-8">
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-card border border-primary/40 p-2 shrink-0">
                    <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <Video className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white">{selectedDemo.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground font-medium">
                        <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                          {selectedDemo.data?.skill_name || 'General Skill'}
                        </Badge>
                        <span>•</span>
                        <span>Trainee: {selectedDemo.data?.trainee_name || 'N/A'}</span>
                        <span>•</span>
                        <Badge variant="secondary" className={selectedDemo.data?.approved ? 'bg-primary text-white' : 'bg-amber-500 text-white'}>
                          {selectedDemo.data?.approved ? 'Approved' : 'Needs Review'}
                        </Badge>
                      </div>
                    </div>
                    {!selectedDemo.data?.approved && (
                      <Button onClick={handleApprove} className="rounded-xl shadow-none bg-primary text-white hover:bg-primary/90">
                        Approve Demo
                      </Button>
                    )}
                  </div>

                  <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-card rounded-2xl aspect-video flex flex-col items-center justify-center text-muted-foreground border border-primary/40 shadow-none relative overflow-hidden">
                        {selectedDemo.data?.video_url ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 dark:text-white bg-primary/5">
                            <PlayCircle className="w-16 h-16 text-primary mb-2 cursor-pointer hover:scale-110 transition-transform" />
                            <span className="font-medium">Click to play demonstration video</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                              <Video className="w-8 h-8 text-primary/40" />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">No Video Recording</span>
                            <span className="text-sm">This was evaluated live.</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center px-2">
                        <span className="text-sm text-muted-foreground font-medium">Date: {new Date(selectedDemo.created_date || Date.now()).toLocaleDateString()}</span>
                        <Button size="sm" variant="outline" className="text-primary border-primary/40 shadow-none hover:bg-primary/5 rounded-xl"><Eye className="w-4 h-4 mr-2" /> View Full Details</Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Card className="border border-primary/20 bg-card shadow-none rounded-2xl">
                        <CardHeader className="pb-3 border-b border-primary/10">
                          <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white"><CheckSquare className="w-5 h-5 text-primary" /> Assessment Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Safety Gear Worn</span>
                            <Badge variant={selectedDemo.data?.check_safety ? 'default' : 'secondary'} className={`shadow-none ${selectedDemo.data?.check_safety ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {selectedDemo.data?.check_safety ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Proper Tool Usage</span>
                            <Badge variant={selectedDemo.data?.check_tools ? 'default' : 'secondary'} className={`shadow-none ${selectedDemo.data?.check_tools ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {selectedDemo.data?.check_tools ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Completion Time</span>
                            <Badge variant={selectedDemo.data?.check_time ? 'default' : 'secondary'} className={`shadow-none ${selectedDemo.data?.check_time ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {selectedDemo.data?.check_time ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="p-4 rounded-2xl bg-card border border-primary/20 space-y-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Assessor Notes</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedDemo.data?.notes || "No additional notes provided for this demonstration."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <PlayCircle className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Demonstration Selected</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Select a demonstration from the list to view its recording and checklist.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
