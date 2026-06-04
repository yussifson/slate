import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, BookOpen, Users, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SHSClasses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    className: '',
    grade: 'Form 1',
    program: 'General Science',
    classTeacherId: '',
    capacity: 40,
    room: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classData, teacherData] = await Promise.all([
        base44.getEntities('shs_class', user?.company_id),
        base44.getEntities('shs_teacher', user?.company_id)
      ]);
      setClasses(classData);
      setTeachers(teacherData);
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

  const handleAddClass = async () => {
    try {
      const selectedTeacher = teachers.find(t => t.id === newClass.classTeacherId);
      
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_class',
        title: newClass.className,
        case_number: `CLS-${Math.floor(Math.random() * 10000)}`,
        status: 'Active',
        data: {
          ...newClass,
          classTeacherName: selectedTeacher?.title || 'Unassigned'
        }
      };
      
      await base44.createEntity(payload);
      setIsAddModalOpen(false);
      setNewClass({
        className: '', grade: 'Form 1', program: 'General Science', classTeacherId: '', capacity: 40, room: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to add class:', error);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.data?.program?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            Academic Classes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage classroom allocations, class teachers, and academic blocks.
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Create Class
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-purple-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Total Classes</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{classes.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-emerald-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Assigned Teachers</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {classes.filter(c => c.data?.classTeacherId).length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Classes Directory</CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input 
                placeholder="Search class name or program..." 
                className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading classes...</div>
          ) : filteredClasses.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-blue-500 dark:text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No classes found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Create a new class to set up your academic structure.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredClasses.map(cls => (
                <div key={cls.id} className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-600 dark:border-blue-500/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-black text-xl text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:text-blue-400 transition-colors">{cls.title}</h4>
                      <Badge variant="outline" className="mt-1 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-slate-600">
                        {cls.data?.grade} • {cls.data?.program}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-4 text-sm">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Class Teacher</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{cls.data?.classTeacherName || 'Unassigned'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Room</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{cls.data?.room || 'TBA'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Capacity</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{cls.data?.capacity || 40}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-slate-50 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="w-full rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-slate-800 font-semibold">
                      View Students <Users className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Create Class</DialogTitle>
              <DialogDescription className="text-blue-100 dark:text-blue-900">
                Set up a new academic class and assign a class teacher.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-slate-800">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Class Name</label>
                <Input 
                  placeholder="e.g. 1 Sci A"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={newClass.className}
                  onChange={e => setNewClass({...newClass, className: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Form / Grade</label>
                  <select 
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                    value={newClass.grade}
                    onChange={e => setNewClass({...newClass, grade: e.target.value})}
                  >
                    <option value="Form 1">Form 1</option>
                    <option value="Form 2">Form 2</option>
                    <option value="Form 3">Form 3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Programme</label>
                  <select 
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                    value={newClass.program}
                    onChange={e => setNewClass({...newClass, program: e.target.value})}
                  >
                    <option value="General Science">General Science</option>
                    <option value="General Arts">General Arts</option>
                    <option value="Business">Business</option>
                    <option value="Visual Arts">Visual Arts</option>
                    <option value="Home Economics">Home Economics</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Class Teacher</label>
                <select 
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                  value={newClass.classTeacherId}
                  onChange={e => setNewClass({...newClass, classTeacherId: e.target.value})}
                >
                  <option value="">Unassigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Room</label>
                  <Input 
                    placeholder="e.g. Block A, Rm 1"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                    value={newClass.room}
                    onChange={e => setNewClass({...newClass, room: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Capacity</label>
                  <Input 
                    type="number"
                    min="1"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                    value={newClass.capacity}
                    onChange={e => setNewClass({...newClass, parseInt: e.target.value})}
                  />
                </div>
              </div>

            </div>
          </ScrollArea>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleAddClass} 
              disabled={!newClass.className}
              className="rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold"
            >
              Create Class
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
