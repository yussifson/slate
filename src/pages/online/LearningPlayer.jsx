import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { ArrowLeft, PlayCircle, CheckCircle2, ChevronDown, MessageSquare, BookOpen, FileText } from 'lucide-react';

export default function LearningPlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: course } = useQuery({
    queryKey: ["case", courseId],
    queryFn: () => base44.entities.LegalCase.get(courseId),
    enabled: !!courseId && !!companyId
  });

  const courseTitle = course?.title || 'Loading Course...';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-in fade-in duration-500 bg-[var(--color-surface-0)]">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-semibold text-[var(--color-text-primary)] truncate pr-4 border-r border-[var(--color-border-default)]">
          {courseTitle}
        </h1>
        <div className="ml-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-module-online)]">Module 1:</span> Introduction
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Player Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video Placeholder */}
          <div className="w-full aspect-video bg-black relative flex items-center justify-center flex-shrink-0 group">
            <PlayCircle className="w-20 h-20 text-white/80 group-hover:text-white group-hover:scale-110 transition-all cursor-pointer shadow-xl rounded-full" />
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/60 to-transparent flex items-end px-4 pb-3">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full bg-[var(--color-module-online)] w-1/3"></div>
              </div>
            </div>
          </div>

          {/* Content Below Video */}
          <div className="p-6 max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-4 border-b border-[var(--color-border-subtle)] pb-4">
              <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-[var(--color-module-online)] text-[var(--color-module-online)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                Overview
              </button>
              <button onClick={() => setActiveTab('qna')} className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'qna' ? 'border-[var(--color-module-online)] text-[var(--color-module-online)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                Q&A
              </button>
              <button onClick={() => setActiveTab('resources')} className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'resources' ? 'border-[var(--color-module-online)] text-[var(--color-module-online)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                Resources
              </button>
            </div>

            <div className="py-6">
              {activeTab === 'overview' && (
                <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)]">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">About this lesson</h2>
                  <p>In this lesson, we will cover the foundational concepts required for the rest of the course. Make sure to download the attached resources and take notes.</p>
                </div>
              )}
              {activeTab === 'qna' && (
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 bg-[var(--color-surface-1)] rounded-[var(--radius-md)] border border-[var(--color-border-default)]">
                    <MessageSquare className="w-5 h-5 text-[var(--color-text-tertiary)] flex-shrink-0" />
                    <input type="text" placeholder="Ask a new question..." className="bg-transparent border-none outline-none w-full text-sm text-[var(--color-text-primary)]" />
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">No questions asked yet. Be the first!</p>
                </div>
              )}
              {activeTab === 'resources' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-1)] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)] font-medium">
                      <FileText className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-module-online)]" />
                      Syllabus.pdf
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)]">1.2 MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Curriculum */}
        <div className="w-80 border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="font-bold text-[var(--color-text-primary)]">Course Content</h2>
            <div className="w-full bg-[var(--color-border-default)] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[var(--color-module-online)] h-full w-1/3"></div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">33% Complete</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Module 1 */}
            <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer bg-[var(--color-surface-2)]">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Module 1</h3>
                <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)]">
                <button className="w-full flex items-start gap-3 p-3 text-left hover:bg-[var(--color-surface-1)] transition-colors bg-[var(--color-surface-1)] border-l-2 border-[var(--color-module-online)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">1. Introduction</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">5:00</p>
                  </div>
                </button>
                <button className="w-full flex items-start gap-3 p-3 text-left hover:bg-[var(--color-surface-1)] transition-colors">
                  <PlayCircle className="w-4 h-4 text-[var(--color-text-tertiary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)]">2. Setup Environment</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">12:30</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Module 2 */}
            <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden opacity-70">
              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--color-surface-1)] transition-colors">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Module 2</h3>
                <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)] -rotate-90" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
