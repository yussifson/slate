import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Printer, CheckCircle2, Download, Eye, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function SHSReportCards() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [previewStudent, setPreviewStudent] = useState(null);

  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(true);
      try {
        const [examData, classData] = await Promise.all([
          base44.getEntities('shs_exam', user?.company_id),
          base44.getEntities('shs_class', user?.company_id),
        ]);
        
        // Include Completed/Published exams for report cards
        setExams(examData);
        setClasses(classData);
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
      if (!selectedExamId || !selectedClassId) return;
      
      setLoading(true);
      try {
        const targetClass = classes.find(c => c.id === selectedClassId);
        
        // 1. Fetch active students in this class
        const studentRecords = await base44.getEntities('shs_student', user?.company_id);
        const classStudents = studentRecords.filter(s => 
          s.status === 'Active' && 
          s.data?.classRoom === targetClass?.title
        );
        
        // 2. Fetch grades for this exam & class
        const gradeRecords = await base44.getEntities('shs_grade', user?.company_id);
        const classGrades = gradeRecords.filter(g => 
          g.data?.examId === selectedExamId &&
          g.data?.classId === selectedClassId
        );
        
        setStudents(classStudents);
        setGrades(classGrades);
      } catch (error) {
        console.error('Failed to fetch students/grades:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id && selectedExamId && selectedClassId) {
      fetchStudentsAndGrades();
    }
  }, [selectedExamId, selectedClassId, classes, user]);

  // Aggregate stats per student
  const studentStats = students.map(student => {
    const studentGrades = grades.filter(g => g.data?.studentId === student.id);
    const totalScore = studentGrades.reduce((sum, g) => sum + (g.data?.totalScore || 0), 0);
    const avgScore = studentGrades.length > 0 ? (totalScore / studentGrades.length).toFixed(1) : 0;
    
    return {
      ...student,
      subjectCount: studentGrades.length,
      average: avgScore,
      grades: studentGrades,
    };
  });

  const filteredStats = studentStats.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
            Report Cards
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Generate and print end-of-term academic reports for students.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary dark:text-primary/70" /> Select Exam Cycle
              </label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                <option value="">Choose an exam cycle...</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.title} ({e.data?.academicYear})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Target Class
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

            {selectedClassId && (
              <Button className="h-11 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-md font-bold">
                <Calculator className="w-4 h-4 mr-2" /> Process Positions
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading student records...</div>
          ) : !selectedClassId ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">Select parameters to begin</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                Choose an Exam and Class to view report cards for that cohort.
              </p>
            </div>
          ) : filteredStats.length === 0 ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
              No students found for the selected parameters.
            </div>
          ) : (
            <div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-between items-center">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
                  <Input 
                    placeholder="Search student..." 
                    className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="h-9 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-white dark:bg-slate-900/40 dark:bg-slate-900">
                  <Printer className="w-4 h-4 mr-2" /> Print All (Class)
                </Button>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-100 dark:border-slate-800 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">#</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4 text-center">Subjects Graded</th>
                      <th className="px-6 py-4 text-center">Class Average</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStats.map((student, index) => (
                      <tr key={student.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-slate-100 flex items-center justify-center font-bold text-primary dark:text-primary/70 shrink-0">
                            {student.title.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{student.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{student.data?.indexNumber || student.case_number}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className={student.subjectCount > 0 ? "bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200 font-bold" : "bg-rose-50 text-rose-600 border-rose-200"}>
                            {student.subjectCount} Subjects
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black text-lg ${
                            student.average >= 75 ? 'text-primary' :
                            student.average >= 50 ? 'text-amber-500' :
                            student.average > 0 ? 'text-rose-500' : 'text-slate-300'
                          }`}>
                            {student.average > 0 ? `${student.average}%` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setPreviewStudent(student)}
                              disabled={student.subjectCount === 0}
                              className="text-primary dark:text-primary/70 hover:text-primary hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 font-semibold"
                            >
                              <Eye className="w-4 h-4 mr-2" /> View Report
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Card Preview Modal */}
      <Dialog open={!!previewStudent} onOpenChange={(open) => !open && setPreviewStudent(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
          
          <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-300" />
              <h3 className="font-bold">Terminal Report Preview</h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button size="sm" className="h-8 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white border-none">
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
            </div>
          </div>
          
          {previewStudent && (
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Paper-like container */}
              <div className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-10 mx-auto max-w-3xl space-y-8 font-sans relative">
                
                {/* Header */}
                <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
                  <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Senior High School</h1>
                  <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">Terminal Assessment Report</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">
                    {exams.find(e => e.id === selectedExamId)?.title}
                  </p>
                </div>
                
                {/* Student Details Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                  <div className="flex border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-2">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Student Name:</span>
                    <span className="font-black text-slate-800 dark:text-slate-100">{previewStudent.title}</span>
                  </div>
                  <div className="flex border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-2">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Index Number:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{previewStudent.data?.indexNumber || previewStudent.case_number}</span>
                  </div>
                  <div className="flex border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-2">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Class:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{classes.find(c => c.id === selectedClassId)?.title}</span>
                  </div>
                  <div className="flex border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 pb-2">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Overall Average:</span>
                    <span className="font-black text-primary dark:text-primary/70">{previewStudent.average}%</span>
                  </div>
                </div>

                {/* Grades Table */}
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="border border-slate-300 p-2 text-left font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">Subject</th>
                      <th className="border border-slate-300 p-2 text-center font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 w-20">Class (30)</th>
                      <th className="border border-slate-300 p-2 text-center font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 w-20">Exam (70)</th>
                      <th className="border border-slate-300 p-2 text-center font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 w-20">Total (100)</th>
                      <th className="border border-slate-300 p-2 text-center font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 w-20">Grade</th>
                      <th className="border border-slate-300 p-2 text-left font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewStudent.grades.map(g => (
                      <tr key={g.id}>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-800 dark:text-slate-100">{g.data?.subjectName}</td>
                        <td className="border border-slate-300 p-2 text-center">{g.data?.classScore}</td>
                        <td className="border border-slate-300 p-2 text-center">{g.data?.examScore}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">{g.data?.totalScore}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">{g.data?.grade}</td>
                        <td className="border border-slate-300 p-2 text-xs italic text-slate-600 dark:text-slate-300">
                          {g.data?.grade === 'A1' ? 'Excellent' : 
                           ['B2', 'B3'].includes(g.data?.grade) ? 'Very Good' :
                           ['C4', 'C5', 'C6'].includes(g.data?.grade) ? 'Credit' :
                           ['D7', 'E8'].includes(g.data?.grade) ? 'Pass' : 'Fail'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-16">
                  <div className="text-center">
                    <div className="border-t border-slate-400 pt-2 font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 text-sm">Class Teacher's Signature</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-slate-400 pt-2 font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 text-sm">Headmaster's Signature</div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
