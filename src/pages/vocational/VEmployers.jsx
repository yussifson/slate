import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Building2, MapPin, Phone, Mail, Link as LinkIcon, Star, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VEmployers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_employer', user?.company_id);
      setEmployers(records);
      if (records.length > 0 && !selectedEmployer) {
        setSelectedEmployer(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch employers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchEmployers();
    }
  }, [user]);

  const filteredEmployers = employers.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
            Employer Partners
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage industry partners, contacts, and placement histories.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-teal-500/30">
          <Building2 className="w-4 h-4 mr-2" /> Add Employer
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
          <div className="p-4 border-b border-primary/5 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <Input 
                placeholder="Search employers..." 
                className="pl-9 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-primary/30 text-sm">Loading partners...</div>
            ) : filteredEmployers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No employers found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredEmployers.map(employer => (
                  <button
                    key={employer.id}
                    onClick={() => setSelectedEmployer(employer)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedEmployer?.id === employer.id 
                        ? 'bg-primary text-white shadow-md shadow-teal-500/20' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedEmployer?.id === employer.id ? 'bg-white/20' : 'bg-slate-100 text-primary'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate text-sm">{employer.title}</p>
                      <p className={`text-xs truncate ${selectedEmployer?.id === employer.id ? 'text-primary/20' : 'text-slate-500'}`}>
                        {employer.data?.industry || 'General'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
          {selectedEmployer ? (
            <>
              <div className="h-32 bg-gradient-to-r from-primary to-primary relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border-none flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> {selectedEmployer.data?.partnershipLevel || 'Active Partner'}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                        <Building2 className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedEmployer.title}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {selectedEmployer.data?.address || 'Address not provided'}</span>
                        <span className="flex items-center gap-1.5"><LinkIcon className="w-4 h-4 text-primary" /> {selectedEmployer.data?.website || 'No website'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-slate-500 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border border-slate-200 dark:border-slate-700">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary">Overview</TabsTrigger>
                        <TabsTrigger value="contacts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary">Key Contacts</TabsTrigger>
                        <TabsTrigger value="placements" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary">Placements</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="overview" className="space-y-6 outline-none">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-primary/30 border border-slate-200 dark:border-slate-700 space-y-4">
                              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Company Info</h3>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-xs text-slate-500">Industry Sector</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedEmployer.data?.industry || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Description</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-1">{selectedEmployer.data?.description || 'No description available for this employer.'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-6 rounded-2xl bg-primary/30 border border-slate-200 dark:border-slate-700 space-y-4">
                              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Partnership Details</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-slate-500">Partner Since</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{new Date(selectedEmployer.created_date).getFullYear()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Total Placements</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedEmployer.data?.totalPlacements || 0}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Active Interns</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedEmployer.data?.activeInterns || 0}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Status</p>
                                  <p className="font-medium text-primary flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Active</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="contacts" className="outline-none">
                          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Primary Contact</h3>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-primary/90 font-bold">
                                  {selectedEmployer.data?.contactName ? selectedEmployer.data.contactName.charAt(0) : 'C'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmployer.data?.contactName || 'Unassigned Contact'}</p>
                                  <p className="text-xs text-slate-500">{selectedEmployer.data?.contactRole || 'HR Manager'}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                  <Mail className="w-4 h-4 text-primary" />
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{selectedEmployer.data?.contactEmail || 'No email provided'}</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                  <Phone className="w-4 h-4 text-primary" />
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{selectedEmployer.data?.contactPhone || 'No phone provided'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="placements" className="outline-none">
                          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                            <h4 className="text-slate-700 dark:text-slate-200 font-bold mb-2">Recent Placements</h4>
                            <p className="text-slate-500 text-sm mb-4">View the history of trainees placed at this organization.</p>
                            <Button variant="outline" className="border-primary/20 text-primary hover:bg-slate-50 rounded-xl">
                              View Placement History
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
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <Building2 className="w-10 h-10 text-primary/30" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">No Employer Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select an employer from the list to view their partnership details, contacts, and placement history.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
