import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { FileText, Save, CheckCircle2, Search, BookOpen, GraduationCap, FileSpreadsheet} from 'lucide-react';
import { Badge} from '@/components/ui/badge';

export default function SHSGrades() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [exams, setExams] = useState([]);
 const [classes, setClasses] = useState([]);
 const [subjects, setSubjects] = useState([]);
 
 const [selectedExamId, setSelectedExamId] = useState('');
 const [selectedClassId, setSelectedClassId] = useState('');
 const [selectedSubjectId, setSelectedSubjectId] = useState('');
 
 const [students, setStudents] = useState([]);
 const [grades, setGrades] = useState({});
 const [loading, setLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [saveSuccess, setSaveSuccess] = useState(false);

 useEffect(() => {
 const fetchDropdowns = async () => {
 setLoading(true);
 try {
 const [examData, classData, subjectData] = await Promise.all([
 base44.getEntities('shs_exam', user?.company_id),
 base44.getEntities('shs_class', user?.company_id),
 base44.getEntities('shs_subject', user?.company_id)
 ]);
 
 setExams(examData.filter(e => e.status !== 'Completed' && e.status !== 'Published'));
 setClasses(classData);
 setSubjects(subjectData);
} catch (error) {
 console.error('Failed to fetch dropdowns:', error);
} finally {
 setLoading(false);
}
};
 
 if (user?.company_id) {
 fetchDropdowns();
}
}, [user]);

 useEffect(() => {
 const fetchStudentsAndGrades = async () => {
 if (!selectedExamId || !selectedClassId || !selectedSubjectId) return;
 
 setLoading(true);
 try {
 const targetClass = classes.find(c => c.id === selectedClassId);
 
 // 1. Fetch active students in this class
 const studentRecords = await base44.getEntities('shs_student', user?.company_id);
 const classStudents = studentRecords.filter(s => 
 s.status === 'Active' && 
 s.data?.classRoom === targetClass?.title
 );
 
 // 2. Fetch existing grades for this exam, class, subject
 const gradeRecords = await base44.getEntities('shs_grade', user?.company_id);
 const existingGrades = gradeRecords.filter(g => 
 g.data?.examId === selectedExamId &&
 g.data?.classId === selectedClassId &&
 g.data?.subjectId === selectedSubjectId
 );
 
 setStudents(classStudents);
 
 // 3. Initialize state
 const newState = {};
 classStudents.forEach(student => {
 const existing = existingGrades.find(g => g.data?.studentId === student.id);
 newState[student.id] = {
 id: existing ? existing.id : null,
 classScore: existing ? existing.data?.classScore : '',
 examScore: existing ? existing.data?.examScore : '',
};
});
 
 setGrades(newState);
 setSaveSuccess(false);
} catch (error) {
 console.error('Failed to fetch students/grades:', error);
} finally {
 setLoading(false);
}
};

 if (user?.company_id) {
 fetchStudentsAndGrades();
}
}, [selectedExamId, selectedClassId, selectedSubjectId, classes, user]);

 const handleGradeChange = (studentId, field, value) => {
 // Only allow numbers up to 100
 const numValue = value === '' ? '' : Math.min(100, Math.max(0, Number(value)));
 
 // Validate bounds (classScore max 30 or 40 depending on system, let's assume 30 for CA, 70 for Exam as standard, but we'll limit both to 100 for flexibility)
 
 setGrades(prev => ({
 ...prev,
 [studentId]: {
 ...prev[studentId],
 [field]: numValue
}
}));
 setSaveSuccess(false);
};

 const calculateTotal = (studentId) => {
 const gs = grades[studentId];
 if (!gs) return 0;
 const cs = Number(gs.classScore) || 0;
 const es = Number(gs.examScore) || 0;
 return cs + es;
};
 
 const calculateGrade = (total) => {
 if (total === 0) return '-';
 if (total >= 80) return 'A1';
 if (total >= 70) return 'B2';
 if (total >= 65) return 'B3';
 if (total >= 60) return 'C4';
 if (total >= 55) return 'C5';
 if (total >= 50) return 'C6';
 if (total >= 45) return 'D7';
 if (total >= 40) return 'E8';
 return 'F9';
};

 const handleSaveGrades = async () => {
 setIsSaving(true);
 try {
 const exam = exams.find(e => e.id === selectedExamId);
 const cls = classes.find(c => c.id === selectedClassId);
 const sub = subjects.find(s => s.id === selectedSubjectId);
 
 const promises = students.map(async (student) => {
 const studentGrades = grades[student.id];
 if (studentGrades.classScore === '' && studentGrades.examScore === '') return; // Skip empty
 
 const total = calculateTotal(student.id);
 
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_grade',
 title: `${student.title} - ${sub.title}`,
 case_number: `GRD-${Math.floor(Math.random() * 100000)}`,
 status: 'Draft',
 data: {
 examId: selectedExamId,
 examName: exam.title,
 classId: selectedClassId,
 className: cls.title,
 subjectId: selectedSubjectId,
 subjectName: sub.title,
 studentId: student.id,
 studentName: student.title,
 indexNumber: student.data?.indexNumber,
 classScore: Number(studentGrades.classScore) || 0,
 examScore: Number(studentGrades.examScore) || 0,
 totalScore: total,
 grade: calculateGrade(total)
}
};

 if (studentGrades.id) {
 return base44.updateEntity(studentGrades.id, payload);
} else {
 // Add newly created ID back to state so subsequent saves are updates
 const res = await base44.createEntity(payload);
 setGrades(prev => ({
 ...prev,
 [student.id]: { ...prev[student.id], id: res.id} // Assume res returns ID
}));
}
});
 
 await Promise.all(promises);
 setSaveSuccess(true);
 setTimeout(() => setSaveSuccess(false), 3000);
} catch (error) {
 console.error('Failed to save grades:', error);
} finally {
 setIsSaving(false);
}
};

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Grade Entry
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Enter continuous assessment and exam scores for students.
 </p>
 </div>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 p-6">
 <div className="flex flex-col md:flex-row gap-6">
 <div className="space-y-2 flex-1">
 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
 <FileText className="w-4 h-4 text-primary dark:text-primary/70" /> Select Exam Cycle
 </label>
 <select 
 className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200"
 value={selectedExamId}
 onChange={(e) => setSelectedExamId(e.target.value)}
 >
 <option value="">Choose an active exam...</option>
 {exams.map(e => (
 <option key={e.id} value={e.id}>{e.title} ({e.data?.academicYear})</option>
 ))}
 </select>
 </div>

 <div className="space-y-2 flex-1">
 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
 <GraduationCap className="w-4 h-4 text-primary" /> Class
 </label>
 <select 
 className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200"
 value={selectedClassId}
 onChange={(e) => setSelectedClassId(e.target.value)}
 disabled={!selectedExamId}
 >
 <option value="">Choose a class...</option>
 {classes.map(c => (
 <option key={c.id} value={c.id}>{c.title}</option>
 ))}
 </select>
 </div>

 <div className="space-y-2 flex-1">
 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
 <BookOpen className="w-4 h-4 text-amber-600" /> Subject
 </label>
 <select 
 className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200"
 value={selectedSubjectId}
 onChange={(e) => setSelectedSubjectId(e.target.value)}
 disabled={!selectedClassId}
 >
 <option value="">Choose a subject...</option>
 {subjects.map(s => (
 <option key={s.id} value={s.id}>{s.title}</option>
 ))}
 </select>
 </div>
 </div>
 </CardHeader>
 
 <CardContent className="p-0">
 {loading ? (
 <div className="p-16 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading grade sheet...</div>
 ) : !selectedSubjectId ? (
 <div className="p-20 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">Select parameters to begin</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
 Choose an Exam, Class, and Subject to open the grading sheet for that specific cohort.
 </p>
 </div>
 ) : students.length === 0 ? (
 <div className="p-16 text-center text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 No active students found in this class.
 </div>
 ) : (
 <div>
 <div className="overflow-x-auto max-h-[500px]">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 ">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl w-12 text-center">#</th>
 <th className="px-6 py-4">Student Name</th>
 <th className="px-6 py-4 text-center w-32">Class Score (30%)</th>
 <th className="px-6 py-4 text-center w-32">Exam Score (70%)</th>
 <th className="px-6 py-4 text-center w-32">Total (100%)</th>
 <th className="px-6 py-4 text-center w-24">Grade</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {students.map((student, index) => {
 const total = calculateTotal(student.id);
 const grade = calculateGrade(total);
 
 return (
 <tr key={student.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-3 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold">
 {index + 1}
 </td>
 <td className="px-6 py-3">
 <p className="font-bold text-slate-800 dark:text-slate-100">{student.title}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{student.data?.indexNumber || student.case_number}</p>
 </td>
 <td className="px-6 py-3 text-center">
 <Input 
 type="number"
 min="0"
 max="30"
 className="h-10 text-center font-semibold bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-primary dark:focus-visible:ring-primary focus-visible:bg-white dark:bg-slate-900/40 dark:bg-slate-900 transition-colors"
 value={grades[student.id]?.classScore}
 onChange={(e) => handleGradeChange(student.id, 'classScore', e.target.value)}
 />
 </td>
 <td className="px-6 py-3 text-center">
 <Input 
 type="number"
 min="0"
 max="70"
 className="h-10 text-center font-semibold bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-primary dark:focus-visible:ring-primary focus-visible:bg-white dark:bg-slate-900/40 dark:bg-slate-900 transition-colors"
 value={grades[student.id]?.examScore}
 onChange={(e) => handleGradeChange(student.id, 'examScore', e.target.value)}
 />
 </td>
 <td className="px-6 py-3 text-center">
 <div className="h-10 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
 {total > 0 ? total : '-'}
 </div>
 </td>
 <td className="px-6 py-3 text-center">
 {total > 0 ? (
 <Badge variant="outline" className={`
 border-none font-bold text-sm h-8 w-10 flex items-center justify-center
 ${grade === 'A1' ? 'bg-slate-100 text-primary/90' : 
 ['B2', 'B3'].includes(grade) ? 'bg-orange-100 text-orange-700' :
 ['C4', 'C5', 'C6'].includes(grade) ? 'bg-amber-100 text-amber-700' :
 ['D7', 'E8'].includes(grade) ? 'bg-orange-100 text-orange-700' :
 'bg-rose-100 text-rose-700'
}
 `}>
 {grade}
 </Badge>
 ) : (
 <div className="text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold">-</div>
 )}
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex items-center justify-between">
 <div>
 {saveSuccess && (
 <Badge className="bg-slate-100 text-primary/90 border-none px-3 py-1 text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
 <CheckCircle2 className="w-4 h-4" /> Grades Saved Successfully
 </Badge>
 )}
 </div>
 
 <div className="flex gap-3">
 <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-white dark:bg-slate-900/40 dark:bg-slate-900 hidden sm:flex">
 <FileSpreadsheet className="w-5 h-5 mr-2" /> Import CSV
 </Button>
 <Button 
 onClick={handleSaveGrades}
 disabled={isSaving}
 className="h-12 px-8 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20 font-bold"
 >
 {isSaving ? 'Saving...' : (
 <><Save className="w-5 h-5 mr-2" /> Save Grades</>
 )}
 </Button>
 </div>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 </div>
 );
}
