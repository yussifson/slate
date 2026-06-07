import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Layers, GitMerge } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSStreams() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [streams, setStreams] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStream, setNewStream] = useState({
    name: '',
    programmeId: '',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [streamData, progData] = await Promise.all([
        base44.getEntities('shs_stream', user?.company_id),
        base44.getEntities('shs_programme', user?.company_id)
      ]);
      setStreams(streamData);
      setProgrammes(progData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchData();
    }
  }, [user]);

  const handleAddStream = async () => {
    try {
      const selectedProg = programmes.find(p => p.id === newStream.programmeId);
      
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_stream',
        title: newStream.name,
        case_number: `STRM-${Math.floor(Math.random() * 1000)}`,
        status: 'Active',
        data: {
          ...newStream,
          programmeName: selectedProg?.title || 'General'
        }
      };
      
      await base44.createEntity(payload);
      setIsAddModalOpen(false);
      setNewStream({ name: '', programmeId: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to add stream:', error);
    }
  };

  const filteredStreams = streams.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.data?.programmeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
            Academic Streams
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage class divisions and specialized sub-tracks (e.g. Science A, Arts B).
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Create Stream
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 dark:text-slate-500">Loading streams...</div>
        ) : filteredStreams.length === 0 ? (
          <div className="col-span-full p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
              <GitMerge className="w-8 h-8 text-emerald-500 dark:text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No streams defined</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Create streams to organize classes within programmes.</p>
          </div>
        ) : (
          filteredStreams.map(strm => (
            <Card key={strm.id} className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 hover:shadow-md hover:ring-emerald-600/30 dark:hover:ring-emerald-500/30 transition-all group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {strm.status}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{strm.title}</h3>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">{strm.data?.programmeName}</p>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[32px]">
                  {strm.data?.description || 'No description provided.'}
                </p>
                
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:bg-slate-800 font-semibold w-full">
                    View Classes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Add Stream</DialogTitle>
              <DialogDescription className="text-emerald-100 dark:text-emerald-900">
                Define a new class division under a programme.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Stream Name</label>
              <Input 
                placeholder="e.g. Science A"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                value={newStream.name}
                onChange={e => setNewStream({...newStream, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Parent Programme</label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500"
                value={newStream.programmeId}
                onChange={e => setNewStream({...newStream, programmeId: e.target.value})}
              >
                <option value="">Select Programme...</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Description</label>
              <textarea 
                className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 resize-none text-sm"
                placeholder="Brief description..."
                value={newStream.description}
                onChange={e => setNewStream({...newStream, description: e.target.value})}
              />
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleAddStream} 
              disabled={!newStream.name || !newStream.programmeId}
              className="rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold"
            >
              Save Stream
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
