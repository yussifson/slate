import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Briefcase, MapPin, DollarSign, Building, Clock, Users, ArrowRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VJobOpportunities() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', location: '', salary: '', description: '', vacancies: 1 });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_job', user?.company_id);
      setJobs(records);
      if (records.length > 0 && !selectedJob) {
        setSelectedJob(records[0]);
      } else if (selectedJob) {
        const updated = records.find(r => r.id === selectedJob.id);
        if (updated) setSelectedJob(updated);
      }
    } catch (error) {
      console.error('Failed to fetch job opportunities:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchJobs();
    }
  }, [user]);

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.company) {
      toast.error('Title and Company are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_job', {
        title: newJob.title,
        status: 'Open',
        data: {
          company: newJob.company,
          location: newJob.location || 'Remote',
          salary: newJob.salary || 'Competitive',
          description: newJob.description,
          vacancies: parseInt(newJob.vacancies) || 1,
          jobType: 'Full-time',
          experience: 'Entry Level',
          deadline: 'Rolling',
          requirements: []
        }
      }, user?.company_id);
      toast.success('Job posted successfully');
      setIsDialogOpen(false);
      setNewJob({ title: '', company: '', location: '', salary: '', description: '', vacancies: 1 });
      fetchJobs();
      setSelectedJob(created);
    } catch (error) {
      console.error('Failed to post job:', error);
      toast.error('Failed to post job');
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.data?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('job_opportunities', 'Job Opportunities')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('jobs_desc', 'Manage and view available job openings for vocational trainees.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('post_job', 'Post New Job')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('post_new_job', 'Post New Job')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="title">{t('job_title', 'Job Title')}</Label>
                <Input id="title" placeholder="e.g. Junior Welder" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t('company', 'Company Name')}</Label>
                <Input id="company" placeholder="e.g. TechCorp" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t('location', 'Location')}</Label>
                <Input id="location" placeholder="e.g. Accra, Ghana" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">{t('salary', 'Salary Range')}</Label>
                  <Input id="salary" placeholder="e.g. $5k - $6k" value={newJob.salary} onChange={e => setNewJob({...newJob, salary: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacancies">{t('vacancies', 'Vacancies')}</Label>
                  <Input id="vacancies" type="number" min="1" value={newJob.vacancies} onChange={e => setNewJob({...newJob, vacancies: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">{t('description', 'Description')}</Label>
                <textarea 
                  id="desc" 
                  className="w-full h-24 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card resize-none text-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" 
                  placeholder="Job description..."
                  value={newJob.description}
                  onChange={e => setNewJob({...newJob, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateJob} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Post Job')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
              <Input 
                placeholder="Search jobs..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading jobs...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No jobs found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredJobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedJob?.id === job.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold ${
                      selectedJob?.id === job.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate text-sm">{job.title}</p>
                      <p className={`text-xs truncate ${selectedJob?.id === job.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {job.data?.company || 'Unknown Company'}
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
          {selectedJob ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className={`shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none px-3 py-1 text-xs ${selectedJob.status === 'Open' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {selectedJob.status || 'Open'}
                  </Badge>
                  <Badge variant="outline" className="shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none px-3 py-1 text-xs bg-card border-primary/40 text-primary tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    {selectedJob.data?.jobType || 'Full-time'}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <Briefcase className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedJob.title}</h2>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
                        <span className="flex items-center gap-2.5"><Building className="w-4 h-4 text-primary" /> {selectedJob.data?.company}</span>
                        <span className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-primary" /> {selectedJob.data?.location || 'Remote'}</span>
                        <span className="flex items-center gap-2.5"><DollarSign className="w-4 h-4 text-primary" /> {selectedJob.data?.salary || 'Competitive'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-primary/5 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Job Details</TabsTrigger>
                        <TabsTrigger value="requirements" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Requirements</TabsTrigger>
                        <TabsTrigger value="applications" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Applications</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="overview" className="space-y-6 outline-none">
                          <Card className="bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl">
                            <CardHeader className="pb-3 border-b border-primary/5">
                              <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Description</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <p className="text-slate-900 dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedJob.data?.description || 'No detailed description provided for this position. Please contact the employer for more information.'}
                              </p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-primary/10">
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Posted Date</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{new Date(selectedJob.created_date || Date.now()).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Deadline</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{selectedJob.data?.deadline || 'Rolling'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Vacancies</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{selectedJob.data?.vacancies || 1}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Experience</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{selectedJob.data?.experience || 'Entry Level'}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="requirements" className="outline-none">
                          <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 tracking-[0.04em]">Required Skills & Qualifications</h3>
                            <ul className="space-y-3">
                              {selectedJob.data?.requirements?.length > 0 ? (
                                selectedJob.data.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-900 dark:text-white">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                    <span>{req}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-[#71717a] dark:text-gray-400 italic">No specific requirements defined.</li>
                              )}
                            </ul>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="applications" className="outline-none">
                          <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl text-center py-12 flex flex-col items-center">
                            <Users className="w-12 h-12 text-primary/40 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Applications Yet</h3>
                            <p className="text-[#71717a] dark:text-gray-400 text-sm max-w-sm mb-6">
                              When trainees apply for this position, their applications and match scores will appear here.
                            </p>
                            <Button variant="outline" className="border-primary/40 text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-xl">Share Job Listing</Button>
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
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Briefcase className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Job Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select a job opportunity from the list to view full details and manage applications.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
