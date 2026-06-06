import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { ArrowLeft, PlayCircle, CheckCircle2, ChevronDown, MessageSquare, BookOpen, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--color-surface-0)] relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
          
          {/* Video Placeholder */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full aspect-video bg-black relative flex items-center justify-center flex-shrink-0 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-module-online)]/20 to-transparent opacity-50" />
            <PlayCircle className="w-24 h-24 text-white/80 group-hover:text-[var(--color-module-online)] group-hover:scale-110 transition-all duration-300 cursor-pointer drop-shadow-2xl z-10" />
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end px-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <div className="flex items-center gap-3 mb-2 text-white/90 text-sm font-medium">
                <PlayCircle className="w-4 h-4 text-[var(--color-module-online)]" />
                <span>1. Introduction</span>
                <span className="ml-auto text-xs opacity-70">0:45 / 5:00</span>
              </div>
              <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer group/progress">
                <div className="h-full bg-[var(--color-module-online)] w-1/3 relative group-hover/progress:bg-blue-400 transition-colors">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow scale-0 group-hover/progress:scale-100 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Below Video */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-8 max-w-5xl mx-auto w-full relative z-10"
          >
            <div className="flex items-center gap-6 border-b border-[var(--color-border-subtle)] pb-0">
              <button onClick={() => setActiveTab('overview')} className={`px-2 py-4 font-semibold text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === 'overview' ? 'border-[var(--color-module-online)] text-[var(--color-module-online)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                Overview
              </button>
              <button onClick={() => setActiveTab('qna')} className={`px-2 py-4 font-semibold text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === 'qna' ? 'border-[var(--color-module-online)] text-[var(--color-module-online)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                Q&A
              </button>
              <button onClick={() => setActiveTab('resources')} className={`px-2 py-4 font-semibold text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === 'resources' ? 'border-[var(--color-module-online)] text-[var(--color-module-online)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                Resources
              </button>
            </div>

            <div className="py-8">
              {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="prose prose-sm max-w-none text-[var(--color-text-secondary)] leading-relaxed">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 font-display">About this lesson</h2>
                  <p>In this lesson, we will cover the foundational concepts required for the rest of the course. Make sure to download the attached resources and take notes. We'll be using practical examples throughout to solidify your understanding.</p>
                </motion.div>
              )}
              {activeTab === 'qna' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex gap-4 p-1 bg-[var(--color-surface-1)] rounded-full border border-[var(--color-border-default)] focus-within:border-[var(--color-module-online)] focus-within:ring-1 focus-within:ring-[var(--color-module-online)] transition-all">
                    <input type="text" placeholder="Ask a new question..." className="bg-transparent border-none outline-none w-full text-sm text-[var(--color-text-primary)] px-4 py-2" />
                    <button className="bg-[var(--color-module-online)] text-white rounded-full p-2.5 hover:opacity-90 transition-opacity">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-text-tertiary)] text-center py-12">No questions asked yet. Be the first!</p>
                </motion.div>
              )}
              {activeTab === 'resources' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] hover:bg-[var(--color-surface-1)] hover:border-[var(--color-module-online)] transition-all cursor-pointer group bg-[var(--color-surface-0)] glass-card">
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)] font-semibold">
                      <div className="p-2 bg-[var(--color-module-online)]/10 text-[var(--color-module-online)] rounded-md">
                        <FileText className="w-5 h-5" />
                      </div>
                      Syllabus.pdf
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] px-3 py-1 bg-[var(--color-surface-2)] rounded-full group-hover:bg-[var(--color-surface-0)] transition-colors">1.2 MB</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
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
