import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, GraduationCap, LayoutList, Target, BookCheck, LineChart, CheckCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VQualificationTracking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQual, setSelectedQual] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newQual, setNewQual] = useState({ title: '', level: '', credits: '' });

  const fetchQualifications = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_qualification', user?.company_id);
      setQualifications(records);
      if (records.length > 0 && !selectedQual) {
        setSelectedQual(records[0]);
      } else if (selectedQual) {
        const updated = records.find(r => r.id === selectedQual.id);
        if (updated) setSelectedQual(updated);
      }
    } catch (error) {
      console.error('Failed to fetch qualifications:', error);
      toast.error('Failed to load qualifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchQualifications();
    }
  }, [user]);

  const handleCreateQual = async () => {
    if (!newQual.title || !newQual.level) {
      toast.error('Title and Level are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_qualification', {
        title: newQual.title,
        status: 'Active',
        data: {
          level: newQual.level,
          credits: parseInt(newQual.credits) || 0,
          enrolled_count: 0,
          completion_rate: '0%',
          modules: []
        }
      }, user?.company_id);
      toast.success('Qualification created successfully');
      setIsDialogOpen(false);
      setNewQual({ title: '', level: '', credits: '' });
      fetchQualifications();
      setSelectedQual(created);
    } catch (error) {
      console.error('Failed to create qualification:', error);
      toast.error('Failed to create qualification');
    }
  };

  const filteredQuals = qualifications.filter(q => 
    q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.data?.level?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('qualification_frameworks', 'Qualification Frameworks')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('qualifications_desc', 'Manage overarching vocational qualifications, competency maps, and module requirements.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('new_framework', 'New Framework')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('add_new_qual', 'Add New Qualification')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('qual_title', 'Qualification Title')}</Label>
                <Input id="title" placeholder="e.g. Diploma in Advanced Welding" value={newQual.title} onChange={e => setNewQual({...newQual, title: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">{t('level', 'Level')}</Label>
                  <Input id="level" placeholder="e.g. Level 3" value={newQual.level} onChange={e => setNewQual({...newQual, level: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">{t('credits', 'Total Credits')}</Label>
                  <Input id="credits" type="number" placeholder="120" value={newQual.credits} onChange={e => setNewQual({...newQual, credits: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateQual} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Save Framework')}</Button>
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
                placeholder="Search qualifications..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading frameworks...</div>
            ) : filteredQuals.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No qualifications found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredQuals.map(qual => (
                  <button
                    key={qual.id}
                    onClick={() => setSelectedQual(qual)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedQual?.id === qual.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold shrink-0 ${
                      selectedQual?.id === qual.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate">{qual.title}</p>
                      <p className={`text-xs truncate ${selectedQual?.id === qual.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {qual.data?.level || 'Standard Level'} • {qual.data?.credits || 0} Credits
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
          {selectedQual ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10 flex items-center px-8">
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <Target className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedQual.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
                        <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                          {selectedQual.data?.level || 'N/A'}
                        </Badge>
                        <span>•</span>
                        <span>{selectedQual.data?.credits || 0} Credits</span>
                        <span>•</span>
                        <Badge variant="secondary" className={selectedQual.status === 'Active' ? 'bg-primary text-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none' : 'bg-slate-200 text-slate-600 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none'}>
                          {selectedQual.status || 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        <CardHeader className="pb-3 border-b border-primary/10">
                          <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white"><BookCheck className="w-5 h-5 text-primary" /> Core Modules</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                          {selectedQual.data?.modules?.length > 0 ? (
                            selectedQual.data.modules.map((mod, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-card text-primary border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 flex items-center justify-center font-semibold text-xs tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{idx + 1}</div>
                                  <span className="font-medium text-slate-900 dark:text-white">{mod.name || 'Module Name'}</span>
                                </div>
                                <span className="text-xs text-primary font-medium tracking-[0.04em]">{mod.credits || 0} Credits</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 rounded-xl bg-primary/5">
                              <p className="text-[#71717a] dark:text-gray-400 text-sm mb-2">No modules defined for this qualification.</p>
                              <Button variant="outline" size="sm" className="rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none text-primary border-primary/40">Add Module</Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-6">
                      <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl text-center">
                        <CardContent className="pt-6">
                          <LineChart className="w-8 h-8 text-primary mx-auto mb-2" />
                          <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Enrolled Students</h3>
                          <p className="text-4xl font-black text-primary tracking-[-0.02em]">{selectedQual.data?.enrolled_count || 0}</p>
                          <Button variant="outline" className="w-full mt-4 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:bg-primary/5 rounded-xl text-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">View Roster</Button>
                        </CardContent>
                      </Card>

                      <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl text-center">
                        <CardContent className="pt-6">
                          <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                          <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Completion Rate</h3>
                          <p className="text-4xl font-black text-primary tracking-[-0.02em]">{selectedQual.data?.completion_rate || '0%'}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <LayoutList className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Qualification Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select a qualification framework to view its modules and tracking details.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
