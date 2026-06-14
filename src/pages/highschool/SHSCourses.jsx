import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, GraduationCap, Users, BookOpen, Layers} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSCourses() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [courses, setCourses] = useState([]);
 const [subjects, setSubjects] = useState([]);
 const [classes, setClasses] = useState([]);
 const [teachers, setTeachers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newCourse, setNewCourse] = useState({
 subjectId: '',
 classId: '',
 teacherId: '',
 academicYear: new Date().getFullYear().toString()
});

 const fetchData = async () => {
 setLoading(true);
 try {
 const [courseData, subjectData, classData, teacherData] = await Promise.all([
 base44.getEntities('shs_course', user?.company_id),
 base44.getEntities('shs_subject', user?.company_id),
 base44.getEntities('shs_class', user?.company_id),
 base44.getEntities('shs_teacher', user?.company_id)
 ]);
 setCourses(courseData);
 setSubjects(subjectData);
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

 const handleAddCourse = async () => {
 try {
 const subject = subjects.find(s => s.id === newCourse.subjectId);
 const cls = classes.find(c => c.id === newCourse.classId);
 const teacher = teachers.find(t => t.id === newCourse.teacherId);
 
 const title = `${subject?.title} - ${cls?.title}`;
 
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_course',
 title: title,
 case_number: `CRS-${Math.floor(Math.random() * 10000)}`,
 status: 'Active',
 data: {
 ...newCourse,
 subjectName: subject?.title,
 className: cls?.title,
 teacherName: teacher?.title || 'Unassigned',
 credits: subject?.data?.credits || 3,
 type: subject?.data?.type || 'Core'
}
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewCourse({
 subjectId: '', classId: '', teacherId: '', academicYear: new Date().getFullYear().toString()
});
 fetchData();
} catch (error) {
 console.error('Failed to add course:', error);
}
};

 const filteredCourses = courses.filter(c => 
 c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 c.data?.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 c.data?.className?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Course Enrollments
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Map subjects to specific classes and assign course teachers.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Create Course Assignment
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Layers className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Active Courses</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{courses.length}</h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
 <GraduationCap className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Assigned Teachers</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {new Set(courses.filter(c => c.data?.teacherId).map(c => c.data.teacherId)).size}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-amber-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
 <BookOpen className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Subjects Utilized</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {new Set(courses.map(c => c.data?.subjectId)).size} / {subjects.length}
 </h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Course Offerings</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search course, class, or teacher..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading courses...</div>
 ) : filteredCourses.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <Layers className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No courses defined</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Map a subject to a class to create a course offering.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Course Name</th>
 <th className="px-6 py-4">Class</th>
 <th className="px-6 py-4">Subject</th>
 <th className="px-6 py-4">Type</th>
 <th className="px-6 py-4">Assigned Teacher</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredCourses.map((course) => (
 <tr key={course.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors group">
 <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
 {course.title}
 <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{course.case_number}</div>
 </td>
 <td className="px-6 py-4 font-semibold text-primary dark:text-primary/70">
 {course.data?.className}
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
 {course.data?.subjectName}
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 course.data?.type === 'Core' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' :
 'bg-amber-50 text-amber-700 border-amber-200'
}>
 {course.data?.type || 'Core'}
 </Badge>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 {(course.data?.teacherName || 'U').charAt(0)}
 </div>
 <span className={course.data?.teacherName === 'Unassigned' ? 'text-slate-400 dark:text-slate-500 dark:text-slate-400 italic' : 'text-slate-700 dark:text-slate-300 dark:text-slate-200 font-medium'}>
 {course.data?.teacherName}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 Edit
 </Button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black">Assign Course</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Map a subject to a specific class and assign a teacher.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 <div className="space-y-4">
 
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
 <BookOpen className="w-4 h-4 text-primary dark:text-primary/70" /> Subject
 </label>
 <select 
 className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newCourse.subjectId}
 onChange={e => setNewCourse({...newCourse, subjectId: e.target.value})}
 >
 <option value="">Select a subject...</option>
 {subjects.map(s => (
 <option key={s.id} value={s.id}>{s.title} ({s.data?.type})</option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
 <Users className="w-4 h-4 text-primary" /> Target Class
 </label>
 <select 
 className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
 value={newCourse.classId}
 onChange={e => setNewCourse({...newCourse, classId: e.target.value})}
 >
 <option value="">Select a class...</option>
 {classes.map(c => (
 <option key={c.id} value={c.id}>{c.title} ({c.data?.program})</option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
 <GraduationCap className="w-4 h-4 text-amber-600" /> Course Teacher
 </label>
 <select 
 className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
 value={newCourse.teacherId}
 onChange={e => setNewCourse({...newCourse, teacherId: e.target.value})}
 >
 <option value="">Unassigned (TBA)</option>
 {teachers.map(t => (
 <option key={t.id} value={t.id}>{t.title} ({t.data?.specialization})</option>
 ))}
 </select>
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Academic Year</label>
 <Input 
 className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl h-11"
 value={newCourse.academicYear}
 readOnly
 />
 </div>

 </div>
 </ScrollArea>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end gap-3">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleAddCourse} 
 disabled={!newCourse.subjectId || !newCourse.classId}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold"
 >
 Create Course
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
