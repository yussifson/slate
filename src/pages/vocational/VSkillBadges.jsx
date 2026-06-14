import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Medal, CheckCircle2, Hexagon, Shield, Zap, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VSkillBadges() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadge, setSelectedBadge] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBadge, setNewBadge] = useState({ title: '', category: '', points: '', description: '', criteria: '' });

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_badge', user?.company_id);
      setBadges(records);
      if (records.length > 0 && !selectedBadge) {
        setSelectedBadge(records[0]);
      } else if (selectedBadge) {
        const updated = records.find(r => r.id === selectedBadge.id);
        if (updated) setSelectedBadge(updated);
      }
    } catch (error) {
      console.error('Failed to fetch skill badges:', error);
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchBadges();
    }
  }, [user]);

  const handleCreateBadge = async () => {
    if (!newBadge.title) return;
    try {
      const created = await base44.createEntity('voc_badge', {
        title: newBadge.title,
        data: {
          category: newBadge.category || 'General',
          points: parseInt(newBadge.points) || 10,
          description: newBadge.description,
          criteria: newBadge.criteria.split(',').map(c => c.trim()).filter(c => c),
          recipient_count: 0
        }
      }, user?.company_id);
      toast.success('Badge created successfully');
      setIsDialogOpen(false);
      setNewBadge({ title: '', category: '', points: '', description: '', criteria: '' });
      fetchBadges();
      setSelectedBadge(created);
    } catch (error) {
      console.error('Failed to create badge:', error);
      toast.error('Failed to create badge');
    }
  };

  const filteredBadges = badges.filter(b => 
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.data?.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('skill_badges', 'Skill Badges')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {t('skill_badges_desc', 'Define, award, and track micro-credentials and specific skill badges.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-none">
              <Plus className="w-4 h-4 mr-2" /> {t('create_badge', 'Create Badge')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-none bg-card">
            <DialogHeader>
              <DialogTitle>{t('add_new_badge', 'Create New Badge')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('badge_name', 'Badge Name')}</Label>
                <Input id="title" placeholder="e.g. Master Welder" value={newBadge.title} onChange={e => setNewBadge({...newBadge, title: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category', 'Category')}</Label>
                  <Input id="category" placeholder="e.g. Technical" value={newBadge.category} onChange={e => setNewBadge({...newBadge, category: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">{t('points', 'Points Value')}</Label>
                  <Input id="points" type="number" placeholder="10" value={newBadge.points} onChange={e => setNewBadge({...newBadge, points: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">{t('description', 'Description')}</Label>
                <textarea 
                  id="desc" 
                  className="w-full h-20 p-3 rounded-xl border border-primary/40 shadow-none bg-card resize-none text-sm" 
                  placeholder="Short description..."
                  value={newBadge.description}
                  onChange={e => setNewBadge({...newBadge, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="criteria">{t('criteria', 'Criteria (comma-separated)')}</Label>
                <Input id="criteria" placeholder="e.g. Pass exam, 50 hours practice" value={newBadge.criteria} onChange={e => setNewBadge({...newBadge, criteria: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateBadge} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-none">{t('save', 'Save Badge')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-2xl border border-primary/40 bg-card shadow-none">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search badges..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading badges...</div>
            ) : filteredBadges.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No badges found.</div>
            ) : (
              <div className="p-4 grid grid-cols-2 gap-4">
                {filteredBadges.map(badge => (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`text-center p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-3 border ${
                      selectedBadge?.id === badge.id 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-card border-primary/20 hover:border-primary/40 text-foreground hover:bg-primary/5'
                    }`}
                  >
                    <Hexagon className={`w-10 h-10 ${selectedBadge?.id === badge.id ? 'fill-primary/20' : 'fill-primary/5 text-primary/40'}`} strokeWidth={1.5} />
                    <p className="font-bold text-xs line-clamp-2">{badge.title}</p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-2xl border border-primary/40 bg-card shadow-none overflow-hidden relative">
          {selectedBadge ? (
            <>
              <div className="h-48 bg-primary/10 relative shrink-0 flex items-center justify-center overflow-hidden border-b border-primary/10">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative">
                    <Hexagon className="w-32 h-32 text-primary fill-primary/20" strokeWidth={1} />
                    <Medal className="w-12 h-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">{selectedBadge.title}</h2>
                    <p className="text-muted-foreground max-w-lg mx-auto mt-2">{selectedBadge.data?.description || 'A recognized micro-credential validating specific technical or soft skills.'}</p>
                    <div className="flex justify-center gap-3 mt-4">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none">{selectedBadge.data?.category || 'Technical Skill'}</Badge>
                      <Badge variant="outline" className="border-primary/40 text-primary shadow-none">{selectedBadge.data?.points || 0} Points</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Criteria for Awarding</h3>
                      <ul className="space-y-3">
                        {selectedBadge.data?.criteria?.length > 0 ? (
                          selectedBadge.data.criteria.map((criterion, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-900 dark:text-white font-medium">
                              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{criterion}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-muted-foreground italic">No specific criteria defined.</li>
                        )}
                      </ul>
                    </div>

                    <div className="p-6 rounded-2xl bg-card border border-primary/20 flex flex-col items-center justify-center text-center">
                      <Shield className="w-12 h-12 text-primary/40 mb-3" />
                      <h3 className="font-bold text-slate-900 dark:text-white">Recipients</h3>
                      <p className="text-4xl font-black text-primary my-2">{selectedBadge.data?.recipient_count || 0}</p>
                      <p className="text-xs text-muted-foreground mb-4">Students have earned this badge</p>
                      <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/5 rounded-xl shadow-none">View Recipients</Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Medal className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Badge Selected</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Select a skill badge to view its criteria and student recipients.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
