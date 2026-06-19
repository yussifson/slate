import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, PlusCircle, Trash2, CheckCircle2, BrainCircuit, Sparkles } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { powerSync } from "@/api/PowerSyncConnector";
import { generateText } from '@/lib/cloudflareAI';

export default function AssessmentBuilder() {
 const { courseId } = useParams();
 const navigate = useNavigate();
 const { toast } = useToast();
 const companyId = useCompanyId();
 const { user } = useAuth();

 const [assessmentTitle, setAssessmentTitle] = useState('');
 const [isGeneratingAI, setIsGeneratingAI] = useState(false);
 const [questions, setQuestions] = useState([
 { id: 1, text: '', options: ['', '', '', ''], correctIndex: 0 }
 ]);

 const addQuestion = () => {
 setQuestions([...questions, { id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0}]);
};

 const removeQuestion = (id) => {
 setQuestions(questions.filter(q => q.id !== id));
};

 const updateQuestion = (id, field, value) => {
 setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value} : q));
};

 const updateOption = (qId, optIndex, value) => {
 setQuestions(questions.map(q => {
 if (q.id === qId) {
 const newOptions = [...q.options];
 newOptions[optIndex] = value;
 return { ...q, options: newOptions};
}
 return q;
}));
};

 const generateAIQuestions = async () => {
   setIsGeneratingAI(true);
   toast({ title: "Generating Questions...", description: "AI is crafting your quiz." });
   try {
     const prompt = `You are an expert instructional designer. Generate 3 multiple choice questions for a quiz titled "${assessmentTitle || 'General Knowledge'}". Return ONLY a valid JSON array where each element is an object with: "text" (string), "options" (array of 4 strings), and "correctIndex" (integer 0-3).`;
     const res = await generateText(prompt);
     try {
       // Extract JSON if it's wrapped in markdown code blocks
       const jsonStr = res.replace(/```json\n?|\n?```/g, '').trim();
       const parsed = JSON.parse(jsonStr);
       if (Array.isArray(parsed)) {
         const newQuestions = parsed.map((q, i) => ({
           id: Date.now() + i,
           text: q.text,
           options: q.options,
           correctIndex: q.correctIndex
         }));
         setQuestions(newQuestions);
         toast({ title: "Success", description: "AI generated 3 questions!" });
       }
     } catch (e) {
       toast({ title: "Error", description: "AI returned invalid format.", variant: "destructive" });
     }
   } catch (err) {
     toast({ title: "Error", description: "Failed to generate questions.", variant: "destructive" });
   } finally {
     setIsGeneratingAI(false);
   }
 };

 const handleSave = async () => {
  if (!assessmentTitle.trim()) {
   toast({ variant: "destructive", title: "Error", description: "Assessment title is required."});
   return;
  }
  
  try {
    const id = `ass_${Math.random().toString(36).substr(2, 9)}`;
    await powerSync.execute(
      `INSERT INTO online_assessments (id, company_id, course_id, title, type, questions, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, courseId, assessmentTitle, 'quiz', JSON.stringify(questions), new Date().toISOString(), user?.id]
    );
    toast({ title: "Success", description: "Assessment saved successfully!"});
    navigate(`/o/builder/course/${courseId}`);
  } catch (err) {
    toast({ title: "Error", description: err.message, variant: "destructive" });
  }
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
 <div className="flex items-center gap-4 pb-4 border-b border-primary/40">
 <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-2)] rounded-md-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors">
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <h1 className="font-display font-semibold text-[var(--text-2xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Assessment Builder</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Create quizzes to test learner knowledge.</p>
 </div>
 <div className="ml-auto flex items-center gap-2">
 <button 
   onClick={generateAIQuestions}
   disabled={isGeneratingAI}
   className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--primary)]/20 transition-colors disabled:opacity-50"
 >
   {isGeneratingAI ? <span className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
   {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
 </button>
 <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
 <Save className="w-4 h-4" /> Save Assessment
 </button>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 mb-6">
 <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Assessment Title</label>
 <input 
 type="text" 
 value={assessmentTitle}
 onChange={(e) => setAssessmentTitle(e.target.value)}
 placeholder="e.g., Slate 1 Final Quiz" 
 className="w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>

 <div className="space-y-6">
 {questions.map((q, qIndex) => (
 <div key={q.id} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
 <div className="bg-[var(--color-surface-1)] px-6 py-4 border-b border-primary/40 flex justify-between items-center">
 <h3 className="font-semibold text-[var(--color-text-primary)]">Question {qIndex + 1}</h3>
 <button onClick={() => removeQuestion(q.id)} className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-lg transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 <div className="p-6 space-y-5">
 <div>
 <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Question Text</label>
 <input 
 type="text" 
 value={q.text}
 onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
 placeholder="What is the main objective of..." 
 className="w-full bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
 />
 </div>

 <div className="space-y-3">
 <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Answers</label>
 {q.options.map((opt, optIndex) => (
 <div key={optIndex} className="flex items-center gap-3">
 <button 
 onClick={() => updateQuestion(q.id, 'correctIndex', optIndex)}
 className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${q.correctIndex === optIndex ? 'bg-[var(--color-success)] text-white' : 'border-2 border-primary/40 text-transparent hover:border-[var(--color-success)]'}`}
 >
 <CheckCircle2 className="w-4 h-4" />
 </button>
 <input 
 type="text" 
 value={opt}
 onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
 placeholder={`Option ${optIndex + 1}`} 
 className={`flex-1 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] focus:outline-none transition-colors ${q.correctIndex === optIndex ? 'border-[var(--color-success)] ring-1 ring-[var(--color-success)] text-[var(--color-text-primary)] font-medium' : 'border-primary/40 text-[var(--color-text-secondary)] focus:border-[var(--primary)]'}`}
 />
 </div>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>

 <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-primary/40 rounded-md-[var(--radius-xl)] flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--color-surface-1)] transition-colors font-medium">
 <PlusCircle className="w-5 h-5" /> Add Another Question
 </button>
 </div>
 );
}
