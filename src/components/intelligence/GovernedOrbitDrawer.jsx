import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, Lock, AlertTriangle, CheckCircle2, 
  Send, RefreshCw, X, FileText, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GovernedOrbitExecutionGate, GovernedOrbitToolRegistry } from '@/services/GovernedOrbitService';
import { NaturalLanguageQueryService } from '@/services/NaturalLanguageQueryService';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function GovernedOrbitDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'orbit',
      text: 'Hello, I am Orbit. I can help search business records, surface operational exceptions, and prepare action plans within your authorized governance boundaries.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [pendingPreview, setPendingPreview] = useState(null);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userText = inputPrompt;
    setInputPrompt('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      // 1. Process Natural Language Query with Provenance
      const queryResult = await NaturalLanguageQueryService.executeNaturalLanguageQuery(companyId, userText, user);
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'orbit',
          text: queryResult.summary,
          data: queryResult.data,
          provenance: queryResult.provenance
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'orbit',
          text: `Orbit was unable to process request: ${err.message}`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[var(--slate-v2-surface-1)] border-l border-[var(--slate-v2-border-subtle)] shadow-2xl z-50 flex flex-col text-[#E2E8F0]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--slate-v2-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              Orbit Co-Pilot <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Governed</span>
            </h2>
            <p className="text-[10px] text-slate-400">Deterministic Governance Gate</p>
          </div>
        </div>

        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-md">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-3 rounded-xl max-w-[85%] ${
              m.sender === 'user'
                ? 'bg-indigo-600 text-white'
                : m.isError
                ? 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
                : 'bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-slate-200'
            }`}>
              <p className="leading-relaxed">{m.text}</p>
              {m.provenance && (
                <div className="mt-2 pt-2 border-t border-[var(--slate-v2-border-subtle)] text-[10px] font-mono text-slate-400">
                  Verified Provenance: {m.provenance}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            Orbit is evaluating authorized business context...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--slate-v2-border-subtle)] bg-[var(--slate-v2-surface-2)]">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask Orbit or propose an action..."
            className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white text-xs h-9"
          />
          <Button type="submit" size="sm" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-3">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
