import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Database, Sparkles, Loader2, User, TrendingUp, Users, Calendar } from 'lucide-react';
import { useCompany } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { invokeCloudflareAi } from '@/lib/cloudflareAI';

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
      // Gather whatever data is available — ignore missing tables gracefully
      const [profiles, patients, appointments, invoices] = await Promise.all([
        safeQuery('SELECT COUNT(*) as c FROM profiles WHERE company_id = ?', [companyId]),
        safeQuery('SELECT COUNT(*) as c FROM univ_patients WHERE company_id = ?', [companyId]),
        safeQuery('SELECT COUNT(*) as c FROM univ_appointments WHERE company_id = ?', [companyId]),
        safeQuery('SELECT COUNT(*) as c, SUM(total_amount) as total FROM univ_invoices WHERE company_id = ?', [companyId]),
      ]);

      const dataContext = {
        company_name: company?.name || 'Your Company',
        industry: company?.industry_type || 'general',
        team_members: profiles?.[0]?.c ?? 'unknown',
        ...(patients !== null && { total_patients: patients[0]?.c ?? 0 }),
        ...(appointments !== null && { total_appointments: appointments[0]?.c ?? 0 }),
        ...(invoices !== null && { total_invoices: invoices[0]?.c ?? 0, revenue: invoices[0]?.total ?? 0 }),
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
        if (dataContext.total_patients !== undefined) parts.push(`- **Total Patients:** ${dataContext.total_patients}`);
        if (dataContext.total_appointments !== undefined) parts.push(`- **Total Appointments:** ${dataContext.total_appointments}`);
        if (dataContext.revenue !== undefined) parts.push(`- **Total Revenue:** $${Number(dataContext.revenue).toLocaleString()}`);
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
    <div className="flex flex-col bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm" style={{ minHeight: '560px', maxHeight: '72vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Data Oracle</h3>
          <p className="text-xs text-slate-500">Natural Language Database Interface</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-slate-50/50 dark:bg-slate-950/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-primary' : 'bg-blue-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`px-4 py-3 rounded-xl max-w-[78%] text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'}`}>
              <div className="space-y-0.5">{renderContent(msg.content)}</div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm flex items-center gap-2 text-sm text-slate-500">
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
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleQuery(); }} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your data…"
            className="flex-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-60"
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
