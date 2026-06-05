import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, BookOpen, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function VCourses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', code: '', credits: '', type: 'Core' });
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_course', user?.company_id);
      setCourses(records);
      if (records.length > 0 && !selectedCourse) {
        setSelectedCourse(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchCourses();
    }
  }, [user]);

  const handleCreateCourse = async () => {
    if (!newCourse.title) return;
    try {
      const created = await base44.createEntity('voc_course', {
        title: newCourse.title,
        data: {
          code: newCourse.code,
          credits: newCourse.credits,
          type: newCourse.type,
        }
      }, user?.company_id);
      setCourses([...courses, created]);
      setIsDialogOpen(false);
      setNewCourse({ title: '', code: '', credits: '', type: 'Core' });
      setSelectedCourse(created);
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.data?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 bg-clip-text text-transparent">
            Course Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage vocational courses, modules, and credit requirements.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none">
              <Plus className="w-4 h-4 mr-2" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input id="title" placeholder="e.g. Intro to Welding" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input id="code" placeholder="e.g. WLD-101" value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Input id="credits" type="number" placeholder="e.g. 3" value={newCourse.credits} onChange={e => setNewCourse({...newCourse, credits: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input id="type" placeholder="e.g. Core, Elective" value={newCourse.type} onChange={e => setNewCourse({...newCourse, type: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateCourse} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">Save Course</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-emerald-100/50">
          <div className="p-4 border-b border-emerald-50 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <Input 
                placeholder="Search courses..." 
                className="pl-9 h-10 bg-emerald-50/50 dark:bg-slate-800/50 border-emerald-100 dark:border-slate-700 rounded-xl focus-visible:ring-emerald-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-emerald-300 text-sm">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No courses found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredCourses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedCourse?.id === course.id 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                        : 'hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedCourse?.id === course.id ? 'bg-white/20' : 'bg-emerald-100 dark:bg-slate-800 text-emerald-600'
                    }`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{course.title}</p>
                      <p className={`text-xs truncate ${selectedCourse?.id === course.id ? 'text-emerald-200' : 'text-slate-500'}`}>
                        {course.data?.code || 'NO-CODE'} • {course.data?.type || 'Core'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-emerald-100/50 overflow-hidden relative">
          {selectedCourse ? (
            <>
              <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative shrink-0 flex items-center px-8">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 flex items-center gap-6 translate-y-10">
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-xl shrink-0">
                    <div className="w-full h-full rounded-xl bg-emerald-50 dark:bg-slate-800 flex items-center justify-center text-emerald-600">
                      <BookOpen className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 mt-12">
                <div className="px-8 pb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedCourse.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400">
                          {selectedCourse.data?.code || 'N/A'}
                        </Badge>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          {selectedCourse.data?.credits ? `${selectedCourse.data.credits} Credits` : 'No Credits defined'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          {selectedCourse.data?.type || 'Core'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-emerald-50/50 dark:bg-slate-800/50 border-emerald-100 dark:border-slate-700 shadow-none">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-slate-700 text-emerald-600 rounded-xl">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">Active</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-teal-50/50 dark:bg-slate-800/50 border-teal-100 dark:border-slate-700 shadow-none">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-teal-100 dark:bg-slate-700 text-teal-600 rounded-xl">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Term</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">Year-round</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-cyan-50/50 dark:bg-slate-800/50 border-cyan-100 dark:border-slate-700 shadow-none">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-cyan-100 dark:bg-slate-700 text-cyan-600 rounded-xl">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{new Date(selectedCourse.created_date).toLocaleDateString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Course Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                Select a course from the list to view its details or add a new course to the curriculum.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
