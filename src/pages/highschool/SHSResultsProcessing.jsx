import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { FileText, Calculator, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { Progress} from '@/components/ui/progress';

export default function SHSResultsProcessing() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [exams, setExams] = useState([]);
 const [loading, setLoading] = useState(true);
 
 const [selectedExamId, setSelectedExamId] = useState('');
 
 const [isProcessing, setIsProcessing] = useState(false);
 const [progress, setProgress] = useState(0);
 const [processSuccess, setProcessSuccess] = useState(false);

 useEffect(() => {
 const fetchExams = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_exam', user?.company_id);
 // We only want to process exams that are Completed but not yet Published, 
 // or Ongoing exams that are ready to end.
 setExams(records.filter(r => r.status === 'Completed' || r.status === 'Ongoing'));
} catch (error) {
 console.error('Failed to fetch exams:', error);
} finally {
 setLoading(false);
}
};
 
 if (user?.company_id) {
 fetchExams();
}
}, [user]);

 const handleProcessResults = async () => {
 setIsProcessing(true);
 setProgress(0);
 setProcessSuccess(false);
 
 // Simulate complex batch processing (calculating GPAs, positions, broadsheets)
 const interval = setInterval(() => {
 setProgress(prev => {
 if (prev >= 100) {
 clearInterval(interval);
 return 100;
}
 return prev + 5;
});
}, 150);

 setTimeout(async () => {
 try {
 // Update exam status to 'Published' or 'Processed'
 if (selectedExamId) {
 await base44.updateEntity(selectedExamId, { status: 'Published'});
 setExams(exams.filter(e => e.id !== selectedExamId));
 setSelectedExamId('');
}
 setProcessSuccess(true);
 setTimeout(() => setProcessSuccess(false), 5000);
} catch (error) {
 console.error('Failed to update exam status:', error);
} finally {
 setIsProcessing(false);
}
}, 3500);
};

 const selectedExam = exams.find(e => e.id === selectedExamId);

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Results Processing
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Run end-of-term calculations, assign class positions, and generate broadsheets.
 </p>
 </div>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/50 dark:bg-secondary/50 p-6">
 <div className="flex flex-col md:flex-row gap-6 items-end">
 <div className="space-y-2 flex-1">
 <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <FileText className="w-4 h-4 text-primary dark:text-primary/70" /> Target Exam Cycle
 </label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-foreground dark:text-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={selectedExamId}
 onChange={(e) => setSelectedExamId(e.target.value)}
 >
 <option value="">Select an exam to process...</option>
 {exams.map(e => (
 <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
 ))}
 </select>
 </div>
 
 <div className="flex-1">
 {/* Spacer for alignment */}
 </div>
 </div>
 </CardHeader>
 
 <CardContent className="p-8">
 {loading ? (
 <div className="py-12 text-center text-slate-400 dark:text-slate-500 dark:text-muted-foreground">Loading exams...</div>
 ) : !selectedExamId ? (
 <div className="py-20 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary mx-auto flex items-center justify-center mb-4">
 <Calculator className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-foreground dark:text-foreground">Select an exam to process</h3>
 <p className="text-sm text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground max-w-sm mx-auto mt-2">
 Once an exam is completed by all teachers, you can run the broadsheet processing to calculate averages and ranks.
 </p>
 </div>
 ) : (
 <div className="max-w-2xl mx-auto space-y-8">
 
 <div className="p-6 rounded-2xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40 space-y-4">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{selectedExam?.title}</h3>
 <p className="text-sm text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground">{selectedExam?.data?.academicYear} • {selectedExam?.data?.term}</p>
 </div>
 <Badge variant="outline" className="bg-white dark:bg-card/40 dark:bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{selectedExam?.status}</Badge>
 </div>
 
 <div className="bg-amber-50 text-amber-700 text-sm p-4 rounded-xl flex gap-3 items-start border-[0.5px] border-black/9 dark:border-white/8 border-amber-200/50">
 <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
 <p className="font-medium">
 Processing results will lock all grade entries for this exam. It will calculate class averages, student positions, and make report cards available to parents via the portal. Ensure all teachers have completed data entry before proceeding.
 </p>
 </div>
 </div>

 {isProcessing || progress > 0 ? (
 <div className="space-y-3 p-8 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between text-sm font-semibold">
 <span className="text-primary dark:text-primary/70">Processing Data...</span>
 <span className="text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground">{progress}%</span>
 </div>
 <Progress value={progress} className="h-3 bg-slate-100 dark:bg-secondary [&>div]:bg-primary dark:bg-primary" />
 <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-muted-foreground text-center mt-4 tracking-[0.04em]">
 {progress < 30 ? 'Aggregating raw scores...' : 
 progress < 60 ? 'Calculating class averages...' : 
 progress < 90 ? 'Assigning student ranks...' : 
 'Generating terminal broadsheets...'}
 </p>
 </div>
 ) : processSuccess ? (
 <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-secondary/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-primary">
 <CheckCircle2 className="w-8 h-8" />
 </div>
 <h3 className="text-xl font-semibold text-primary/90 mb-2">Processing Complete!</h3>
 <p className="text-primary/80 mb-6">Results have been locked and published successfully.</p>
 <Button variant="outline" className="border-primary/20 text-primary/90 hover:bg-slate-100 font-semibold h-11 px-8 rounded-xl">
 View Broadsheet
 </Button>
 </div>
 ) : (
 <div className="flex justify-center pt-4">
 <Button 
 onClick={handleProcessResults}
 className="h-14 px-10 rounded-2xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -purple-500/30 text-lg font-black group transition-all"
 >
 Run Processing Engine
 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
 </Button>
 </div>
 )}

 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
