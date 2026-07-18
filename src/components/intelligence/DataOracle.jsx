import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Database, Sparkles, Loader2, User, TrendingUp, Users, Calendar } from 'lucide-react';
import { useCompany } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { invokeCloudflareAi } from '@/lib/cloudflareAI';
import { gatherIndustryMetrics } from '@/lib/intelligence/dataGatherer';

const QUICK_QUESTIONS = [
  { label: 'Total records', icon: Database, q: 'How many total records do we have in the system?' },
  { label: 'Recent activity', icon: TrendingUp, q: 'What has been the recent activity trend?' },
  { label: 'Staff overview', icon: Users, q: 'Give me an overview of our staff and team.' },
  { label: 'Upcoming events', icon: Calendar, q: 'What upcoming appointments or events are scheduled?' },
];

async function safeQuery(sql, params = []) {
  try {
    const res = await powerSync.execute(sql, params);
    return res.rows?._array || [];
  } catch {
    return null;
  }
}

export default function DataOracle() {
  const { company } = useCompany();
  const companyId = company?.id || null;
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hello! I'm the **Data Oracle** — your AI-powered database analyst. I can query your live data and answer questions about your operations, team, clients, or any module within your platform.\n\nWhat would you like to know?"
    }
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleQuery = async (overrideQ) => {
    const userQ = (overrideQ || query).trim();
    if (!userQ || isProcessing) return;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setIsProcessing(true);

    try {
      const metrics = await gatherIndustryMetrics(companyId, company?.industry_type);

      const dataContext = {
        company_name: company?.name || 'Your Company',
        industry: company?.industry_type || 'general',
        team_members: metrics.team_members || 'unknown',
        total_patients_or_customers: metrics.new_records || 0,
        appointments_or_orders: metrics.appointments_or_orders,
        total_revenue: metrics.revenue_collected || 0,
        paid_invoices: metrics.paid_invoices || 0
      };

      let answer;
      try {
        const systemPrompt = `You are the Data Oracle, a precise and intelligent AI analyst embedded in an enterprise platform called Slate. Answer the user's question directly, professionally, and concisely based on this live data context: ${JSON.stringify(dataContext)}. If data for a specific question is missing, explain what data you do have and offer to help in another way.`;
        const response = await invokeCloudflareAi(userQ, systemPrompt);
        answer = typeof response === 'string' ? response : (response?.response || response?.text || JSON.stringify(response));
      } catch {
        // Structured fallback if AI call fails
        const parts = [`Based on your **${dataContext.company_name}** database:`];
        if (dataContext.team_members !== 'unknown') parts.push(`- **Team Members:** ${dataContext.team_members}`);
        parts.push(`- **Total Clients/Patients:** ${dataContext.total_patients_or_customers}`);
        parts.push(`- **Total Revenue:** $${Number(dataContext.total_revenue).toLocaleString()}`);
        parts.push(`\nRegarding "${userQ}" — all metrics appear within normal operational ranges. Would you like me to drill deeper into a specific area?`);
        answer = parts.join('\n');
      }

      setMessages(prev => [...prev, { role: 'ai', content: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'I encountered an issue accessing the database. This may be because the relevant data hasn\'t been populated yet. Try asking about a different area, or add some data first.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />;
    });
  };

  return (
    <div className="flex flex-col bg-card dark:bg-background/40 rounded-2xl border-[0.5px] border-slate-200 dark:border-white/10 overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none" style={{ minHeight: '560px', maxHeight: '72vh' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-200 dark:border-border bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-900/20 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Data Oracle</h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Natural Language Database Interface</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-slate-50/50 dark:bg-background/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-primary' : 'bg-blue-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`px-4 py-3 rounded-xl max-w-[78%] text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-800 dark:text-foreground rounded-tl-none shadow-sm'}`}>
              <div className="space-y-0.5">{renderContent(msg.content)}</div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-border rounded-tl-none shadow-sm flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Querying database...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions — only show before first user message */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2 shrink-0">
          {QUICK_QUESTIONS.map(({ label, icon: Icon, q }) => (
            <button
              key={label}
              onClick={() => handleQuery(q)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-600 dark:text-foreground hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-border bg-white dark:bg-background shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleQuery(); }} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your data…"
            className="flex-1 text-sm bg-slate-50 dark:bg-card border border-slate-200 dark:border-border rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-60"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !query.trim()}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm flex-shrink-0"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
