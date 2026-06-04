import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Book, GraduationCap, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSProgrammes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProgramme, setNewProgramme] = useState({
    name: '',
    code: '',
    department: '',
    description: ''
  });

  const fetchProgrammes = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_programme', user?.company_id);
      setProgrammes(records);
    } catch (error) {
      console.error('Failed to fetch programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchProgrammes();
    }
  }, [user]);

  const handleAddProgramme = async () => {
    try {
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_programme',
        title: newProgramme.name,
        case_number: newProgramme.code || `PRG-${Math.floor(Math.random() * 1000)}`,
        status: 'Active',
        data: newProgramme
      };
      
      await base44.createEntity(payload);
      setIsAddModalOpen(false);
      setNewProgramme({ name: '', code: '', department: '', description: '' });
      fetchProgrammes();
    } catch (error) {
      console.error('Failed to add programme:', error);
    }
  };

  const filteredProgrammes = programmes.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            Academic Programmes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage course tracks like General Science, Visual Arts, and Business.
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white shadow-md shadow-purple-500/20">
          <Plus className="w-4 h-4" /> Create Programme
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400">Loading programmes...</div>
        ) : filteredProgrammes.length === 0 ? (
          <div className="col-span-full p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 mx-auto flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No programmes defined</h3>
            <p className="text-sm text-slate-500">Create academic programmes to structure your school's offerings.</p>
          </div>
        ) : (
          filteredProgrammes.map(prog => (
            <Card key={prog.id} className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 hover:shadow-md hover:ring-[#6F00FF]/30 transition-all group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#6F00FF] to-purple-400"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6F00FF] group-hover:scale-110 transition-transform">
                    <Book className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {prog.status}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-1 line-clamp-1">{prog.title}</h3>
                <p className="text-sm font-semibold text-slate-500 mb-4">{prog.case_number}</p>
                
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 font-medium truncate">{prog.data?.department || 'General Department'}</span>
                  </div>
                </div>
                
                <p className="mt-4 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {prog.data?.description || 'No description provided.'}
                </p>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="text-[#6F00FF] hover:bg-purple-50 font-semibold w-full">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-[#6F00FF] to-purple-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Add Programme</DialogTitle>
              <DialogDescription className="text-purple-100">
                Define a new academic track for the school.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Programme Name</label>
              <Input 
                placeholder="e.g. General Science"
                className="bg-white border-slate-200 rounded-xl"
                value={newProgramme.name}
                onChange={e => setNewProgramme({...newProgramme, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Code</label>
                <Input 
                  placeholder="e.g. SCI"
                  className="bg-white border-slate-200 rounded-xl"
                  value={newProgramme.code}
                  onChange={e => setNewProgramme({...newProgramme, code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Department</label>
                <Input 
                  placeholder="e.g. Sciences"
                  className="bg-white border-slate-200 rounded-xl"
                  value={newProgramme.department}
                  onChange={e => setNewProgramme({...newProgramme, department: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
              <textarea 
                className="w-full h-24 rounded-xl border border-slate-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF] resize-none text-sm"
                placeholder="Brief description of this programme..."
                value={newProgramme.description}
                onChange={e => setNewProgramme({...newProgramme, description: e.target.value})}
              />
            </div>
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600">
              Cancel
            </Button>
            <Button 
              onClick={handleAddProgramme} 
              disabled={!newProgramme.name}
              className="rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white font-bold"
            >
              Save Programme
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
