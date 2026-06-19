import React, { useState} from 'react';
import { Search, BookOpen, PlusCircle, Calendar, Trash2, Sparkles} from 'lucide-react';
import { useToast} from "@/components/ui/use-toast";

export default function NotesCenter() {
 const { toast} = useToast();
 const [searchTerm, setSearchTerm] = useState('');

 const notes = [
 { id: 1, course: 'React Foundations', title: 'Component Lifecycle', date: 'Oct 12, 2026', content: 'Hooks replace the old lifecycle methods. useEffect is for side effects.'},
 { id: 2, course: 'Advanced Routing', title: 'Dynamic Segments', date: 'Oct 10, 2026', content: 'Use the colon syntax to define dynamic parameters in React Router.'},
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto py-6">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">My Notes</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Review all the notes you've taken during your courses.</p>
 </div>
 <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
 <PlusCircle className="w-4 h-4" /> New Note
 </button>
 </div>

 <div className="flex gap-4">
 <div className="w-1/3 space-y-4">
 <div className="relative">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
 <input 
 type="text" 
 placeholder="Search notes..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
 />
 </div>

 <div className="space-y-2">
 {notes.map(note => (
 <div key={note.id} className="p-4 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] cursor-pointer hover:border-[var(--primary)] transition-colors">
 <h3 className="font-semibold text-[var(--color-text-primary)] text-sm line-clamp-1">{note.title}</h3>
 <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">
 <BookOpen className="w-3.5 h-3.5" /> <span className="truncate">{note.course}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="flex-1 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 min-h-[500px]">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h2 className="text-2xl font-semibold font-display text-[var(--color-text-primary)] tracking-[-0.02em]">Component Lifecycle</h2>
 <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-text-secondary)]">
 <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> React Foundations</span>
 <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Oct 12, 2026</span>
 </div>
 </div>
  <div className="flex gap-2">
  <button 
    onClick={async () => {
      toast({ title: "Summarizing...", description: "AI is expanding your notes..." });
      try {
        const { generateText } = await import('@/lib/cloudflareAI');
        const prompt = `Expand and summarize these brief notes into a comprehensive study guide: "Hooks replace the old lifecycle methods. useEffect is for side effects."`;
        const res = await generateText(prompt);
        toast({ title: "AI Summary Complete", description: res, duration: 15000 });
      } catch (err) {
        toast({ title: "Error", description: "Failed to generate summary.", variant: "destructive" });
      }
    }}
    className="p-2 text-[var(--primary)] bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
  >
    <Sparkles className="w-4 h-4" /> AI Expand
  </button>
  <button className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-lg transition-colors">
  <Trash2 className="w-5 h-5" />
  </button>
  </div>
 </div>
 
 <div className="prose prose-sm max-w-none text-[var(--color-text-primary)] font-body leading-relaxed">
 <p>Hooks replace the old lifecycle methods. <code>useEffect</code> is for side effects.</p>
 <p>You can use the dependency array to control when the effect fires. An empty array <code>[]</code> means it acts like <code>componentDidMount</code>.</p>
 </div>
 </div>
 </div>
 </div>
 );
}
