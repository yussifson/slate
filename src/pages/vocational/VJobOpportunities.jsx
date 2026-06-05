import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Briefcase, MapPin, DollarSign, Building, Clock, Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VJobOpportunities() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_job', user?.company_id);
      setJobs(records);
      if (records.length > 0 && !selectedJob) {
        setSelectedJob(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch job opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchJobs();
    }
  }, [user]);

  const filteredJobs = jobs.filter(j => 
    j.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.data?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 bg-clip-text text-transparent">
            Job Opportunities
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage and view available job openings for vocational trainees.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30">
          <Briefcase className="w-4 h-4 mr-2" /> Post New Job
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-indigo-100/50">
          <div className="p-4 border-b border-indigo-50 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
              <Input 
                placeholder="Search jobs..." 
                className="pl-9 h-10 bg-slate-50 dark:bg-slate-900 border-indigo-100 dark:border-slate-700 rounded-xl focus-visible:ring-indigo-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-indigo-300 text-sm">Loading jobs...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No jobs found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredJobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedJob?.id === job.id 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : 'hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedJob?.id === job.id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate text-sm">{job.title}</p>
                      <p className={`text-xs truncate ${selectedJob?.id === job.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {job.data?.company || 'Unknown Company'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-indigo-100/50 overflow-hidden relative">
          {selectedJob ? (
            <>
              <div className="h-32 bg-gradient-to-r from-indigo-700 to-violet-500 relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className={selectedJob.status === 'Open' ? 'bg-emerald-500' : 'bg-slate-500'}>
                    {selectedJob.status || 'Open'}
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    {selectedJob.data?.jobType || 'Full-time'}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600">
                        <Briefcase className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedJob.title}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-indigo-500" /> {selectedJob.data?.company}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-500" /> {selectedJob.data?.location || 'Remote'}</span>
                        <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-500" /> {selectedJob.data?.salary || 'Competitive'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-indigo-50/50 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border border-indigo-100 dark:border-slate-700">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600">Job Details</TabsTrigger>
                        <TabsTrigger value="requirements" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600">Requirements</TabsTrigger>
                        <TabsTrigger value="applications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600">Applications</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="overview" className="space-y-6 outline-none">
                          <div className="p-6 rounded-2xl bg-indigo-50/30 border border-indigo-100 dark:border-slate-700 space-y-4">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Description</h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                              {selectedJob.data?.description || 'No detailed description provided for this position. Please contact the employer for more information.'}
                            </p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-indigo-100 dark:border-slate-700">
                              <div>
                                <p className="text-xs text-slate-500">Posted Date</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{new Date(selectedJob.created_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Deadline</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedJob.data?.deadline || 'Rolling'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Vacancies</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedJob.data?.vacancies || 1}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Experience</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedJob.data?.experience || 'Entry Level'}</p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="requirements" className="outline-none">
                          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Required Skills & Qualifications</h3>
                            <ul className="space-y-3">
                              {(selectedJob.data?.requirements || ['Relevant Vocational Certificate', 'Strong work ethic', 'Good communication skills']).map((req, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TabsContent>

                        <TabsContent value="applications" className="outline-none">
                          <div className="p-8 text-center border-2 border-dashed border-indigo-100 dark:border-slate-700 rounded-2xl">
                            <Users className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                            <h4 className="text-slate-700 dark:text-slate-200 font-bold">Manage Applications</h4>
                            <p className="text-slate-500 text-sm mt-1 mb-4">View and process trainees who have applied for this position.</p>
                            <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl">
                              View Candidates <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                <Briefcase className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">No Job Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select a job opportunity from the list to view its details, requirements, and manage applicants.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
