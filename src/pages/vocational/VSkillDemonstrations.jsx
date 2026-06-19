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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('skill_demonstrations', 'Skill Demonstrations')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('skill_demos_desc', 'Review live or recorded demonstrations of specific vocational competencies.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('add_demonstration', 'Record Demonstration')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-md-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('record_demo', 'Record Skill Demonstration')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('title', 'Demo Title')}</Label>
                <Input id="title" placeholder="e.g. TIG Welding Final" value={newDemo.title} onChange={e => setNewDemo({...newDemo, title: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trainee">{t('trainee', 'Trainee Name')}</Label>
                <Input id="trainee" placeholder="e.g. John Doe" value={newDemo.trainee_name} onChange={e => setNewDemo({...newDemo, trainee_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill">{t('skill', 'Skill Name')}</Label>
                <Input id="skill" placeholder="e.g. Overhead Welding" value={newDemo.skill_name} onChange={e => setNewDemo({...newDemo, skill_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              
              <div className="space-y-3 mt-2">
                <Label>{t('assessment_criteria', 'Assessment Criteria')}</Label>
                <label className="flex items-center gap-3 p-3 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-md-xl hover:bg-primary/5 cursor-pointer transition-colors">
                  <input type="checkbox" checked={newDemo.check_safety} onChange={e => setNewDemo({...newDemo, check_safety: e.target.checked})} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Safety Gear Worn Correctly</span>
                </label>
                <label className="flex items-center gap-3 p-3 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-md-xl hover:bg-primary/5 cursor-pointer transition-colors">
                  <input type="checkbox" checked={newDemo.check_tools} onChange={e => setNewDemo({...newDemo, check_tools: e.target.checked})} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Proper Tool Usage</span>
                </label>
                <label className="flex items-center gap-3 p-3 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-md-xl hover:bg-primary/5 cursor-pointer transition-colors">
                  <input type="checkbox" checked={newDemo.check_time} onChange={e => setNewDemo({...newDemo, check_time: e.target.checked})} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Completed within Time Limit</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateDemo} className="bg-primary text-white hover:bg-primary/90 rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Save Demonstration')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
              <Input 
                placeholder="Search demonstrations..." 
                className="pl-9 h-10 border-primary/40 rounded-md-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading demonstrations...</div>
            ) : filteredDemos.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No demonstrations found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredDemos.map(demo => (
                  <button
                    key={demo.id}
                    onClick={() => setSelectedDemo(demo)}
                    className={`w-full text-left p-3 rounded-md-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedDemo?.id === demo.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-md-xl flex items-center justify-center font-semibold shrink-0 ${
                      selectedDemo?.id === demo.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate">{demo.title}</p>
                      <p className={`text-xs truncate ${selectedDemo?.id === demo.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
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
        <Card className="flex-1 flex flex-col rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {selectedDemo ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10 flex items-center px-8">
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-md-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="w-full h-full rounded-md-xl bg-primary/5 flex items-center justify-center text-primary">
                      <Video className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedDemo.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
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
                      <Button onClick={handleApprove} className="rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-primary text-white hover:bg-primary/90">
                        Approve Demo
                      </Button>
                    )}
                  </div>

                  <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-card rounded-md-2xl aspect-video flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none relative overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        {selectedDemo.data?.video_url ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 dark:text-white bg-primary/5">
                            <PlayCircle className="w-16 h-16 text-primary mb-2 cursor-pointer hover:scale-110 transition-transform" />
                            <span className="font-medium">Click to play demonstration video</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-6 text-center">
                            <div className="w-16 h-16 rounded-md-full bg-primary/10 flex items-center justify-center mb-2">
                              <Video className="w-8 h-8 text-primary/40" />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">No Video Recording</span>
                            <span className="text-sm">This was evaluated live.</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center px-2">
                        <span className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Date: {new Date(selectedDemo.created_date || Date.now()).toLocaleDateString()}</span>
                        <Button size="sm" variant="outline" className="text-primary border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:bg-primary/5 rounded-md-xl"><Eye className="w-4 h-4 mr-2" /> View Full Details</Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        <CardHeader className="pb-3 border-b border-primary/10">
                          <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white"><CheckSquare className="w-5 h-5 text-primary" /> Assessment Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Safety Gear Worn</span>
                            <Badge variant={selectedDemo.data?.check_safety ? 'default' : 'secondary'} className={`shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none ${selectedDemo.data?.check_safety ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {selectedDemo.data?.check_safety ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Proper Tool Usage</span>
                            <Badge variant={selectedDemo.data?.check_tools ? 'default' : 'secondary'} className={`shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none ${selectedDemo.data?.check_tools ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {selectedDemo.data?.check_tools ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Completion Time</span>
                            <Badge variant={selectedDemo.data?.check_time ? 'default' : 'secondary'} className={`shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none ${selectedDemo.data?.check_time ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {selectedDemo.data?.check_time ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="p-4 rounded-md-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 space-y-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Assessor Notes</h4>
                        <p className="text-sm text-[#71717a] dark:text-gray-400">
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
              <div className="w-20 h-20 rounded-md-full bg-primary/10 flex items-center justify-center mb-6">
                <PlayCircle className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Demonstration Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select a demonstration from the list to view its recording and checklist.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
