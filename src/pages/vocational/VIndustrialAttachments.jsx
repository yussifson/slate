import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Link as LinkIcon, Factory, UserCheck, CalendarDays, BookOpen, Plus, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VIndustrialAttachments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAttachment, setNewAttachment] = useState({ trainee_name: '', host_org: '', industry: '', mentor_name: '', start_date: '', end_date: '' });

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_attachment', user?.company_id);
      setAttachments(records);
      if (records.length > 0 && !selectedAttachment) {
        setSelectedAttachment(records[0]);
      } else if (selectedAttachment) {
        const updated = records.find(r => r.id === selectedAttachment.id);
        if (updated) setSelectedAttachment(updated);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
      toast.error('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchAttachments();
    }
  }, [user]);

  const handleCreateAttachment = async () => {
    if (!newAttachment.trainee_name || !newAttachment.host_org) {
      toast.error('Trainee Name and Host Organization are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_attachment', {
        title: `${newAttachment.trainee_name} - ${newAttachment.host_org}`,
        status: 'Active',
        data: {
          trainee_name: newAttachment.trainee_name,
          host_org: newAttachment.host_org,
          industry: newAttachment.industry || 'General',
          mentor_name: newAttachment.mentor_name || 'TBD',
          start_date: newAttachment.start_date || new Date().toISOString().split('T')[0],
          end_date: newAttachment.end_date || '',
          attendance_days: 0,
          tasks: []
        }
      }, user?.company_id);
      toast.success('Trainee assigned successfully');
      setIsDialogOpen(false);
      setNewAttachment({ trainee_name: '', host_org: '', industry: '', mentor_name: '', start_date: '', end_date: '' });
      fetchAttachments();
      setSelectedAttachment(created);
    } catch (error) {
      console.error('Failed to assign trainee:', error);
      toast.error('Failed to assign trainee');
    }
  };

  const filteredAttachments = attachments.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.data?.trainee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.data?.host_org?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('industrial_attachments', 'Industrial Attachments')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('attachments_desc', 'Monitor trainee host organizations, technical tasks, and attachment logs.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('assign_trainee', 'Assign Trainee')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-md-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('assign_new_trainee', 'Assign New Trainee')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="trainee">{t('trainee_name', 'Trainee Name')}</Label>
                <Input id="trainee" placeholder="e.g. John Doe" value={newAttachment.trainee_name} onChange={e => setNewAttachment({...newAttachment, trainee_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">{t('host_org', 'Host Organization')}</Label>
                <Input id="org" placeholder="e.g. TechCorp" value={newAttachment.host_org} onChange={e => setNewAttachment({...newAttachment, host_org: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">{t('industry', 'Industry')}</Label>
                <Input id="industry" placeholder="e.g. Manufacturing" value={newAttachment.industry} onChange={e => setNewAttachment({...newAttachment, industry: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor">{t('mentor', 'Technical Mentor')}</Label>
                <Input id="mentor" placeholder="e.g. Jane Smith" value={newAttachment.mentor_name} onChange={e => setNewAttachment({...newAttachment, mentor_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sdate">{t('start_date', 'Start Date')}</Label>
                  <Input id="sdate" type="date" value={newAttachment.start_date} onChange={e => setNewAttachment({...newAttachment, start_date: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edate">{t('end_date', 'End Date')}</Label>
                  <Input id="edate" type="date" value={newAttachment.end_date} onChange={e => setNewAttachment({...newAttachment, end_date: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateAttachment} className="bg-primary text-white hover:bg-primary/90 rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Save Assignment')}</Button>
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
                placeholder="Search trainees or orgs..." 
                className="pl-9 h-10 border-primary/40 rounded-md-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading attachments...</div>
            ) : filteredAttachments.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No attachments found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredAttachments.map(attachment => (
                  <button
                    key={attachment.id}
                    onClick={() => setSelectedAttachment(attachment)}
                    className={`w-full text-left p-3 rounded-md-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedAttachment?.id === attachment.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-md-xl flex items-center justify-center font-semibold shrink-0 ${
                      selectedAttachment?.id === attachment.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Factory className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate text-sm">{attachment.data?.trainee_name || attachment.title}</p>
                      <p className={`text-xs truncate ${selectedAttachment?.id === attachment.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {attachment.data?.host_org || 'No Org'}
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
          {selectedAttachment ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10"></div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-md-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <div className="w-full h-full rounded-md-xl bg-primary/5 flex items-center justify-center text-primary">
                        <LinkIcon className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedAttachment.data?.trainee_name || selectedAttachment.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
                        <span className="flex items-center gap-2.5"><Factory className="w-4 h-4 text-primary" /> {selectedAttachment.data?.host_org || 'TBD'}</span>
                        <span>•</span>
                        <Badge variant="secondary" className={`shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none px-3 py-1 text-xs ${selectedAttachment.status === 'Active' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {selectedAttachment.status || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-primary/5 p-1 rounded-md-xl w-full sm:w-auto overflow-x-auto justify-start border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Details</TabsTrigger>
                        <TabsTrigger value="attendance" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Attendance</TabsTrigger>
                        <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Tasks & Skills</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="overview" className="space-y-6 outline-none">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl">
                              <CardHeader className="pb-3 border-b border-primary/5">
                                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Host Information</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Organization</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{selectedAttachment.data?.host_org || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Industry</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{selectedAttachment.data?.industry || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Technical Mentor</p>
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-primary" />
                                    {selectedAttachment.data?.mentor_name || 'Not assigned'}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl">
                              <CardHeader className="pb-3 border-b border-primary/5">
                                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Schedule</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Start Date</p>
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-primary" />
                                    {selectedAttachment.data?.start_date || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">End Date</p>
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-primary" />
                                    {selectedAttachment.data?.end_date || 'N/A'}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="attendance" className="outline-none">
                          <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl text-center py-12">
                            <Activity className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                            <p className="text-[#71717a] dark:text-gray-400 text-sm mb-4">No daily attendance logs recorded yet.</p>
                            <Button variant="outline" className="border-primary/40 text-primary rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Log Attendance</Button>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="tasks" className="outline-none">
                          <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Logged Tasks</h3>
                              <Button variant="outline" size="sm" className="border-primary/40 text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-xl h-8"><Plus className="w-3 h-3 mr-1" /> Add Task</Button>
                            </div>
                            <ul className="space-y-3">
                              {selectedAttachment.data?.tasks?.length > 0 ? (
                                selectedAttachment.data.tasks.map((task, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-900 dark:text-white bg-card p-3 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                                    <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>{task}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-[#71717a] dark:text-gray-400 italic text-center py-4">No tasks or skills have been logged for this attachment yet.</li>
                              )}
                            </ul>
                          </Card>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-md-full bg-primary/10 flex items-center justify-center mb-6">
                <LinkIcon className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Attachment Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select an industrial attachment record to view trainee progress, host details, and task logs.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
