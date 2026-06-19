import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { powerSync } from '@/api/PowerSyncConnector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Video, FileText, CheckSquare, Award } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function LessonEditorDialog({ open, onOpenChange, courseId, companyId, initialLesson = null, type = 'video', orderIndex = 0 }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState('');
  const [lessonType, setLessonType] = useState('video');

  useEffect(() => {
    if (open) {
      if (initialLesson) {
        setTitle(initialLesson.title || '');
        setDescription(initialLesson.description || '');
        setVideoUrl(initialLesson.video_url || '');
        setContent(initialLesson.content || '');
        setDuration(initialLesson.duration_minutes?.toString() || '');
        
        // Infer type
        if (initialLesson.video_url) setLessonType('video');
        else if (initialLesson.title?.toLowerCase().includes('quiz')) setLessonType('quiz');
        else if (initialLesson.title?.toLowerCase().includes('certificate')) setLessonType('certificate');
        else setLessonType('reading');
      } else {
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setContent('');
        setDuration('');
        setLessonType(type);
      }
    }
  }, [open, initialLesson, type]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (initialLesson) {
        await powerSync.execute(
          `UPDATE online_lessons SET title = ?, description = ?, video_url = ?, content = ?, duration_minutes = ?, updated_at = ? WHERE id = ?`,
          [title, description, videoUrl, content, parseInt(duration) || null, new Date().toISOString(), initialLesson.id]
        );
      } else {
        const newId = `lsn_${Math.random().toString(36).substr(2, 9)}`;
        await powerSync.execute(
          `INSERT INTO online_lessons (id, course_id, company_id, title, description, video_url, content, order_index, duration_minutes, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, courseId, companyId, title, description, videoUrl, content, orderIndex, parseInt(duration) || null, new Date().toISOString(), new Date().toISOString()]
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["online_lessons", courseId]);
      toast({ title: "Success", description: "Lesson saved successfully." });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to save lesson." });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Required", description: "Title is required." });
      return;
    }
    saveMutation.mutate();
  };

  const getTypeIcon = () => {
    switch (lessonType) {
      case 'video': return <Video className="w-5 h-5 text-primary" />;
      case 'reading': return <FileText className="w-5 h-5 text-primary" />;
      case 'quiz': return <CheckSquare className="w-5 h-5 text-primary" />;
      case 'certificate': return <Award className="w-5 h-5 text-primary" />;
      default: return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {getTypeIcon()}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {initialLesson ? 'Edit Module' : 'Create Module'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Module Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                placeholder="e.g. Introduction to the Platform"
              />
            </div>
            
            {lessonType === 'video' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Video URL</label>
                  <input 
                    type="url" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="https://vimeo.com/..."
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="e.g. 15"
                  />
                </div>
              </div>
            )}

            {(lessonType === 'reading' || lessonType === 'video') && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {lessonType === 'reading' ? 'Content' : 'Supplementary Notes'}
                </label>
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <ReactQuill 
                    theme="snow" 
                    value={content} 
                    onChange={setContent} 
                    className="min-h-[200px]"
                    placeholder="Type module content here..."
                  />
                </div>
              </div>
            )}

            {(lessonType === 'quiz' || lessonType === 'certificate') && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm">
                <p className="font-semibold mb-1">Coming Soon</p>
                <p>The dedicated assessment and certificate builders will be implemented in the next phase. For now, this module serves as a placeholder in your curriculum.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialLesson ? 'Save Changes' : 'Create Module'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
