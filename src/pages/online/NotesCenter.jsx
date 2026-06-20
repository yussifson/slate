import React, { useState } from 'react';
import { Search, BookOpen, PlusCircle, Calendar, Trash2, Sparkles } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { format } from 'date-fns';

export default function NotesCenter() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const companyId = useCompanyId();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeNote, setActiveNote] = useState(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["online_notes", companyId, user?.id],
    queryFn: async () => {
      try {
        const data = await powerSync.getAll(
          `SELECT * FROM online_notes WHERE company_id = ? AND created_by = ? ORDER BY created_at DESC`,
          [companyId, user?.id]
        );
        return data || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!companyId && !!user?.id
  });

  const handleCreateNote = async () => {
    try {
      const newId = `note_${Math.random().toString(36).substr(2, 9)}`;
      const newNote = {
        id: newId,
        company_id: companyId,
        created_by: user?.id,
        title: 'New Note',
        content: '',
        course_title: 'General',
        created_at: new Date().toISOString()
      };
      await powerSync.execute(
        `INSERT INTO online_notes (id, company_id, created_by, title, content, course_title, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newNote.id, newNote.company_id, newNote.created_by, newNote.title, newNote.content, newNote.course_title, newNote.created_at]
      );
      queryClient.invalidateQueries(["online_notes", companyId]);
      setActiveNote(newNote);
    } catch (err) {
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
    }
  };

  const handleUpdateNote = async (id, updates) => {
    try {
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      await powerSync.execute(
        `UPDATE online_notes SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
      queryClient.invalidateQueries(["online_notes", companyId]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await powerSync.execute(`DELETE FROM online_notes WHERE id = ?`, [id]);
      if (activeNote?.id === id) setActiveNote(null);
      queryClient.invalidateQueries(["online_notes", companyId]);
      toast({ title: "Note Deleted" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  };

  const filteredNotes = notes.filter(n => 
    !searchTerm || 
    (n.title && n.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (n.content && n.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto py-6">
      <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">My Notes</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Review all the notes you've taken during your courses.</p>
        </div>
        <button onClick={handleCreateNote} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
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

          <div className="space-y-2 h-[500px] overflow-y-auto pr-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground p-4">Loading notes...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No notes found.</p>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => setActiveNote(note)}
                  className={`p-4 bg-[var(--color-surface-0)] border-[0.5px] rounded-md-[var(--radius-md)] cursor-pointer transition-colors ${activeNote?.id === note.id ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : 'border-black/9 dark:border-white/8 border-primary/40 hover:border-[var(--primary)]'}`}
                >
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-sm line-clamp-1">{note.title || 'Untitled Note'}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">
                    <BookOpen className="w-3.5 h-3.5" /> <span className="truncate">{note.course_title || 'General'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 min-h-[500px] flex flex-col">
          {activeNote ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <input 
                    type="text"
                    value={activeNote.title || ''}
                    onChange={(e) => {
                      setActiveNote({ ...activeNote, title: e.target.value });
                      handleUpdateNote(activeNote.id, { title: e.target.value });
                    }}
                    className="text-2xl font-semibold font-display text-[var(--color-text-primary)] tracking-[-0.02em] bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
                    placeholder="Note Title"
                  />
                  <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {activeNote.course_title || 'General'}</span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {format(new Date(activeNote.created_at || new Date()), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      toast({ title: "Summarizing...", description: "AI is expanding your notes..." });
                      try {
                        const { generateText } = await import('@/lib/cloudflareAI');
                        const prompt = `Expand and summarize these brief notes into a comprehensive study guide. Format with Markdown: "${activeNote.content}"`;
                        const res = await generateText(prompt);
                        const updatedContent = activeNote.content + "\n\n### AI Summary\n" + res;
                        setActiveNote({ ...activeNote, content: updatedContent });
                        handleUpdateNote(activeNote.id, { content: updatedContent });
                        toast({ title: "AI Summary Complete", duration: 5000 });
                      } catch (err) {
                        toast({ title: "Error", description: "Failed to generate summary.", variant: "destructive" });
                      }
                    }}
                    className="p-2 text-[var(--primary)] bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Sparkles className="w-4 h-4" /> AI Expand
                  </button>
                  <button 
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <textarea 
                value={activeNote.content || ''}
                onChange={(e) => {
                  setActiveNote({ ...activeNote, content: e.target.value });
                  handleUpdateNote(activeNote.id, { content: e.target.value });
                }}
                className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[var(--color-text-primary)] font-body leading-relaxed text-sm"
                placeholder="Start typing your notes here..."
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a note to view or edit, or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
