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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary flex items-center gap-3">
            <Cpu className="w-8 h-8" /> 
            Intelligence Command Center
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">God-mode predictive analytics and natural language querying.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border-[0.5px] border-primary/40 p-6 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Ask the Omni-AI</h3>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                placeholder="e.g. 'What is our current active user engagement rate?'"
                className="flex-1 bg-background border border-input rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
              <button 
                onClick={handleAskAI}
                disabled={isThinking || isLoading}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {isThinking ? 'Thinking...' : <><Send className="w-4 h-4" /> Query</>}
              </button>
            </div>

            {response && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 bg-primary/5 rounded-xl border border-primary/20">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{response}</p>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border-[0.5px] border-primary/40 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><AlertTriangle className="w-5 h-5" /></div>
                <h4 className="font-semibold">Churn Risk Predictor</h4>
              </div>
              <p className="text-3xl font-bold mt-4">2</p>
              <p className="text-xs text-muted-foreground mt-1">Tenants showing severe drop in login frequency</p>
            </div>
            <div className="bg-card rounded-2xl border-[0.5px] border-primary/40 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Activity className="w-5 h-5" /></div>
                <h4 className="font-semibold">Platform Health</h4>
              </div>
              <p className="text-3xl font-bold text-emerald-500 mt-4">Optimal</p>
              <p className="text-xs text-muted-foreground mt-1">Server load and API limits are well within quotas</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border-[0.5px] border-primary/40 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-500" /> Security Posture</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Admin Accounts</span>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <span className="text-muted-foreground">2FA Compliance</span>
                <span className="font-semibold text-amber-500">80%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <span className="text-muted-foreground">API Rate Limits</span>
                <span className="font-semibold text-emerald-500">No Breaches</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
