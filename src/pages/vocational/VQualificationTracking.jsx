import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, GraduationCap, LayoutList, Target, BookCheck, LineChart, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VQualificationTracking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQual, setSelectedQual] = useState(null);

  const fetchQualifications = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_qualification', user?.company_id);
      setQualifications(records);
      if (records.length > 0 && !selectedQual) {
        setSelectedQual(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch qualifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchQualifications();
    }
  }, [user]);

  const filteredQuals = qualifications.filter(q => 
    q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.data?.level?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary via-primary/90 to-slate-900 bg-clip-text text-transparent">
            Qualification Frameworks
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage overarching vocational qualifications, competency maps, and module requirements.
          </p>
        </div>
        <Button className="rounded-xl shadow-lg shadow-emerald-200 bg-primary hover:bg-primary/90 text-white">
          <LayoutList className="w-4 h-4 mr-2" /> New Framework
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
          <div className="p-4 border-b border-primary/5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <Input 
                placeholder="Search qualifications..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900 border-primary/10 dark:border-slate-700 rounded-xl focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-primary/30 text-sm">Loading frameworks...</div>
            ) : filteredQuals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No qualifications found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredQuals.map(qual => (
                  <button
                    key={qual.id}
                    onClick={() => setSelectedQual(qual)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedQual?.id === qual.id 
                        ? 'bg-primary text-white shadow-md shadow-emerald-500/20' 
                        : 'hover:bg-primary/5 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedQual?.id === qual.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{qual.title}</p>
                      <p className={`text-xs truncate ${selectedQual?.id === qual.id ? 'text-primary/20' : 'text-slate-500'}`}>
                        {qual.data?.level || 'Standard Level'} • {qual.data?.credits || 0} Credits
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
          {selectedQual ? (
            <>
              <div className="h-32 bg-gradient-to-r from-slate-900 to-primary/80 relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
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
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedQual.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Badge variant="outline" className="border-primary/20 text-primary">{selectedQual.data?.level || 'N/A'}</Badge></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">{selectedQual.data?.credits || 0} Credits</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Badge className={selectedQual.status === 'Active' ? 'bg-primary' : 'bg-slate-500'}>
                            {selectedQual.status || 'Draft'}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><BookCheck className="w-4 h-4 text-primary" /> Core Modules</h3>
                        <div className="space-y-3">
                          {selectedQual.data?.modules?.length > 0 ? (
                            selectedQual.data.modules.map((mod, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                                  <span className="font-medium text-slate-700">{mod.name || 'Module Name'}</span>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">{mod.credits || 0} Credits</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                              <p className="text-slate-500 text-sm">No modules defined for this qualification.</p>
                              <Button variant="link" className="text-primary h-auto p-0 mt-2">Add Module</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-primary/50 border border-primary/10 text-center">
                        <LineChart className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="text-slate-800 font-bold mb-1">Enrolled Students</h3>
                        <p className="text-3xl font-black text-primary">{selectedQual.data?.enrolled_count || 0}</p>
                        <Button variant="outline" className="w-full mt-4 bg-white rounded-xl">View Roster</Button>
                      </div>

                      <div className="p-6 rounded-2xl bg-primary/50 border border-primary/10 text-center">
                        <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="text-slate-800 font-bold mb-1">Completion Rate</h3>
                        <p className="text-3xl font-black text-primary">{selectedQual.data?.completion_rate || '0%'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-primary/30" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">No Qualification Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select a qualification framework to view its modules and competency requirements.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
