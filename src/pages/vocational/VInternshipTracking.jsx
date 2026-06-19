import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Briefcase, Building2, MapPin, Calendar, Clock, Plus, Building, UserCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VInternshipTracking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInternship, setSelectedInternship] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInternship, setNewInternship] = useState({ student_name: '', company_name: '', start_date: '', end_date: '', duration_weeks: '', location: '', supervisor_name: '' });

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_internship', user?.company_id);
      setInternships(records);
      if (records.length > 0 && !selectedInternship) {
        setSelectedInternship(records[0]);
      } else if (selectedInternship) {
        const updated = records.find(r => r.id === selectedInternship.id);
        if (updated) setSelectedInternship(updated);
      }
    } catch (error) {
      console.error('Failed to fetch internships:', error);
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchInternships();
    }
  }, [user]);

  const handleCreateInternship = async () => {
    if (!newInternship.student_name || !newInternship.company_name) {
      toast.error('Student Name and Company Name are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_internship', {
        title: `${newInternship.student_name} - ${newInternship.company_name}`,
        status: 'Active',
        data: {
          student_name: newInternship.student_name,
          company_name: newInternship.company_name,
          start_date: newInternship.start_date || new Date().toISOString().split('T')[0],
          end_date: newInternship.end_date,
          duration_weeks: parseInt(newInternship.duration_weeks) || 12,
          location: newInternship.location || 'Remote',
          supervisor_name: newInternship.supervisor_name || 'TBD',
          supervisor_phone: '',
          supervisor_email: '',
          logs: []
        }
      }, user?.company_id);
      toast.success('Internship placement added');
      setIsDialogOpen(false);
      setNewInternship({ student_name: '', company_name: '', start_date: '', end_date: '', duration_weeks: '', location: '', supervisor_name: '' });
      fetchInternships();
      setSelectedInternship(created);
    } catch (error) {
      console.error('Failed to add placement:', error);
      toast.error('Failed to add placement');
    }
  };

  const filteredInternships = internships.filter(i => 
    i.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.data?.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.data?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('internship_tracking', 'Internship Tracking')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('internships_desc', 'Manage and track student internship placements and performance.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('new_placement', 'New Placement')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-md-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('add_placement', 'Add Placement')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="student">{t('student_name', 'Student Name')}</Label>
                <Input id="student" placeholder="e.g. John Doe" value={newInternship.student_name} onChange={e => setNewInternship({...newInternship, student_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t('company', 'Company Name')}</Label>
                <Input id="company" placeholder="e.g. TechCorp" value={newInternship.company_name} onChange={e => setNewInternship({...newInternship, company_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisor">{t('supervisor', 'Supervisor Name')}</Label>
                <Input id="supervisor" placeholder="e.g. Jane Smith" value={newInternship.supervisor_name} onChange={e => setNewInternship({...newInternship, supervisor_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t('location', 'Location')}</Label>
                <Input id="location" placeholder="e.g. Accra" value={newInternship.location} onChange={e => setNewInternship({...newInternship, location: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sdate">{t('start_date', 'Start Date')}</Label>
                  <Input id="sdate" type="date" value={newInternship.start_date} onChange={e => setNewInternship({...newInternship, start_date: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">{t('duration', 'Duration (Weeks)')}</Label>
                  <Input id="duration" type="number" placeholder="12" value={newInternship.duration_weeks} onChange={e => setNewInternship({...newInternship, duration_weeks: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateInternship} className="bg-primary text-white hover:bg-primary/90 rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Save Placement')}</Button>
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
                placeholder="Search placements..." 
                className="pl-9 h-10 border-primary/40 rounded-md-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading placements...</div>
            ) : filteredInternships.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No internships found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredInternships.map(internship => (
                  <button
                    key={internship.id}
                    onClick={() => setSelectedInternship(internship)}
                    className={`w-full text-left p-3 rounded-md-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedInternship?.id === internship.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-md-xl flex items-center justify-center font-semibold shrink-0 ${
                      selectedInternship?.id === internship.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate text-sm">{internship.data?.student_name || internship.title}</p>
                      <p className={`text-xs truncate ${selectedInternship?.id === internship.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {internship.data?.company_name || 'Unassigned'}
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
          {selectedInternship ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10"></div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-md-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <div className="w-full h-full rounded-md-xl bg-primary/5 flex items-center justify-center text-primary">
                        <Briefcase className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedInternship.data?.student_name || selectedInternship.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
                        <span className="flex items-center gap-2.5"><Building2 className="w-4 h-4 text-primary" /> {selectedInternship.data?.company_name || 'TBD'}</span>
                        <span>•</span>
                        <Badge variant="secondary" className={`shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none px-3 py-1 text-xs ${selectedInternship.status === 'Active' ? 'bg-primary text-white' : selectedInternship.status === 'Completed' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {selectedInternship.status || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-primary/5 p-1 rounded-md-xl w-full sm:w-auto overflow-x-auto justify-start border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Overview</TabsTrigger>
                        <TabsTrigger value="supervisor" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Supervisor</TabsTrigger>
                        <TabsTrigger value="logs" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Daily Logs</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="overview" className="space-y-6 outline-none">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl">
                              <CardHeader className="pb-3 border-b border-primary/5">
                                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Placement Details</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4 grid grid-cols-2 gap-y-4">
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Start Date</p>
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {selectedInternship.data?.start_date || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">End Date</p>
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {selectedInternship.data?.end_date || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Duration</p>
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {selectedInternship.data?.duration_weeks || 'N/A'} weeks</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Location</p>
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {selectedInternship.data?.location || 'N/A'}</p>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl">
                              <CardHeader className="pb-3 border-b border-primary/5">
                                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Company Info</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Company Name</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{selectedInternship.data?.company_name || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Supervisor / Mentor</p>
                                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <UserCircle className="w-4 h-4 text-primary" />
                                    {selectedInternship.data?.supervisor_name || 'N/A'}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="supervisor" className="outline-none">
                          <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl text-center py-12 flex flex-col items-center">
                            <UserCircle className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Supervisor Evaluation</h3>
                            <p className="text-[#71717a] dark:text-gray-400 text-sm max-w-sm mb-6">
                              The supervisor evaluation has not been submitted yet. Usually completed at the end of the internship period.
                            </p>
                            <Button variant="outline" className="border-primary/40 text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-xl">Send Evaluation Request</Button>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="logs" className="outline-none">
                          <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl text-center py-12">
                            <Clock className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                            <p className="text-[#71717a] dark:text-gray-400 text-sm mb-4">No daily logs recorded by the intern yet.</p>
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
                <Briefcase className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Internship Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select an internship placement to view its details, supervisor feedback, and student logs.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
