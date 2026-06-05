import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCircle, Briefcase, MapPin, Phone, Mail, Hammer, ShieldAlert, FileText, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VTraineeProfiles() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainee, setSelectedTrainee] = useState(null);

  const fetchTrainees = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_trainee', user?.company_id);
      setTrainees(records);
      if (records.length > 0 && !selectedTrainee) {
        setSelectedTrainee(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch trainee profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchTrainees();
    }
  }, [user]);

  const filteredTrainees = trainees.filter(t => 
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-amber-600 via-orange-600 to-slate-900 bg-clip-text text-transparent">
            Vocational Trainees
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage profiles, trade specializations, and placement details for vocational trainees.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel: Trainee List */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100/50">
          <div className="p-4 border-b border-amber-50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
              <Input 
                placeholder="Search trainees..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900 border-amber-100 dark:border-slate-700 rounded-xl focus-visible:ring-amber-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-amber-500/50 text-sm">Loading profiles...</div>
            ) : filteredTrainees.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No trainees found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredTrainees.map(trainee => (
                  <button
                    key={trainee.id}
                    onClick={() => setSelectedTrainee(trainee)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedTrainee?.id === trainee.id 
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                        : 'hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedTrainee?.id === trainee.id ? 'bg-white/20' : 'bg-amber-100 dark:bg-slate-800 text-amber-600'
                    }`}>
                      {trainee.title?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{trainee.title}</p>
                      <p className={`text-xs truncate ${selectedTrainee?.id === trainee.id ? 'text-amber-100' : 'text-slate-500'}`}>
                        {trainee.case_number} • {trainee.data?.trade || 'Unassigned Trade'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel: Trainee Details */}
        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100/50 overflow-hidden relative">
          {selectedTrainee ? (
            <>
              {/* Profile Header Background */}
              <div className="h-32 bg-gradient-to-r from-amber-500 to-orange-600 relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  {/* Profile Avatar & Primary Info */}
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-amber-600">
                        <Wrench className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedTrainee.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Badge variant="outline" className="border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-800 text-amber-600">{selectedTrainee.case_number}</Badge></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Hammer className="w-4 h-4 text-amber-500" /> {selectedTrainee.data?.trade || 'General Trades'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Badge className={selectedTrainee.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}>{selectedTrainee.status}</Badge></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-amber-50/50 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border border-amber-100 dark:border-slate-700">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">Overview</TabsTrigger>
                        <TabsTrigger value="skills" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">Skills & Certs</TabsTrigger>
                        <TabsTrigger value="placement" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">Placement</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="overview" className="space-y-6 outline-none">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-amber-50/30 dark:bg-slate-800/30 border border-amber-100 dark:border-slate-700 space-y-4">
                              <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider">Demographics</h3>
                              <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                  <p className="text-xs text-slate-500">Gender</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedTrainee.data?.gender || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Date of Birth</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedTrainee.data?.dob || 'Not Provided'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-slate-500">Contact Number</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2 mt-1">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    {selectedTrainee.data?.phone || 'Not Provided'}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-slate-500">Email Address</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    {selectedTrainee.data?.email || 'Not Provided'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-5 rounded-2xl bg-amber-50/30 dark:bg-slate-800/30 border border-amber-100 dark:border-slate-700 space-y-4">
                              <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider">Vocational Details</h3>
                              <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                  <p className="text-xs text-slate-500">Primary Trade</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedTrainee.data?.trade || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Cohort/Batch</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedTrainee.data?.cohort || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Enrollment Date</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-100">{new Date(selectedTrainee.created_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Expected Graduation</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedTrainee.data?.expected_graduation || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="skills" className="outline-none">
                          <div className="p-8 text-center border-2 border-dashed border-amber-100 dark:border-slate-700 rounded-2xl bg-amber-50/20 dark:bg-slate-800/20">
                            <Briefcase className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                            <h4 className="text-slate-700 dark:text-slate-200 font-bold">No Skills Recorded</h4>
                            <p className="text-slate-500 text-sm mt-1 mb-4">No verified competencies or certifications logged.</p>
                            <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl">Add Certification</Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="placement" className="outline-none">
                          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <h4 className="text-slate-700 dark:text-slate-200 font-bold">No Placement Info</h4>
                            <p className="text-slate-500 text-sm mt-1 mb-4">Update industry placement or apprenticeship status.</p>
                            <Button variant="outline" className="rounded-xl">Update Placement</Button>
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
              <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Wrench className="w-10 h-10 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Trainee Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select a trainee from the list on the left to view their profile, skills, and placement records.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
