import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Briefcase, Users, FileText, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VTrades() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTrade, setNewTrade] = useState({ title: '', industry: '', duration: '', description: '' });
  const [editTrade, setEditTrade] = useState(null);
  
  const [selectedTrade, setSelectedTrade] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tradeRecords, traineeRecords] = await Promise.all([
        base44.getEntities('voc_trade', user?.company_id),
        base44.getEntities('voc_trainee', user?.company_id)
      ]);
      setTrades(tradeRecords);
      setTrainees(traineeRecords);
      if (tradeRecords.length > 0 && !selectedTrade) {
        setSelectedTrade(tradeRecords[0]);
      } else if (selectedTrade) {
        // refresh selected
        const updated = tradeRecords.find(t => t.id === selectedTrade.id);
        if (updated) setSelectedTrade(updated);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) fetchData();
  }, [user]);

  const handleCreateTrade = async () => {
    if (!newTrade.title) return;
    try {
      const created = await base44.createEntity('voc_trade', {
        title: newTrade.title,
        data: {
          industry: newTrade.industry,
          duration: newTrade.duration,
          description: newTrade.description,
        }
      }, user?.company_id);
      toast.success('Trade created successfully');
      setIsDialogOpen(false);
      setNewTrade({ title: '', industry: '', duration: '', description: '' });
      fetchData();
      setSelectedTrade(created);
    } catch (error) {
      console.error('Failed to create trade:', error);
      toast.error('Failed to create trade');
    }
  };

  const handleUpdateTrade = async () => {
    if (!editTrade || !editTrade.title) return;
    try {
      await base44.updateEntity('voc_trade', editTrade.id, {
        title: editTrade.title,
        data: {
          industry: editTrade.data?.industry,
          duration: editTrade.data?.duration,
          description: editTrade.data?.description,
        }
      }, user?.company_id);
      toast.success('Trade updated successfully');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update trade:', error);
      toast.error('Failed to update trade');
    }
  };

  const filteredTrades = trades.filter(t => 
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats for selected trade
  const tradeTrainees = selectedTrade ? trainees.filter(t => t.data?.trade === selectedTrade.title) : [];
  const activeCount = tradeTrainees.filter(t => t.status !== 'Graduated').length;
  const gradCount = tradeTrainees.filter(t => t.status === 'Graduated').length;

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('vocational_trades', 'Vocational Trades')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('manage_trades_desc', 'Manage offered vocational trades, industries, and program lengths.')}
          </p>
        </div>
        
        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('add_trade', 'Add Trade')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
            <DialogHeader>
              <DialogTitle>{t('add_new_trade', 'Add New Trade')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('trade_name', 'Trade Name')}</Label>
                <Input id="title" placeholder="e.g. Carpentry" value={newTrade.title} onChange={e => setNewTrade({...newTrade, title: e.target.value})} className="rounded-xl border-primary/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">{t('industry', 'Industry')}</Label>
                <Input id="industry" placeholder="e.g. Construction" value={newTrade.industry} onChange={e => setNewTrade({...newTrade, industry: e.target.value})} className="rounded-xl border-primary/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{t('duration_months', 'Duration (Months)')}</Label>
                <Input id="duration" placeholder="e.g. 12" value={newTrade.duration} onChange={e => setNewTrade({...newTrade, duration: e.target.value})} className="rounded-xl border-primary/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('description', 'Description')}</Label>
                <Input id="description" placeholder="Short description" value={newTrade.description} onChange={e => setNewTrade({...newTrade, description: e.target.value})} className="rounded-xl border-primary/40" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTrade} className="bg-primary hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Save Trade')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel: Trade List */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
              <Input 
                placeholder="Search trades..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading trades...</div>
            ) : filteredTrades.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No trades found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredTrades.map(trade => (
                  <button
                    key={trade.id}
                    onClick={() => setSelectedTrade(trade)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedTrade?.id === trade.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedTrade?.id === trade.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate">{trade.title}</p>
                      <p className={`text-xs truncate ${selectedTrade?.id === trade.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {trade.data?.industry || 'General'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel: Trade Details */}
        <Card className="flex-1 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {selectedTrade ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 flex items-center px-8 border-b border-primary/10">
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <Briefcase className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedTrade.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm font-medium text-[#71717a] dark:text-gray-400">
                        <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">
                          {selectedTrade.data?.industry || 'General Industry'}
                        </Badge>
                        <span>•</span>
                        <span>{selectedTrade.data?.duration ? `${selectedTrade.data.duration} Months` : 'Duration TBD'}</span>
                      </div>
                    </div>
                    
                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl border-primary/40 text-primary hover:bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" onClick={() => setEditTrade({...selectedTrade})}>
                          <Settings className="w-4 h-4 mr-2" /> {t('edit_trade', 'Edit Trade')}
                        </Button>
                      </DialogTrigger>
                      {editTrade && (
                        <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
                          <DialogHeader>
                            <DialogTitle>{t('edit_trade', 'Edit Trade')}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-title">{t('trade_name', 'Trade Name')}</Label>
                              <Input id="edit-title" value={editTrade.title} onChange={e => setEditTrade({...editTrade, title: e.target.value})} className="rounded-xl border-primary/40" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-industry">{t('industry', 'Industry')}</Label>
                              <Input id="edit-industry" value={editTrade.data?.industry || ''} onChange={e => setEditTrade({...editTrade, data: {...editTrade.data, industry: e.target.value}})} className="rounded-xl border-primary/40" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-duration">{t('duration_months', 'Duration (Months)')}</Label>
                              <Input id="edit-duration" value={editTrade.data?.duration || ''} onChange={e => setEditTrade({...editTrade, data: {...editTrade.data, duration: e.target.value}})} className="rounded-xl border-primary/40" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">{t('description', 'Description')}</Label>
                              <Input id="edit-description" value={editTrade.data?.description || ''} onChange={e => setEditTrade({...editTrade, data: {...editTrade.data, description: e.target.value}})} className="rounded-xl border-primary/40" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleUpdateTrade} className="bg-primary hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save_changes', 'Save Changes')}</Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> {t('description', 'Description')}
                      </h3>
                      <p className="text-[#71717a] dark:text-gray-400 text-sm leading-relaxed">
                        {selectedTrade.data?.description || 'No description provided for this trade.'}
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> {t('trainee_stats', 'Trainee Stats')}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                          <span className="text-[#71717a] dark:text-gray-400 text-sm">{t('active_trainees', 'Active Trainees')}</span>
                          <span className="font-semibold">{activeCount}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                          <span className="text-[#71717a] dark:text-gray-400 text-sm">{t('graduates', 'Graduates')}</span>
                          <span className="font-semibold text-primary">{gradCount}</span>
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
                <Briefcase className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold">{t('no_trade_selected', 'No Trade Selected')}</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                {t('no_trade_selected_desc', 'Select a trade from the list to view details or add a new one.')}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
