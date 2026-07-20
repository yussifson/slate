import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { format } from 'date-fns';
import { 
  Scale, AlertCircle, FileText, Calendar, CheckCircle2, Search, Target, Users
} from 'lucide-react';
import { OrbitLoader } from '@/components/ui/orbit-loader';

export default function DecisionLedger() {
  const { user } = useAuth();
  const companyId = useCompanyId();
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
      // Find anything that looks like a decision in the imported knowledge
      const { data, error } = await supabase
        .from('clipad_imported_knowledge')
        .select('*')
        .eq('company_id', companyId)
        .or('title.ilike.%decision%,ai_summary.ilike.%decision%,content.ilike.%decision%,content_type.ilike.%decision%')
        .order('imported_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDecisions(data || []);
    } catch (err) {
      console.error('Failed to load decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDecisions = decisions.filter(d => 
    (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.ai_summary || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-background text-foreground pb-12 font-sans page-enter">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-amber-500/5 via-background to-background px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Decision Ledger</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              An immutable ledger of organizational decisions extracted automatically from your meetings, chats, and documents.
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8">
        {loading ? (
          <div className="flex justify-center p-12"><OrbitLoader size="md" /></div>
        ) : filteredDecisions.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-2xl bg-card max-w-2xl mx-auto mt-10">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-semibold text-foreground mb-1">No decisions found</h3>
            <p className="text-sm text-muted-foreground">We couldn't detect any explicit decisions in your recent synced knowledge base. As you sync more meetings and strategy docs, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDecisions.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-5 hover:border-amber-500/30 transition-all hover:shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <CheckCircle2 className="w-6 h-6 text-amber-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Recorded Decision</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {format(new Date(item.imported_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {item.title || 'Decision Artifact'}
                    </h3>
                    
                    <div className="bg-secondary/30 rounded-xl p-4 border border-border/50 mb-3">
                      <p className="text-sm text-foreground leading-relaxed">
                        {item.ai_summary || item.content?.substring(0, 200) + '...'}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs">
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
                      
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Original Context
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
