import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Wrench, MapPin, Users, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function VWorkshops() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkshop, setNewWorkshop] = useState({ title: '', location: '', capacity: '', status: 'Active' });
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  const fetchWorkshops = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_workshop', user?.company_id);
      setWorkshops(records);
      if (records.length > 0 && !selectedWorkshop) {
        setSelectedWorkshop(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch workshops:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchWorkshops();
    }
  }, [user]);

  const handleCreateWorkshop = async () => {
    if (!newWorkshop.title) return;
    try {
      const created = await base44.createEntity('voc_workshop', {
        title: newWorkshop.title,
        data: {
          location: newWorkshop.location,
          capacity: newWorkshop.capacity,
          status: newWorkshop.status,
        }
      }, user?.company_id);
      setWorkshops([...workshops, created]);
      setIsDialogOpen(false);
      setNewWorkshop({ title: '', location: '', capacity: '', status: 'Active' });
      setSelectedWorkshop(created);
    } catch (error) {
      console.error('Failed to create workshop:', error);
    }
  };

  const filteredWorkshops = workshops.filter(w => 
    w.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.data?.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-amber-600 via-orange-600 to-slate-900 bg-clip-text text-transparent">
            Workshop & Facility Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage training facilities, capacities, and workshop status.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-200 dark:shadow-none">
              <Plus className="w-4 h-4 mr-2" /> Add Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Facility</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Facility Name</Label>
                <Input id="title" placeholder="e.g. Main Welding Shop" value={newWorkshop.title} onChange={e => setNewWorkshop({...newWorkshop, title: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location / Building</Label>
                <Input id="location" placeholder="e.g. Block C" value={newWorkshop.location} onChange={e => setNewWorkshop({...newWorkshop, location: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input id="capacity" type="number" placeholder="e.g. 30" value={newWorkshop.capacity} onChange={e => setNewWorkshop({...newWorkshop, capacity: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" placeholder="e.g. Active, Under Maintenance" value={newWorkshop.status} onChange={e => setNewWorkshop({...newWorkshop, status: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateWorkshop} className="bg-amber-600 hover:bg-amber-700 rounded-xl">Save Facility</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100/50">
          <div className="p-4 border-b border-amber-50 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
              <Input 
                placeholder="Search facilities..." 
                className="pl-9 h-10 bg-amber-50/50 dark:bg-slate-800/50 border-amber-100 dark:border-slate-700 rounded-xl focus-visible:ring-amber-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-amber-300 text-sm">Loading facilities...</div>
            ) : filteredWorkshops.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No facilities found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredWorkshops.map(workshop => (
                  <button
                    key={workshop.id}
                    onClick={() => setSelectedWorkshop(workshop)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedWorkshop?.id === workshop.id 
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                        : 'hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedWorkshop?.id === workshop.id ? 'bg-white/20' : 'bg-amber-100 dark:bg-slate-800 text-amber-600'
                    }`}>
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{workshop.title}</p>
                      <p className={`text-xs truncate flex items-center gap-1 ${selectedWorkshop?.id === workshop.id ? 'text-amber-200' : 'text-slate-500'}`}>
                        <MapPin className="w-3 h-3" /> {workshop.data?.location || 'Unknown'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100/50 overflow-hidden relative">
          {selectedWorkshop ? (
            <>
              <div className="h-32 bg-gradient-to-r from-amber-500 to-orange-600 relative shrink-0 flex items-center px-8">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-xl shrink-0">
                    <div className="w-full h-full rounded-xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-amber-600">
                      <Wrench className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedWorkshop.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <Badge variant="outline" className={`border-amber-200 bg-amber-50 text-amber-700 dark:bg-slate-800 dark:text-amber-400`}>
                          {selectedWorkshop.data?.status || 'Active'}
                        </Badge>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" /> {selectedWorkshop.data?.location || 'No Location Set'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-slate-800/50 border border-amber-100 dark:border-slate-700 flex items-center gap-4">
                      <div className="p-4 bg-amber-100 dark:bg-slate-700 text-amber-600 rounded-xl">
                        <Users className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Max Capacity</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{selectedWorkshop.data?.capacity || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-orange-50/50 dark:bg-slate-800/50 border border-orange-100 dark:border-slate-700 flex items-center gap-4">
                      <div className="p-4 bg-orange-100 dark:bg-slate-700 text-orange-600 rounded-xl">
                        <Activity className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Status</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{selectedWorkshop.data?.status || 'Active'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Wrench className="w-10 h-10 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Facility Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                Select a workshop/facility from the list to view its details or add a new one.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
