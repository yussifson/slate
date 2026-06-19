import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ClipboardCheck, Wrench, AlertTriangle, ShieldCheck, CheckCircle2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

export default function VWorkshopAssessments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({ title: '', workshop_name: '', inspector: '', safety_score: '100', issues_count: '0', equipment_condition: 'Good', notes: '' });

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_assessment', user?.company_id);
      setAssessments(records);
      if (records.length > 0 && !selectedAssessment) {
        setSelectedAssessment(records[0]);
      } else if (selectedAssessment) {
        const updated = records.find(r => r.id === selectedAssessment.id);
        if (updated) setSelectedAssessment(updated);
      }
    } catch (error) {
      console.error('Failed to fetch workshop assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchAssessments();
    }
  }, [user]);

  const handleCreateAssessment = async () => {
    if (!newAssessment.title || !newAssessment.workshop_name) {
      toast.error('Title and Workshop Name are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_assessment', {
        title: newAssessment.title,
        data: {
          workshop_name: newAssessment.workshop_name,
          inspector: newAssessment.inspector || user?.name || 'Assessor',
          safety_score: parseInt(newAssessment.safety_score),
          issues_count: parseInt(newAssessment.issues_count),
          equipment_condition: newAssessment.equipment_condition,
          notes: newAssessment.notes
        }
      }, user?.company_id);
      toast.success('Assessment recorded successfully');
      setIsDialogOpen(false);
      setNewAssessment({ title: '', workshop_name: '', inspector: '', safety_score: '100', issues_count: '0', equipment_condition: 'Good', notes: '' });
      fetchAssessments();
      setSelectedAssessment(created);
    } catch (error) {
      console.error('Failed to create assessment:', error);
      toast.error('Failed to record assessment');
    }
  };

  const filteredAssessments = assessments.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.data?.workshop_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('workshop_assessments', 'Workshop Assessments')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('assessments_desc', 'Evaluate workshop safety, tool usage, and overall environment standards.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('add_assessment', 'Record Assessment')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('record_assessment', 'Record New Assessment')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="title">{t('title', 'Assessment Title')}</Label>
                <Input id="title" placeholder="e.g. Monthly Safety Check" value={newAssessment.title} onChange={e => setNewAssessment({...newAssessment, title: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workshop">{t('workshop_name', 'Workshop / Bay')}</Label>
                <Input id="workshop" placeholder="e.g. Welding Bay 2" value={newAssessment.workshop_name} onChange={e => setNewAssessment({...newAssessment, workshop_name: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspector">{t('inspector', 'Inspector Name')}</Label>
                <Input id="inspector" placeholder="e.g. J. Doe" value={newAssessment.inspector} onChange={e => setNewAssessment({...newAssessment, inspector: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score">{t('safety_score', 'Safety Score')}</Label>
                  <Input id="score" type="number" placeholder="100" value={newAssessment.safety_score} onChange={e => setNewAssessment({...newAssessment, safety_score: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issues">{t('issues_found', 'Issues Found')}</Label>
                  <Input id="issues" type="number" placeholder="0" value={newAssessment.issues_count} onChange={e => setNewAssessment({...newAssessment, issues_count: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">{t('condition', 'Equipment Condition')}</Label>
                <Select value={newAssessment.equipment_condition} onValueChange={v => setNewAssessment({...newAssessment, equipment_condition: v})}>
                  <SelectTrigger className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('notes', 'Notes')}</Label>
                <textarea 
                  id="notes" 
                  className="w-full h-24 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card resize-none text-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" 
                  placeholder="Additional remarks..."
                  value={newAssessment.notes}
                  onChange={e => setNewAssessment({...newAssessment, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateAssessment} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Save Assessment')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
              <Input 
                placeholder="Search assessments..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading assessments...</div>
            ) : filteredAssessments.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No assessments found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredAssessments.map(assessment => (
                  <button
                    key={assessment.id}
                    onClick={() => setSelectedAssessment(assessment)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedAssessment?.id === assessment.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold shrink-0 ${
                      selectedAssessment?.id === assessment.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate">{assessment.title}</p>
                      <p className={`text-xs truncate ${selectedAssessment?.id === assessment.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {assessment.data?.workshop_name || 'General Workshop'} • {new Date(assessment.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {selectedAssessment ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10 flex items-center px-8">
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <Wrench className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedAssessment.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
                        <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                          {selectedAssessment.data?.workshop_name || 'Workshop'}
                        </Badge>
                        <span>•</span>
                        <span>Inspector: {selectedAssessment.data?.inspector || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Safety Score</CardTitle>
                            <CardDescription>Overall compliance</CardDescription>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-semibold text-slate-900 dark:text-white tracking-[-0.02em]">
                            {selectedAssessment.data?.safety_score || 'N/A'}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Issues Found</CardTitle>
                            <CardDescription>Attention needed</CardDescription>
                          </div>
                          <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-semibold text-slate-900 dark:text-white tracking-[-0.02em]">
                            {selectedAssessment.data?.issues_count || 0}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="p-5 rounded-2xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 space-y-4">
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Assessment Details</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Equipment Condition</p>
                          <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> {selectedAssessment.data?.equipment_condition || 'Good'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">General Notes</p>
                          <p className="font-medium text-slate-900 dark:text-white bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                            {selectedAssessment.data?.notes || 'No specific notes recorded for this assessment.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Wrench className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Assessment Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select an assessment from the list to view details or add a new one.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
