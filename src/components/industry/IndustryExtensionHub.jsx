import React, { useState, useEffect } from 'react';
import { 
  Building2, Scale, HeartPulse, GraduationCap, Truck, 
  CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, 
  ChevronRight, ExternalLink, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndustryExtensionService } from '@/services/IndustryExtensionService';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function IndustryExtensionHub({ onNavigateToIndustry }) {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [catalog, setCatalog] = useState([]);
  const [installed, setInstalled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cat, inst] = await Promise.all([
        IndustryExtensionService.getCatalog(),
        IndustryExtensionService.getInstalledIndustries(companyId)
      ]);
      setCatalog(cat);
      setInstalled(inst);
    } catch (err) {
      console.error('Failed to load industry packs:', err);
    } finally {
      setLoading(false);
    }
  };

  const isInstalled = (industryId) => {
    return installed.some(i => i.id === industryId && i.status === 'active');
  };

  const handleInstall = async (industryId) => {
    setProcessingId(industryId);
    try {
      await IndustryExtensionService.installIndustry(companyId, industryId, {}, user?.id);
      toast({
        title: 'Industry Extension Activated',
        description: `Successfully configured and activated industry pack.`
      });
      loadData();
    } catch (err) {
      toast({
        title: 'Activation Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getIcon = (id) => {
    switch (id) {
      case 'legal_practice': return <Scale className="w-5 h-5 text-indigo-400" />;
      case 'real_estate': return <Building2 className="w-5 h-5 text-emerald-400" />;
      case 'healthcare': return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'education': return <GraduationCap className="w-5 h-5 text-amber-400" />;
      case 'logistics': return <Truck className="w-5 h-5 text-sky-400" />;
      default: return <Layers className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="w-full space-y-6 text-[#E2E8F0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--slate-v2-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Industry Extension Packs
          </h1>
          <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
            Tailor Slate V2 with vertical entities, specialized workflows, and industry-specific terminology.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Architecture: <span className="text-indigo-400 font-semibold">Shared Platform Foundation</span>
        </div>
      </div>

      {/* Extension Packs Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
          Loading verified industry extension catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map((ext) => {
            const active = isInstalled(ext.id);
            const isProcessing = processingId === ext.id;

            return (
              <Card 
                key={ext.id}
                className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] hover:border-indigo-500/30 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)]">
                      {getIcon(ext.id)}
                    </div>
                    {active ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/30 text-slate-400 border border-slate-600/30">
                        Available v{ext.version || '2.0'}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-sm font-bold text-white mt-3">
                    {ext.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  <p className="text-[var(--slate-v2-text-secondary)] leading-relaxed">
                    {ext.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-[var(--slate-v2-border-subtle)]">
                    <div className="text-[10px] uppercase font-mono text-slate-400">
                      Required Foundations:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(ext.required_capabilities || []).map((req) => (
                        <span key={req} className="px-2 py-0.5 rounded bg-[var(--slate-v2-surface-2)] text-[10px] font-mono text-indigo-300">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--slate-v2-border-subtle)] flex items-center justify-between">
                    {active ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onNavigateToIndustry && onNavigateToIndustry(ext.id)}
                        className="w-full text-xs gap-1.5 bg-[var(--slate-v2-surface-2)] text-white hover:bg-[var(--slate-v2-surface-3)]"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Operating Workspace
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleInstall(ext.id)}
                        disabled={isProcessing}
                        className="w-full text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                        Activate Extension Pack
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
