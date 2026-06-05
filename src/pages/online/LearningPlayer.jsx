import React from 'react';
import { PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, FileText } from 'lucide-react';

export default function LearningPlayer() {
  return (
    <div className="h-[calc(100vh-64px)] bg-void flex font-body text-text-primary overflow-hidden">
      
      {/* Sidebar Curriculum */}
      <div className="w-80 border-r border-border bg-overlay flex flex-col shrink-0">
          <div className="p-6 border-b border-border">
              <div className="text-xs font-bold text-orbit mb-1 tracking-wider uppercase">Course</div>
              <h2 className="text-lg font-display font-medium text-white leading-tight">Advanced React Patterns</h2>
              <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-orbit w-[35%]"></div>
                  </div>
                  <div className="text-xs text-text-muted font-mono">35%</div>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 px-2">Module 1: Introduction</h3>
                  <div className="space-y-1">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-orbit/10 text-orbit-light cursor-pointer">
                          <PlayCircle className="w-4 h-4 shrink-0 text-orbit" />
                          <span className="text-sm font-medium">1.1 Welcome to the Course</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface text-text-secondary cursor-pointer">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                          <span className="text-sm">1.2 Prerequisites Setup</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col bg-deep relative">
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
              {/* Video Player Placeholder */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200')] bg-cover bg-center opacity-40"></div>
              <div className="w-20 h-20 rounded-full bg-orbit/90 text-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-2xl relative z-10 backdrop-blur-sm">
                  <PlayCircle className="w-10 h-10 ml-1" />
              </div>
              <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-black to-transparent"></div>
          </div>
          
          {/* Below Video Info */}
          <div className="h-64 border-t border-border bg-overlay p-8 overflow-y-auto custom-scrollbar shrink-0">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h1 className="text-2xl font-display font-medium text-white mb-2">1.1 Welcome to the Course</h1>
                      <p className="text-text-secondary text-sm max-w-3xl leading-relaxed">
                          In this lesson, we will cover the foundational concepts of React hooks, context, and why certain patterns emerge in large codebases.
                      </p>
                  </div>
                  <div className="flex gap-2">
                      <button className="p-2 border border-border rounded-lg text-text-secondary hover:text-white transition-colors">
                          <MessageSquare className="w-5 h-5" />
                      </button>
                      <button className="p-2 border border-border rounded-lg text-text-secondary hover:text-white transition-colors">
                          <FileText className="w-5 h-5" />
                      </button>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
}
