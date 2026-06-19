import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Layers, PlayCircle, Target, CheckSquare, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

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
      } else if (selectedModule) {
        const updated = records.find(r => r.id === selectedModule.id);
        if (updated) setSelectedModule(updated);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      toast.error('Failed to load modules');
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
          tasks: [],
          competencies: []
        }
      }, user?.company_id);
      toast.success('Module created successfully');
      setIsDialogOpen(false);
      setNewModule({ title: '', courseId: '', durationHours: '', difficulty: 'Beginner' });
      fetchModules();
      setSelectedModule(created);
    } catch (error) {
      console.error('Failed to create module:', error);
      toast.error('Failed to create module');
    }
  };

  const filteredModules = modules.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('practical_modules', 'Practical Modules')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('manage_modules_desc', 'Manage hands-on practical training modules and skill requirements.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('add_module', 'Add Module')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('add_new_module', 'Add New Module')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('module_name', 'Module Name')}</Label>
                <Input id="title" placeholder="e.g. Arc Welding Basics" value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseId">{t('course_assoc', 'Course Association')}</Label>
                <Input id="courseId" placeholder="e.g. WLD-101" value={newModule.courseId} onChange={e => setNewModule({...newModule, courseId: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationHours">{t('duration_hours', 'Duration (Hours)')}</Label>
                <Input id="durationHours" type="number" placeholder="e.g. 15" value={newModule.durationHours} onChange={e => setNewModule({...newModule, durationHours: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">{t('difficulty', 'Difficulty Level')}</Label>
                <Input id="difficulty" placeholder="e.g. Beginner, Intermediate" value={newModule.difficulty} onChange={e => setNewModule({...newModule, difficulty: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateModule} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save_module', 'Save Module')}</Button>
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
                placeholder="Search modules..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading modules...</div>
            ) : filteredModules.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No modules found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredModules.map(module => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedModule?.id === module.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedModule?.id === module.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate">{module.title}</p>
                      <p className={`text-xs truncate ${selectedModule?.id === module.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
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
        <Card className="flex-1 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {selectedModule ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 flex items-center px-8 border-b border-primary/10">
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                    <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <Layers className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedModule.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm font-medium text-[#71717a] dark:text-gray-400">
                        <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">
                          {selectedModule.data?.difficulty || 'Beginner'}
                        </Badge>
                        <span>•</span>
                        <span>{selectedModule.data?.courseId || 'Unassigned Course'}</span>
                        <span>•</span>
                        <span>{selectedModule.data?.durationHours || 0} Hours</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl border-primary/40 text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:bg-primary/5">
                      <Settings className="w-4 h-4 mr-2" /> Edit Module
                    </Button>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" /> Required Competencies
                      </h3>
                      {(!selectedModule.data?.competencies || selectedModule.data.competencies.length === 0) ? (
                        <p className="text-sm text-[#71717a] dark:text-gray-400">No competencies defined.</p>
                      ) : (
                        <ul className="space-y-2">
                          {selectedModule.data.competencies.map((comp, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckSquare className="w-4 h-4 text-primary" /> {comp}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl border-primary/40 border-dashed text-[#71717a] dark:text-gray-400">
                        + Add Competency
                      </Button>
                    </div>

                    <div className="p-6 rounded-2xl bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-primary" /> Practical Tasks
                      </h3>
                      {(!selectedModule.data?.tasks || selectedModule.data.tasks.length === 0) ? (
                        <p className="text-sm text-[#71717a] dark:text-gray-400">No practical tasks defined.</p>
                      ) : (
                        <ul className="space-y-3">
                          {selectedModule.data.tasks.map((task, idx) => (
                            <li key={idx} className="p-3 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-xl text-sm font-medium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                              {task}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl border-primary/40 border-dashed text-[#71717a] dark:text-gray-400">
                        + Add Task
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#71717a] dark:text-gray-400">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Layers className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Module Selected</h3>
              <p className="max-w-sm mt-2">
                Select a practical module from the list to view details or add a new one.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
