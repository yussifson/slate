import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Video, FileText, UploadCloud, Settings, MonitorPlay } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function LessonBuilder() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState('video');
  const [textContent, setTextContent] = useState('');

  const handleSave = () => {
    if (!lessonTitle.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Lesson title is required." });
      return;
    }
    toast({ title: "Success", description: "Lesson saved successfully!" });
    // Navigate back to builder
    navigate(`/o/builder/course/${courseId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-semibold text-[var(--text-2xl)] text-[var(--color-text-primary)] tracking-tight">
            {moduleId ? 'Edit Lesson' : 'Create New Lesson'}
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Configure your lesson content and media.</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-module-online)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" /> Save Lesson
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm p-6">
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Lesson Title</label>
            <input 
              type="text" 
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g., Introduction to the Platform" 
              className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-module-online)] focus:ring-1 focus:ring-[var(--color-module-online)] font-body"
            />
          </div>

          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
            <div className="flex border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-2 gap-2">
              <button 
                onClick={() => setLessonType('video')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-[var(--radius-md)] flex justify-center items-center gap-2 transition-colors ${lessonType === 'video' ? 'bg-[var(--color-surface-0)] shadow text-[var(--color-module-online)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                <Video className="w-4 h-4" /> Video Content
              </button>
              <button 
                onClick={() => setLessonType('text')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-[var(--radius-md)] flex justify-center items-center gap-2 transition-colors ${lessonType === 'text' ? 'bg-[var(--color-surface-0)] shadow text-[var(--color-module-online)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                <FileText className="w-4 h-4" /> Text Content
              </button>
            </div>

            <div className="p-6">
              {lessonType === 'video' ? (
                <div className="border-2 border-dashed border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-12 flex flex-col items-center justify-center text-center hover:border-[var(--color-module-online)] transition-colors cursor-pointer bg-[var(--color-surface-1)]">
                  <div className="w-16 h-16 bg-[var(--color-surface-0)] rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <UploadCloud className="w-8 h-8 text-[var(--color-module-online)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Upload Video</h3>
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1 max-w-sm">
                    Drag and drop your MP4 file here, or click to browse. Max file size: 2GB.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Article Body</label>
                  <textarea 
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={12}
                    className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-module-online)] focus:ring-1 focus:ring-[var(--color-module-online)] font-body"
                    placeholder="Write your lesson content here..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm p-5">
            <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-[var(--color-text-tertiary)]" /> Lesson Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                  <span>Is this a free preview?</span>
                  <input type="checkbox" className="rounded text-[var(--color-module-online)] focus:ring-[var(--color-module-online)]" />
                </label>
              </div>
              <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                <label className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                  <span>Enable Discussions</span>
                  <input type="checkbox" defaultChecked className="rounded text-[var(--color-module-online)] focus:ring-[var(--color-module-online)]" />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-5 flex items-start gap-4">
            <MonitorPlay className="w-8 h-8 text-[var(--color-module-online)] flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Preview Layout</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                Save your lesson to preview how it will look in the Learning Player for your students.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
