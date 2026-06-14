import React, { useState} from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { ArrowLeft, Save, PlusCircle, Trash2, CheckCircle2} from 'lucide-react';
import { useToast} from "@/components/ui/use-toast";

export default function AssessmentBuilder() {
 const { courseId} = useParams();
 const navigate = useNavigate();
 const { toast} = useToast();

 const [assessmentTitle, setAssessmentTitle] = useState('');
 const [questions, setQuestions] = useState([
 { id: 1, text: '', options: ['', '', '', ''], correctIndex: 0}
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

 const handleSave = () => {
 if (!assessmentTitle.trim()) {
 toast({ variant: "destructive", title: "Error", description: "Assessment title is required."});
 return;
}
 toast({ title: "Success", description: "Assessment saved successfully!"});
 navigate(`/o/builder/course/${courseId}`);
};

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
 <div className="flex items-center gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
 <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors">
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <h1 className="font-display font-semibold text-[var(--text-2xl)] text-[var(--color-text-primary)] tracking-tight">Assessment Builder</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Create quizzes to test learner knowledge.</p>
 </div>
 <div className="ml-auto">
 <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
 <Save className="w-4 h-4" /> Save Assessment
 </button>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 mb-6">
 <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Assessment Title</label>
 <input 
 type="text" 
 value={assessmentTitle}
 onChange={(e) => setAssessmentTitle(e.target.value)}
 placeholder="e.g., Slate 1 Final Quiz" 
 className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>

 <div className="space-y-6">
 {questions.map((q, qIndex) => (
 <div key={q.id} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden">
 <div className="bg-[var(--color-surface-1)] px-6 py-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
 <h3 className="font-semibold text-[var(--color-text-primary)]">Question {qIndex + 1}</h3>
 <button onClick={() => removeQuestion(q.id)} className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-md transition-colors">
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
 className="w-full bg-[var(--color-surface-0)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
 />
 </div>

 <div className="space-y-3">
 <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Answers</label>
 {q.options.map((opt, optIndex) => (
 <div key={optIndex} className="flex items-center gap-3">
 <button 
 onClick={() => updateQuestion(q.id, 'correctIndex', optIndex)}
 className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${q.correctIndex === optIndex ? 'bg-[var(--color-success)] text-white' : 'border-2 border-[var(--color-border-default)] text-transparent hover:border-[var(--color-success)]'}`}
 >
 <CheckCircle2 className="w-4 h-4" />
 </button>
 <input 
 type="text" 
 value={opt}
 onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
 placeholder={`Option ${optIndex + 1}`} 
 className={`flex-1 bg-[var(--color-surface-0)] border rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] focus:outline-none transition-colors ${q.correctIndex === optIndex ? 'border-[var(--color-success)] ring-1 ring-[var(--color-success)] text-[var(--color-text-primary)] font-medium' : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] focus:border-[var(--primary)]'}`}
 />
 </div>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>

 <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-primary/50 rounded-[var(--radius-xl)] flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--color-surface-1)] transition-colors font-medium">
 <PlusCircle className="w-5 h-5" /> Add Another Question
 </button>
 </div>
 );
}
