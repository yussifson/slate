import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { format } from 'date-fns';
import {
  Scale, AlertCircle, FileText, Calendar, CheckCircle2, Search,
  Target, Users, ChevronDown, RefreshCw, Sparkles, ArrowLeft
} from 'lucide-react';
import { INTEGRATIONS } from '@/config/integrationsList';
import { OrbitLoader } from '@/components/ui/orbit-loader';

export default function DecisionLedger() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!companyId) return;
    loadDecisions();
  }, [companyId]);

  const loadDecisions = async () => {
    setLoading(true);
    try {
      // Pull items that have ai_entities with decisions detected by the AI processor
      const { data: withDecisions, error: e1 } = await supabase
        .from('clipad_imported_knowledge')
        .select('*')
        .eq('company_id', companyId)
        .not('ai_entities', 'is', null)
        .order('imported_at', { ascending: false })
        .limit(200);

      // Also pull items where the title/summary mention "decision" as fallback
      const { data: byKeyword, error: e2 } = await supabase
        .from('clipad_imported_knowledge')
        .select('*')
        .eq('company_id', companyId)
        .or('title.ilike.%decision%,ai_summary.ilike.%decided%,ai_summary.ilike.%decision%')
        .order('imported_at', { ascending: false })
        .limit(50);

      if (e1 && e2) throw e1;

      // Deduplicate & merge, prioritising items with actual AI-detected decisions
      const allItems = [...(withDecisions || []), ...(byKeyword || [])];
      const seen = new Set();
      const deduped = allItems.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      // Filter to items that have decision data in ai_entities OR matched keyword
      const filtered = deduped.filter(item => {
        const hasAiDecision =
          item.ai_entities?.decisions?.length > 0 ||
          (typeof item.ai_entities?.decisions === 'string' && item.ai_entities.decisions.trim().length > 0);

        const titleKeyword = (item.title || '').toLowerCase().includes('decision');
        const summaryKeyword = (item.ai_summary || '').toLowerCase().includes('decid');

        return hasAiDecision || titleKeyword || summaryKeyword;
      });

      setDecisions(filtered);
    } catch (err) {
      console.error('Failed to load decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDecisionText = (item) => {
    const d = item.ai_entities?.decisions;
    if (Array.isArray(d) && d.length > 0) return d;
    if (typeof d === 'string' && d.trim().length > 0) return [d];
    return null;
  };

  const filteredDecisions = decisions.filter(d =>
    (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.ai_summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.provider || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-background text-foreground pb-12 font-sans page-enter">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-amber-500/5 via-background to-background px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => navigate('/integrations')} className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors shrink-0">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Decision Ledger</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              An AI-powered ledger of every key decision extracted from your meetings, chats, docs, and tickets across all connected integrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search decisions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={loadDecisions}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8">
        {loading ? (
          <div className="flex justify-center p-12"><OrbitLoader size="md" /></div>
        ) : filteredDecisions.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-2xl bg-card max-w-2xl mx-auto mt-10">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-semibold text-foreground mb-1">No decisions found yet</h3>
            <p className="text-sm text-muted-foreground">
              As your connected integrations sync and the AI processes your documents, meetings, and messages,
              detected decisions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{filteredDecisions.length} decision record{filteredDecisions.length !== 1 ? 's' : ''} found across your knowledge base.</p>
            {filteredDecisions.map((item) => {
              const intg = INTEGRATIONS.find(i => i.id === item.provider || i.provider === item.provider);
              const aiDecisions = getDecisionText(item);

              return (
                <div key={item.id} className="bg-card border border-border rounded-2xl p-5 hover:border-amber-500/30 transition-all hover:shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <CheckCircle2 className="w-6 h-6 text-amber-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {aiDecisions ? '🤖 AI-Detected Decision' : '📄 Decision Reference'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {format(new Date(item.imported_at), 'MMM d, yyyy')}
                        </span>
                        {intg && (
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <span className="text-sm">{intg.icon}</span> {intg.name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-foreground mb-3">
                        {item.title || 'Decision Artifact'}
                      </h3>

                      {/* AI-detected decisions from ai_entities */}
                      {aiDecisions && (
                        <div className="space-y-2 mb-3">
                          {aiDecisions.slice(0, 4).map((d, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-sm text-foreground leading-relaxed">{d}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI summary as context */}
                      {item.ai_summary && (
                        <div className="bg-secondary/30 rounded-xl px-4 py-3 border border-border/50 mb-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Context</p>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {item.ai_summary}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs mt-2">
                        {item.author && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>Owner: <span className="font-medium text-foreground">{item.author}</span></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Target className="w-3.5 h-3.5" />
                          <span>Source: <span className="font-medium text-foreground capitalize">{item.provider}</span></span>
                        </div>
                        {item.content_type && (
                          <span className="capitalize text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{item.content_type}</span>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Original
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
