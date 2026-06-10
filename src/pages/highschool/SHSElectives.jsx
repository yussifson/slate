import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ListPlus, FolderTree } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SHSElectives() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [electives, setElectives] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newElective, setNewElective] = useState({
    name: '',
    programmeId: '',
    subjectIds: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [electiveData, subData, progData] = await Promise.all([
        base44.getEntities('shs_elective_group', user?.company_id),
        base44.getEntities('shs_subject', user?.company_id),
        base44.getEntities('shs_programme', user?.company_id)
      ]);
      setElectives(electiveData);
      setSubjects(subData.filter(s => s.data?.type === 'Elective'));
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

  const handleToggleSubject = (subjectId) => {
    setNewElective(prev => {
      const isSelected = prev.subjectIds.includes(subjectId);
      if (isSelected) {
        return { ...prev, subjectIds: prev.subjectIds.filter(id => id !== subjectId) };
      } else {
        return { ...prev, subjectIds: [...prev.subjectIds, subjectId] };
      }
    });
  };

  const handleAddElectiveGroup = async () => {
    try {
      const prog = programmes.find(p => p.id === newElective.programmeId);
      const selectedSubObjs = subjects.filter(s => newElective.subjectIds.includes(s.id));
      
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_elective_group',
        title: newElective.name,
        case_number: `EGRP-${Math.floor(Math.random() * 1000)}`,
        status: 'Active',
        data: {
          programmeId: newElective.programmeId,
          programmeName: prog?.title,
          subjects: selectedSubObjs.map(s => ({ id: s.id, name: s.title }))
        }
      };
      
      await base44.createEntity(payload);
      setIsAddModalOpen(false);
      setNewElective({ name: '', programmeId: '', subjectIds: [] });
      fetchData();
    } catch (error) {
      console.error('Failed to add elective group:', error);
    }
  };

  const filteredElectives = electives.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.programmeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
            Elective Subject Groups
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Bundle elective subjects together for specific academic programmes.
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Create Group
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Elective Packages</CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
              <Input 
                placeholder="Search groups..." 
                className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading elective groups...</div>
          ) : filteredElectives.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <FolderTree className="w-8 h-8 text-primary dark:text-primary" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No groups defined</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Create subject packages that students can select.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredElectives.map(group => (
                <div key={group.id} className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900/40 dark:bg-slate-900 hover:border-primary dark:border-primary/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70">
                        <ListPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary dark:text-primary/70 transition-colors">{group.title}</h4>
                        <p className="text-xs font-semibold text-primary dark:text-primary/70 uppercase tracking-wider">{group.data?.programmeName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4 text-sm">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Included Subjects ({group.data?.subjects?.length || 0})</p>
                    <div className="flex flex-wrap gap-2">
                      {group.data?.subjects?.map((sub, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-200 border-none font-medium">
                          {sub.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Add Elective Group</DialogTitle>
              <DialogDescription className="text-primary/10 dark:text-primary/70">
                Bundle subjects together into a selectable package.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Group Name</label>
                <Input 
                  placeholder="e.g. Science Package A"
                  className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={newElective.name}
                  onChange={e => setNewElective({...newElective, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Target Programme</label>
                <select 
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
                  value={newElective.programmeId}
                  onChange={e => setNewElective({...newElective, programmeId: e.target.value})}
                >
                  <option value="">Select Programme...</option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Select Subjects</label>
                {subjects.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No elective subjects found. Create them in the Subjects menu first.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map(sub => {
                      const isSelected = newElective.subjectIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleToggleSubject(sub.id)}
                          className={`p-3 rounded-xl text-sm font-medium text-left transition-all border ${
                            isSelected 
                              ? 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-primary/20 dark:border-slate-600 text-primary dark:text-primary/70' 
                              : 'bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/20 dark:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate pr-2">{sub.title}</span>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary dark:bg-primary shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleAddElectiveGroup} 
              disabled={!newElective.name || !newElective.programmeId || newElective.subjectIds.length === 0}
              className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold"
            >
              Save Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
