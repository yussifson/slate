import React, { useState } from 'react';
import { Send, Bot, Database, Sparkles, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompany } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { invokeCloudflareAi } from '@/lib/cloudflareAI';

export default function DataOracle() {
  const { company } = useCompany();
  const companyId = company?.id || null;
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "I am the Data Oracle. I have direct access to your database. Ask me questions about your patients, appointments, queues, or revenue, and I will analyze the live data for you."
    }
  ]);

  const handleQuery = async () => {
    if (!query.trim() || !companyId || isProcessing) return;

    const userQ = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setIsProcessing(true);

    try {
      // 1. Fetch relevant DB schema and some context data
      // For hospital context:
      const [patients, appointments, queues] = await Promise.all([
        powerSync.execute('SELECT COUNT(*) as c FROM univ_patients WHERE company_id = ?', [companyId]),
        powerSync.execute('SELECT COUNT(*) as c FROM univ_appointments WHERE company_id = ?', [companyId]),
        powerSync.execute('SELECT COUNT(*) as c FROM univ_opd_queues WHERE company_id = ? AND status != ?', [companyId, 'completed']),
      ]);

      const dataContext = {
        total_patients: patients.rows._array[0].c,
        total_appointments: appointments.rows._array[0].c,
        active_queues: queues.rows._array[0].c,
      };

      // 2. Ask Cloudflare AI to answer
      const systemPrompt = `You are the Data Oracle, an AI that acts as a natural language interface to a database. 
You have been provided with some top-level aggregated data. 
Answer the user's question clearly, concisely, and accurately based on the data. 
If the data provided doesn't answer the question perfectly, do your best to infer or explain that you need more specific table access.
Current DB Context: ${JSON.stringify(dataContext)}`;

      const response = await invokeCloudflareAi(userQ, systemPrompt);
      const answer = typeof response === 'string' ? response : (response?.response || response?.text || JSON.stringify(response));

      setMessages(prev => [...prev, { role: 'ai', content: answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "An error occurred while communicating with the Oracle. Please try again." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold">Data Oracle</h3>
          <p className="text-xs text-slate-500">Natural Language Database Querying</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-blue-600 text-white'}`}>
              {msg.role === 'user' ? <Search className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white dark:bg-slate-800 border rounded-tl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white border rounded-tl-none flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Querying the database...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white dark:bg-slate-950">
        <form onSubmit={(e) => { e.preventDefault(); handleQuery(); }} className="flex gap-2">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., How many active patients do we have in the OPD queue?"
            className="flex-1"
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing || !query.trim()} className="gap-2">
            <Send className="w-4 h-4" /> Ask
          </Button>
        </form>
      </div>
    </div>
  );
}
