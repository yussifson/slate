import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Layers, PlayCircle, Target, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function VPracticalModules() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newModule, setNewModule] = useState({ title: '', courseId: '', durationHours: '', difficulty: 'Beginner' });
  const [selectedModule, setSelectedModule] = useState(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_module', user?.company_id);
      setModules(records);
      if (records.length > 0 && !selectedModule) {
        setSelectedModule(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchModules();
    }
  }, [user]);

  const handleCreateModule = async () => {
    if (!newModule.title) return;
    try {
      const created = await base44.createEntity('voc_module', {
        title: newModule.title,
        data: {
          courseId: newModule.courseId,
          durationHours: newModule.durationHours,
          difficulty: newModule.difficulty,
        }
      }, user?.company_id);
      setModules([...modules, created]);
      setIsDialogOpen(false);
      setNewModule({ title: '', courseId: '', durationHours: '', difficulty: 'Beginner' });
      setSelectedModule(created);
    } catch (error) {
      console.error('Failed to create module:', error);
    }
  };

  const filteredModules = modules.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-rose-600 via-primary to-slate-900 bg-clip-text text-transparent">
            Practical Modules
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage hands-on practical training modules and skill requirements.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-200 dark:shadow-none">
              <Plus className="w-4 h-4 mr-2" /> Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Module</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Module Name</Label>
                <Input id="title" placeholder="e.g. Arc Welding Basics" value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseId">Course Association (ID or Code)</Label>
                <Input id="courseId" placeholder="e.g. WLD-101" value={newModule.courseId} onChange={e => setNewModule({...newModule, courseId: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationHours">Duration (Hours)</Label>
                <Input id="durationHours" type="number" placeholder="e.g. 15" value={newModule.durationHours} onChange={e => setNewModule({...newModule, durationHours: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Input id="difficulty" placeholder="e.g. Beginner, Intermediate, Advanced" value={newModule.difficulty} onChange={e => setNewModule({...newModule, difficulty: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateModule} className="bg-rose-600 hover:bg-rose-700 rounded-xl">Save Module</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-rose-100/50">
          <div className="p-4 border-b border-rose-50 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
              <Input 
                placeholder="Search modules..." 
                className="pl-9 h-10 bg-rose-50/50 dark:bg-slate-800/50 border-rose-100 dark:border-slate-700 rounded-xl focus-visible:ring-rose-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-rose-300 text-sm">Loading modules...</div>
            ) : filteredModules.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No modules found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredModules.map(module => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedModule?.id === module.id 
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                        : 'hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedModule?.id === module.id ? 'bg-white/20' : 'bg-rose-100 dark:bg-slate-800 text-rose-600'
                    }`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{module.title}</p>
                      <p className={`text-xs truncate ${selectedModule?.id === module.id ? 'text-rose-200' : 'text-slate-500'}`}>
                        {module.data?.courseId || 'No Course'} • {module.data?.durationHours || '0'} Hrs
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-rose-100/50 overflow-hidden relative">
          {selectedModule ? (
            <>
              <div className="h-32 bg-gradient-to-r from-rose-500 to-primary relative shrink-0 flex items-center px-8">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-xl shrink-0">
                    <div className="w-full h-full rounded-xl bg-rose-50 dark:bg-slate-800 flex items-center justify-center text-rose-600">
                      <Layers className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedModule.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:bg-slate-800 dark:text-rose-400">
                          {selectedModule.data?.difficulty || 'Beginner'}
                        </Badge>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <PlayCircle className="w-4 h-4 text-slate-400" /> {selectedModule.data?.durationHours ? `${selectedModule.data.durationHours} Hours` : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-rose-50/30 dark:bg-slate-800/30 border-rose-100 dark:border-slate-700 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-rose-500" /> Objectives
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">
                          Students will demonstrate practical mastery of the topics covered in the associated course ({selectedModule.data?.courseId || 'Unspecified'}). Focus on hands-on application, safety protocols, and industry standards.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-primary/30 dark:bg-slate-800/30 border-primary/10 dark:border-slate-700 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-primary" /> Assessment Criteria
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/70"></div> Safety Compliance (30%)</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/70"></div> Technique & Execution (40%)</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/70"></div> Final Output Quality (30%)</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Layers className="w-10 h-10 text-rose-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Module Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                Select a module from the list to view requirements or add a new practical module.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
