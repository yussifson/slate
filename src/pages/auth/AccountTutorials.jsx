import React from 'react';
import { BookOpen, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountTutorials() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-card flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        <div className="bg-white dark:bg-card p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
          
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-pink-500/5 dark:from-orange-500/10 dark:to-pink-500/10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-6 ring-8 ring-orange-50/50 dark:ring-orange-900/10">
              <BookOpen className="w-10 h-10" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              Tutorials & Guides
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              We're currently producing high-quality video tutorials and step-by-step guides for all Optavel ecosystem products. They will be available here soon.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 mb-8 bg-orange-50 dark:bg-orange-900/20 py-2 px-4 rounded-full w-max mx-auto">
              <Clock className="w-4 h-4" /> Coming Soon
            </div>
            
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
