import React, { useState} from 'react';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Calendar, ClipboardCheck, BookOpen, Clock, AlertCircle} from 'lucide-react';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';
import { useToast} from "@/components/ui/use-toast";

function cn(...classes) { return classes.filter(Boolean).join(' ');}

export default function UniExams() {
 const companyId = useCompanyId();
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const [selectedStudentId, setSelectedStudentId] = useState('');
 const [activeExam, setActiveExam] = useState(null);
 const [answers, setAnswers] = useState({});
 const [examSubmitted, setExamSubmitted] = useState(false);
 const [scoreResult, setScoreResult] = useState(null);

 const { data: students = []} = useQuery({ queryKey: ["clients", companyId, "uni_student"], queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student'}), enabled: !!companyId});
 const parsedStudents = students.map(s => { let extra = {}; try { extra = JSON.parse(s.extra_data || '{}');} catch(e) {} return { id: s.id, name: s.name, gpa: parseFloat(extra.gpa || '3.50'), status: extra.status || 'Active', major: extra.major || 'CS', courses: extra.courses || []};});
 const activeStudent = parsedStudents.find(s => s.id === selectedStudentId);

 const exams = [
 { id: "EX-401", subject: "Distributed Systems & Cloud", code: "CS-401", date: "June 12, 2026", time: "9:00 - 11:30 AM", questions: [
 { q: "Which theorem states a distributed store can provide at most two of Consistency, Availability, Partition Tolerance?", options: ["CAP Theorem", "PACELC Theorem", "Amdahl's Law", "FLM Theorem"], correct: 0},
 { q: "What is the primary role of a consensus algorithm like Raft?", options: ["Load balancing", "Replicating state machines consistently", "Encrypting backups", "Compiling code"], correct: 1},
 { q: "Which strategy scales databases horizontally?", options: ["Linear scanning", "Sharding", "Sorting index", "Garbage collection"], correct: 1}
 ]},
 { id: "EX-101", subject: "Introduction to Computer Science", code: "CS-101", date: "June 15, 2026", time: "1:00 - 3:00 PM", questions: [
 { q: "Time complexity of binary search on sorted array of size N?", options: ["O(N)", "O(1)", "O(log N)", "O(N log N)"], correct: 2},
 { q: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Binary Tree", "Linked List"], correct: 1}
 ]}
 ];

 const updateStudentGpaMutation = useMutation({
 mutationFn: async ({ studentId, newGpa}) => {
 const student = students.find(s => s.id === studentId); if (!student) return;
 let extra = {}; try { extra = JSON.parse(student.extra_data || '{}');} catch(e) {}
 extra.gpa = newGpa.toFixed(2);
 await base44.entities.Client.update(studentId, { extra_data: JSON.stringify(extra)});
},
 onSuccess: () => { queryClient.invalidateQueries(["clients", companyId, "uni_student"]); toast({ title: "GPA Updated"});}
});

 const handleStartExam = (exam) => { if (!activeStudent) { toast({ title: "No Student Selected", variant: "destructive"}); return;} setActiveExam(exam); setAnswers({}); setExamSubmitted(false); setScoreResult(null);};
 const handleSubmitExam = () => {
 let correct = 0; activeExam.questions.forEach((q, i) => { if (answers[i] === q.correct) correct++;});
 const ratio = correct / activeExam.questions.length;
 const gradeEarned = ratio * 4.0;
 const newGpa = (parseFloat(activeStudent.gpa) * 0.8) + (gradeEarned * 0.2);
 setScoreResult({ correct, total: activeExam.questions.length, percentage: Math.round(ratio * 100), grade: gradeEarned.toFixed(2)});
 setExamSubmitted(true);
 updateStudentGpaMutation.mutate({ studentId: activeStudent.id, newGpa});
};

 const selectClass = "w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body";

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-primary/40 pb-4">
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Examinations & Grading</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Schedule examinations, sit online exams, and review grade transcripts.</p>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Active Student</label>
 <select value={selectedStudentId} onChange={e => { setSelectedStudentId(e.target.value); setActiveExam(null); setExamSubmitted(false);}} className={cn(selectClass, "mt-2")}>
 <option value="">-- Choose Undergraduate --</option>
 {parsedStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.major}) - GPA: {s.gpa}</option>)}
 </select>
 </div>

 {activeStudent ? (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 {!activeExam ? (
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
 <div className="p-6 border-b border-primary/40">
 <h2 className="font-semibold text-[var(--color-text-primary)]">Available Examinations</h2>
 </div>
 <div className="p-4 space-y-3">
 {exams.map((exam, idx) => (
 <div key={idx} className="p-4 bg-[var(--color-surface-1)] rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-mono font-semibold text-[var(--color-accent-primary)] bg-[var(--color-accent-subtle)] px-2 py-0.5 rounded-md-[var(--radius-sm)] tracking-[0.04em]">{exam.code}</span>
 <h4 className="font-semibold text-[var(--text-sm)] text-[var(--color-text-primary)]">{exam.subject}</h4>
 </div>
 <div className="flex flex-wrap gap-4 mt-2 text-[var(--text-xs)] text-[var(--color-text-secondary)] tracking-[0.04em]">
 <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {exam.date}</span>
 <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {exam.time}</span>
 </div>
 </div>
 <button onClick={() => handleStartExam(exam)} className="px-4 py-2 bg-[var(--color-success)] hover:opacity-90 text-white text-xs font-medium rounded-md-[var(--radius-md)] transition-all tracking-[0.04em]">Launch Exam</button>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden ">
 <div className="p-6 border-b border-primary/40 flex justify-between items-center">
 <h3 className="font-semibold text-[var(--color-text-primary)]">Sitting: {activeExam.subject}</h3>
 <button onClick={() => setActiveExam(null)} className="px-3 py-1.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] text-xs font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-3)] tracking-[0.04em]">Quit</button>
 </div>
 <div className="p-6">
 {!examSubmitted ? (
 <div className="space-y-6">
 {activeExam.questions.map((q, qIdx) => (
 <div key={qIdx} className="space-y-2 border-b border-primary/40 pb-4 last:border-0">
 <p className="font-medium text-[var(--color-text-primary)]">{qIdx + 1}. {q.q}</p>
 <div className="grid grid-cols-1 gap-2 pt-2">
 {q.options.map((opt, optIdx) => (
 <label key={optIdx} className={cn("flex items-center gap-2 text-[var(--text-sm)] border-[0.5px] border-black/9 dark:border-white/8 rounded-md-[var(--radius-md)] p-2.5 cursor-pointer transition-colors", answers[qIdx] === optIdx ? "border-[var(--primary)] bg-[var(--color-accent-subtle)]" : "border-primary/40 hover:bg-[var(--color-surface-2)]")}>
 <input type="radio" name={`q-${qIdx}`} checked={answers[qIdx] === optIdx} onChange={() => setAnswers({ ...answers, [qIdx]: optIdx})} className="accent-[var(--primary)]" />
 <span className="font-medium text-[var(--color-text-primary)]">{opt}</span>
 </label>
 ))}
 </div>
 </div>
 ))}
 <button onClick={handleSubmitExam} disabled={Object.keys(answers).length < activeExam.questions.length} className="w-full py-2.5 bg-[var(--color-accent-primary)] hover:opacity-90 text-white font-medium rounded-md-[var(--radius-md)] transition-all disabled:opacity-50">Submit Paper</button>
 </div>
 ) : (
 <div className="text-center py-6 space-y-4">
 <div className="w-16 h-16 rounded-md-full flex items-center justify-center mx-auto" style={{ background: 'var(--color-success-subtle)'}}><ClipboardCheck className="w-8 h-8" style={{ color: 'var(--color-success)'}} /></div>
 <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Exam Graded</h3>
 <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-lg)]">
 <div><p className="text-[10px] text-[var(--color-text-tertiary)] font-semibold uppercase tracking-[0.04em]">Score</p><p className="text-xl font-display font-semibold text-[var(--color-text-primary)]">{scoreResult.correct}/{scoreResult.total}</p></div>
 <div><p className="text-[10px] text-[var(--color-text-tertiary)] font-semibold uppercase tracking-[0.04em]">Grade</p><p className="text-xl font-display font-semibold text-[var(--color-success)]">{scoreResult.grade}/4.00</p></div>
 </div>
 <div className="p-3 bg-[var(--color-info-subtle)] border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-info)] rounded-md-[var(--radius-lg)] max-w-md mx-auto text-[var(--text-xs)] text-[var(--color-info)] flex gap-2 text-left tracking-[0.04em]">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <div><p className="font-semibold">GPA Recalculated</p><p className="mt-0.5">Cumulative GPA adjusted after logging this exam record.</p></div>
 </div>
 <button onClick={() => setActiveExam(null)} className="w-full py-2 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-3)]">Return to Hub</button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 h-fit">
 <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Grading Status</h3>
 <div className="space-y-3">
 <div className="flex justify-between py-2 border-b border-primary/40 text-[var(--text-sm)]">
 <span className="text-[var(--color-text-secondary)]">Program</span>
 <span className="font-medium text-[var(--color-text-primary)]">{activeStudent.major}</span>
 </div>
 <div className="flex justify-between py-2 text-[var(--text-sm)]">
 <span className="text-[var(--color-text-secondary)]">GPA</span>
 <span className="font-mono font-semibold text-[var(--color-accent-primary)]">{activeStudent.gpa}</span>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-12 text-center text-[var(--color-text-tertiary)]">Select a student to load exam terminal.</div>
 )}
 </div>
 );
}
