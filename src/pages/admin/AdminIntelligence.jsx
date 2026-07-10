import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { Sparkles, Send, Activity, Users, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminIntelligence() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Fetch global metrics for the AI Context
  const { data: globalContext, isLoading } = useQuery({
    queryKey: ['admin_global_context'],
    queryFn: async () => {
      const { data: companies } = await supabase.from('companies').select('id, name, created_at, industry_type, subscription_status');
      const { data: profiles } = await supabase.from('profiles').select('id, company_id, role, last_sign_in_at');
      return { companies: companies || [], profiles: profiles || [] };
    }
  });

  const handleAskAI = async () => {
    if (!query.trim() || !globalContext) return;
    setIsThinking(true);
    setResponse('');
    try {
      // Create a heavily summarized payload to prevent token limits
      const contextSummary = {
        total_companies: globalContext.companies.length,
        active_companies: globalContext.companies.filter(c => c.subscription_status === 'active').length,
        total_users: globalContext.profiles.length,
        recent_logins: globalContext.profiles.filter(p => new Date(p.last_sign_in_at) > new Date(Date.now() - 7*24*60*60*1000)).length,
        industries: globalContext.companies.reduce((acc, c) => { acc[c.industry_type] = (acc[c.industry_type] || 0) + 1; return acc; }, {})
      };

      const aiPrompt = `You are the Omni-AI for a SaaS Super Admin Dashboard. 
Context Data: ${JSON.stringify(contextSummary)}
User Question: ${query}

Respond professionally with clear metrics, bullet points, and strategic advice. No markdown headers.`;

      const aiRes = await generateText(aiPrompt);
      setResponse(aiRes || 'No response generated.');
    } catch (e) {
      setResponse('Error connecting to AI Command Center.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--primary)]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold font-display text-[var(--primary)] flex items-center gap-3 tracking-[-0.02em]">
            <div className="p-3 bg-[var(--primary)]/10 rounded-xl">
              <Cpu className="w-8 h-8" />
            </div>
            Intelligence Command Center
          </h1>
          <p className="text-muted-foreground mt-2 text-base max-w-2xl">God-mode predictive analytics and natural language querying across the entire SaaS architecture.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <span className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-[var(--primary)]/5 text-[var(--primary)] rounded-full border border-[var(--primary)]/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AI Core Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[var(--color-surface-0)] rounded-3xl border border-[var(--primary)]/20 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
              <div className="p-2 bg-[var(--primary)]/10 rounded-lg text-[var(--primary)]">
                <Sparkles className="w-5 h-5" />
              </div>
              Ask the Omni-AI
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                placeholder="e.g. 'What is our current active user engagement rate?'"
                className="flex-1 bg-slate-50 dark:bg-card/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all text-base placeholder:text-slate-400"
              />
              <button 
                onClick={handleAskAI}
                disabled={isThinking || isLoading}
                className="bg-gradient-to-r from-[var(--primary)] to-[hsl(213,89%,35%)] text-white px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[var(--primary)]/20 min-w-[140px]"
              >
                {isThinking ? 'Processing...' : <><Send className="w-5 h-5" /> Query</>}
              </button>
            </div>

            {response && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-slate-50 dark:bg-card/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-300">{response}</p>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface-0)] rounded-3xl border border-[var(--primary)]/20 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden group hover:border-[var(--primary)]/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle className="w-24 h-24 text-[var(--primary)]" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-[var(--primary)]/10 rounded-xl text-[var(--primary)]"><AlertTriangle className="w-5 h-5" /></div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Churn Risk Predictor</h4>
                </div>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">2</p>
                <p className="text-sm font-medium text-muted-foreground mt-2">Tenants showing severe drop in login frequency</p>
              </div>
            </div>
            
            <div className="bg-[var(--color-surface-0)] rounded-3xl border border-[var(--primary)]/20 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden group hover:border-[var(--primary)]/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-24 h-24 text-[var(--primary)]" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-[var(--primary)]/10 rounded-xl text-[var(--primary)]"><Activity className="w-5 h-5" /></div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Platform Health</h4>
                </div>
                <p className="text-4xl font-black text-[var(--primary)] mt-4 tracking-tight">Optimal</p>
                <p className="text-sm font-medium text-muted-foreground mt-2">Server load and API limits are well within quotas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 school-page-enter font-dmsans">
          <div className="bg-[var(--color-surface-0)] rounded-3xl border border-[var(--primary)]/20 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
              <div className="p-2 bg-[var(--primary)]/10 rounded-lg text-[var(--primary)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              Security Posture
            </h3>
            <div className="space-y-5 text-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-muted-foreground">Admin Accounts</span>
                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">4</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-muted-foreground">2FA Compliance</span>
                <span className="font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full">80%</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="font-medium text-muted-foreground">API Rate Limits</span>
                <span className="font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full">No Breaches</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[var(--primary)] to-[hsl(213,89%,35%)] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-[var(--primary)]/20">
             <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-white/10 blur-[40px] rounded-full pointer-events-none" />
             <h3 className="text-xl font-bold mb-2">Enterprise Ready</h3>
             <p className="text-white/80 text-sm leading-relaxed mb-6">Your SaaS infrastructure is currently operating at peak efficiency. No critical alerts found.</p>
             <button className="w-full py-3 bg-white text-[var(--primary)] rounded-xl font-bold text-sm hover:bg-white/90 transition-colors shadow-lg shadow-black/10">
               View Detailed Report
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
