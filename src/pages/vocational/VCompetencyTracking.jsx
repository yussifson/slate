import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, BarChart3, TrendingUp, CheckCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VCompetencyTracking() {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState(null);

  const fetchCompetencies = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_competency', user?.company_id);
      setCompetencies(records);
      if (records.length > 0 && !selectedCompetency) {
        setSelectedCompetency(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch competencies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchCompetencies();
    }
  }, [user]);

  const filteredCompetencies = competencies.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.data?.framework?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-cyan-600 via-blue-600 to-slate-900 bg-clip-text text-transparent">
            Competency Tracking
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Monitor mastery levels of core industry skills and standards across trainees.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-cyan-100/50">
          <div className="p-4 border-b border-cyan-50 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
              <Input 
                placeholder="Search competencies..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900 border-cyan-100 dark:border-slate-700 rounded-xl focus-visible:ring-cyan-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-cyan-500/50 text-sm">Loading competencies...</div>
            ) : filteredCompetencies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No competencies found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredCompetencies.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedCompetency(comp)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedCompetency?.id === comp.id 
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' 
                        : 'hover:bg-cyan-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedCompetency?.id === comp.id ? 'bg-white/20' : 'bg-cyan-100 dark:bg-slate-800 text-cyan-600'
                    }`}>
                      <Star className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{comp.title}</p>
                      <p className={`text-xs truncate ${selectedCompetency?.id === comp.id ? 'text-cyan-100' : 'text-slate-500'}`}>
                        {comp.data?.framework || 'General'} • Level {comp.data?.level || '1'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-cyan-100/50 overflow-hidden relative">
          {selectedCompetency ? (
            <>
              <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600 relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-20"></div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-cyan-50 dark:bg-slate-800 flex items-center justify-center text-cyan-600">
                        <BarChart3 className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedCompetency.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Badge variant="outline" className="border-cyan-200 dark:border-slate-600 bg-cyan-50 dark:bg-slate-800 text-cyan-600">{selectedCompetency.data?.framework}</Badge></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">Level: {selectedCompetency.data?.level || 'N/A'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-cyan-500" /> {selectedCompetency.data?.industry_standard || 'Standard'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-cyan-50/50 dark:bg-slate-800/50 border border-cyan-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Completion Rate
                        </h3>
                        <div className="flex items-end gap-2">
                          <span className="text-5xl font-black text-slate-800 dark:text-slate-100">{selectedCompetency.data?.completion_rate || '0%'}</span>
                          <span className="text-slate-500 mb-1">of enrolled trainees</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                          <div className="bg-cyan-500 h-full rounded-full" style={{ width: selectedCompetency.data?.completion_rate || '0%' }}></div>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Required Evidence</h3>
                        <ul className="space-y-3">
                          {selectedCompetency.data?.evidence_required ? (
                            selectedCompetency.data.evidence_required.split(',').map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <CheckCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                                <span>{item.trim()}</span>
                              </li>
                            ))
                          ) : (
                            <>
                              <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <CheckCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                                <span>Practical Demonstration Video</span>
                              </li>
                              <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <CheckCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                                <span>Written Assessment Score &gt; 80%</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Description & Standards</h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedCompetency.data?.description || 'No detailed description provided for this competency standard.'}
                      </p>
                      
                      <div className="mt-6 flex justify-end">
                        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl">View Mapped Courses</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-cyan-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <BarChart3 className="w-10 h-10 text-cyan-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Competency Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select a competency standard to view tracking metrics, evidence requirements, and completion rates.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
