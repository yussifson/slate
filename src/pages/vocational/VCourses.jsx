import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Filter, BookOpen, Wrench, X, Save, Eye, Settings, Briefcase, GraduationCap, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

export default function VCourses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [view, setView] = useState('catalog'); // 'catalog' or 'builder'
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', category: '', duration: '', capacity: '' });

  // Builder State
  const [builderData, setBuilderData] = useState({});

  const fetchCourses = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const data = await base44.getEntities('voc_course', user.company_id);
      setCourses(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const categories = ['All', 'Electrical', 'Mechanical', 'Construction', 'ICT', 'Automotive', 'Hospitality', 'Agriculture'];
  const statuses = ['All', 'Active', 'Draft', 'Archived'];

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    const match = !q || (c.title || '').toLowerCase().includes(q);
    const cat = filterCategory === 'All' || (c.data?.category || '').toLowerCase().includes(filterCategory.toLowerCase());
    const stat = filterStatus === 'All' || (c.status || 'Active') === filterStatus;
    return match && cat && stat;
  });

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.category) {
      toast.error('Title and Category are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_course', {
        title: newCourse.title,
        status: 'Draft',
        data: {
          category: newCourse.category,
          duration: newCourse.duration || '12 Months',
          capacity: parseInt(newCourse.capacity) || 50,
          enrolled: 0,
          modules: 0,
          assessments: 0,
          competencies: 0,
          nqf_level: 'NQF Level 3'
        }
      }, user.company_id);
      toast.success('Program created successfully');
      setIsCreateOpen(false);
      setNewCourse({ title: '', category: '', duration: '', capacity: '' });
      fetchCourses();
      openBuilder(created);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create program');
    }
  };

  const handleSaveBuilder = async () => {
    if (!selectedCourse) return;
    try {
      await base44.updateEntity('voc_course', selectedCourse.id, {
        title: builderData.title,
        data: {
          ...selectedCourse.data,
          category: builderData.category,
          duration: builderData.duration,
          capacity: builderData.capacity,
          nqf_level: builderData.nqf_level
        }
      }, user.company_id);
      toast.success('Program saved successfully');
      fetchCourses();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save program');
    }
  };

  const openBuilder = (course) => {
    setSelectedCourse(course);
    setBuilderData({
      title: course.title || '',
      category: course.data?.category || '',
      duration: course.data?.duration || '',
      capacity: course.data?.capacity || '',
      nqf_level: course.data?.nqf_level || ''
    });
    setView('builder');
  };

  const ProgramCard = ({ course }) => {
    const enrolled = course.data?.enrolled || 0;
    const capacity = course.data?.capacity || 0;
    const pct = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
    const modules = course.data?.modules || 0;
    const assessments = course.data?.assessments || 0;
    const competencies = course.data?.competencies || 0;
    const duration = course.data?.duration || 'Unknown';
    const level = course.data?.nqf_level || 'No Level';
    const status = course.status || 'Active';
    const cat = course.data?.category || 'General';

    return (
      <Card 
        className="rounded-2xl border border-primary/40 bg-card shadow-none hover:bg-primary/5 transition-colors cursor-pointer overflow-hidden"
        onClick={() => openBuilder(course)}
      >
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white truncate">{course.title || 'Untitled Program'}</h3>
                <p className="text-xs text-muted-foreground">{level} • {duration}</p>
              </div>
            </div>
            <Badge variant="outline" className={`rounded-xl border-primary/40 ${status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
              {status}
            </Badge>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-muted-foreground">Capacity ({pct}%)</span>
              <span className="text-primary">{enrolled}/{capacity}</span>
            </div>
            <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-3 border-t border-b border-primary/10">
            <div>
              <div className="font-bold text-lg">{modules}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Modules</div>
            </div>
            <div>
              <div className="font-bold text-lg">{assessments}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Assessments</div>
            </div>
            <div>
              <div className="font-bold text-lg">{competencies}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Competencies</div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> {cat}</span>
            <span>Cohorts: {course.data?.cohorts || 0}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {view === 'catalog' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('training_programs', 'Training Programs')}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm font-medium">
                {courses.length} programs • {courses.filter(c => c.status === 'Active' || !c.status).length} active
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-none">
                <Plus className="w-4 h-4 mr-2" /> {t('create_program', 'Create Program')}
              </Button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Left Filter Panel */}
            <div className="w-[220px] shrink-0 space-y-4 hidden lg:block">
              <Card className="rounded-2xl border border-primary/40 bg-card shadow-none">
                <CardHeader className="pb-3 border-b border-primary/10 p-4">
                  <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <div className="p-2 space-y-1">
                  {statuses.map(s => (
                    <Button 
                      key={s} variant={filterStatus === s ? 'secondary' : 'ghost'} 
                      onClick={() => setFilterStatus(s)}
                      className={`w-full justify-start text-sm shadow-none rounded-xl ${filterStatus === s ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-primary/5'}`}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </Card>
              <Card className="rounded-2xl border border-primary/40 bg-card shadow-none">
                <CardHeader className="pb-3 border-b border-primary/10 p-4">
                  <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Category</CardTitle>
                </CardHeader>
                <div className="p-2 space-y-1">
                  {categories.map(c => (
                    <Button 
                      key={c} variant={filterCategory === c ? 'secondary' : 'ghost'} 
                      onClick={() => setFilterCategory(c)}
                      className={`w-full justify-start text-sm shadow-none rounded-xl ${filterCategory === c ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-primary/5'}`}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={search} onChange={e => setSearch(e.target.value)} 
                  placeholder="Search programs..."
                  className="pl-9 rounded-xl border-primary/40 shadow-none focus-visible:ring-primary" 
                />
              </div>

              {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading programs...</div>
              ) : filtered.length === 0 ? (
                <Card className="rounded-2xl border border-primary/40 bg-card shadow-none">
                  <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p>No programs found.</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(c => <ProgramCard key={c.id} course={c} />)}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* PROGRAM BUILDER VIEW */}
      {view === 'builder' && selectedCourse && (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-card border border-primary/40 rounded-2xl overflow-hidden shadow-none">
          {/* Builder Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setView('catalog')} className="text-muted-foreground hover:text-primary rounded-xl">
                <X className="w-4 h-4 mr-1" /> Exit
              </Button>
              <div className="w-px h-5 bg-primary/20" />
              <span className="font-bold text-lg text-slate-900 dark:text-white">{selectedCourse.title}</span>
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">{selectedCourse.status || 'Draft'}</Badge>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveBuilder} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-none">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>

          {/* 3-panel layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Panel 1: Structure */}
            <div className="w-[300px] border-r border-primary/10 flex flex-col bg-primary/5">
              <div className="p-4 font-bold uppercase tracking-wider text-xs text-muted-foreground border-b border-primary/10">Program Structure</div>
              <div className="flex-1 overflow-auto p-4 space-y-2">
                <div className="p-3 bg-card border border-primary/20 rounded-xl text-sm font-medium flex items-center justify-between">
                  <span>Phase 1: Foundation</span>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="pl-4 space-y-2">
                  <div className="p-2 border border-primary/40 bg-card rounded-lg text-sm text-primary flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Theory Module
                  </div>
                  <div className="p-2 border border-transparent hover:border-primary/20 bg-card rounded-lg text-sm text-muted-foreground flex items-center gap-2 cursor-pointer transition-colors">
                    <Wrench className="w-4 h-4" /> Practical Lab
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl border-primary/40 border-dashed text-muted-foreground">
                  + Add Phase
                </Button>
              </div>
            </div>

            {/* Panel 2: Editor */}
            <div className="flex-1 flex flex-col bg-card">
              <div className="p-4 font-bold uppercase tracking-wider text-xs text-muted-foreground border-b border-primary/10">Content Editor</div>
              <div className="flex-1 overflow-auto p-8 max-w-3xl mx-auto w-full space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Program Title</label>
                  <Input 
                    value={builderData.title} 
                    onChange={e => setBuilderData({...builderData, title: e.target.value})} 
                    className="text-lg font-bold rounded-xl border-primary/40 shadow-none h-12" 
                  />
                </div>
                <div className="space-y-4">
                  <div className="p-6 border border-primary/20 rounded-2xl bg-primary/5">
                    <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5" /> Module Details (Demo)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">Select a module from the structure panel to edit its specific contents, competencies, and learning outcomes here.</p>
                    <Input disabled placeholder="Module Title..." className="rounded-xl border-primary/40 bg-card shadow-none mb-4" />
                    <textarea disabled placeholder="Module Description..." className="w-full h-32 p-3 rounded-xl border border-primary/40 bg-card shadow-none resize-none text-sm"></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: Settings */}
            <div className="w-[300px] border-l border-primary/10 flex flex-col bg-primary/5">
              <div className="p-4 font-bold uppercase tracking-wider text-xs text-muted-foreground border-b border-primary/10">Program Settings</div>
              <div className="flex-1 overflow-auto p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={builderData.category} onValueChange={v => setBuilderData({...builderData, category: v})}>
                    <SelectTrigger className="rounded-xl border-primary/40 shadow-none bg-card">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== 'All').map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">NQF Level</label>
                  <Select value={builderData.nqf_level} onValueChange={v => setBuilderData({...builderData, nqf_level: v})}>
                    <SelectTrigger className="rounded-xl border-primary/40 shadow-none bg-card">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NQF Level 1">NQF Level 1</SelectItem>
                      <SelectItem value="NQF Level 2">NQF Level 2</SelectItem>
                      <SelectItem value="NQF Level 3">NQF Level 3</SelectItem>
                      <SelectItem value="NQF Level 4">NQF Level 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <Input value={builderData.duration} onChange={e => setBuilderData({...builderData, duration: e.target.value})} className="rounded-xl border-primary/40 shadow-none bg-card" placeholder="e.g. 12 Months" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Capacity</label>
                  <Input type="number" value={builderData.capacity} onChange={e => setBuilderData({...builderData, capacity: e.target.value})} className="rounded-xl border-primary/40 shadow-none bg-card" placeholder="e.g. 50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-none">
          <DialogHeader>
            <DialogTitle>Create New Program</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program Title</label>
              <Input placeholder="e.g. Advanced Welding" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={newCourse.category} onValueChange={v => setNewCourse({...newCourse, category: v})}>
                <SelectTrigger className="rounded-xl border-primary/40 shadow-none">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c !== 'All').map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Input placeholder="e.g. 6 Months" value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Capacity</label>
              <Input type="number" placeholder="e.g. 50" value={newCourse.capacity} onChange={e => setNewCourse({...newCourse, capacity: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl border-primary/40 shadow-none">Cancel</Button>
            <Button onClick={handleCreateCourse} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-none">Create & Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
