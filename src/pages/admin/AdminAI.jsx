import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Bot, ArrowRight, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminAI() {
  const triggerAI = () => {
    document.getElementById('global-ai-trigger')?.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <PageHeader 
        title="Master AI Intelligence" 
        subtitle="Platform-wide AI assistant with elevated privileges." 
      />

      <div className="flex-1 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl border border-indigo-800/50 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center p-12">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 space-y-8 max-w-xl mx-auto">
          <div className="mx-auto w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_50px_-12px_rgba(99,102,241,0.5)]">
            <Bot className="w-12 h-12 text-indigo-400" />
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              Optalflow Core AI
            </h2>
            <p className="text-indigo-200/80 leading-relaxed text-lg">
              The AI Agent operates with master privileges in this ecosystem. It can analyze cross-tenant data, aggregate global metrics, and provide administrative insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
              <p className="text-sm font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Global Analytics
              </p>
              <p className="text-xs text-indigo-100/70">"Which top 5 firms have the highest case velocity this month?"</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
              <p className="text-sm font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Usage Monitoring
              </p>
              <p className="text-xs text-indigo-100/70">"List firms that are within 90% of their subscription limits."</p>
            </div>
          </div>

          <Button 
            onClick={triggerAI}
            className="h-14 px-8 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-900/50 text-lg flex items-center gap-2 mx-auto transition-all hover:scale-105"
          >
            Summon Master Agent <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
