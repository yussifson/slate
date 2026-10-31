import React, { useState, useEffect } from 'react';
import { 
  Building2, Sparkles, CheckCircle2, ChevronRight, 
  Layers, ShieldCheck, ArrowRight, FileText, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BusinessBlueprintEngine } from '@/services/BusinessBlueprintEngine';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function BusinessBlueprintWizard({ onComplete }) {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [step, setStep] = useState(1); // 1: Profile, 2: Interpretation & Review, 3: Provisioned
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    business_name: '',
    industry_category: 'technology',
    business_model: 'b2b',
    employee_count: 15,
    needs_invoicing: true,
    needs_crm: true,
    needs_documents: true,
    custom_notes: 'Fast-growing consulting & engineering services team.'
  });

  const [generatedBlueprint, setGeneratedBlueprint] = useState(null);

  const handleGenerate = async () => {
    if (!profile.business_name) {
      toast({ title: 'Validation Error', description: 'Business Name is required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const bp = await BusinessBlueprintEngine.generateBlueprintProposal(companyId, profile);
      setGeneratedBlueprint(bp);
      setStep(2);
      toast({ title: 'Blueprint Generated', description: 'AI interpreted business structure & capability recommendations.' });
    } catch (err) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async () => {
    if (!generatedBlueprint?.id) return;
    setLoading(true);
    try {
      await BusinessBlueprintEngine.provisionApprovedBlueprint(companyId, generatedBlueprint.id, user?.id);
      setStep(3);
      toast({ title: 'Provisioning Completed', description: 'Capabilities, roles & approval policies activated.' });
      if (onComplete) onComplete();
    } catch (err) {
      toast({ title: 'Provisioning Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-[#E2E8F0]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--slate-v2-border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Business Blueprint Onboarding
            </h1>
          </div>
          <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
            Configure your organizational model, recommended capabilities, and governance policies.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`px-2.5 py-1 rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1. Profile</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className={`px-2.5 py-1 rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2. Recommendations</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className={`px-2.5 py-1 rounded-full ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3. Active</span>
        </div>
      </div>

      {step === 1 && (
        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Step 1: Organization Profile & Model</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--slate-v2-text-secondary)]">Business Legal / Operating Name</label>
                <Input 
                  value={profile.business_name}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  placeholder="e.g. Apex Meridian Advisory LLC"
                  className="mt-1 bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--slate-v2-text-secondary)]">Industry Category</label>
                <select 
                  value={profile.industry_category}
                  onChange={(e) => setProfile({ ...profile, industry_category: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-md bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white text-xs"
                >
                  <option value="technology">Technology & Engineering</option>
                  <option value="legal">Legal Practice</option>
                  <option value="real_estate">Real Estate & Property Management</option>
                  <option value="healthcare">Healthcare & Clinical Services</option>
                  <option value="consulting">Consulting & Professional Services</option>
                  <option value="logistics">Logistics & Supply Chain</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profile.needs_invoicing} 
                  onChange={(e) => setProfile({ ...profile, needs_invoicing: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Requires Billing & Invoicing</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profile.needs_crm} 
                  onChange={(e) => setProfile({ ...profile, needs_crm: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Requires CRM & Sales Pipeline</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profile.needs_documents} 
                  onChange={(e) => setProfile({ ...profile, needs_documents: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Requires Document Vault & E-Sign</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Intelligent Blueprint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && generatedBlueprint && (
        <div className="space-y-4">
          <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Step 2: Review Proposed Blueprint & Governance</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {generatedBlueprint.industry_category}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[var(--slate-v2-text-secondary)]">
                {generatedBlueprint.profile_summary}
              </p>

              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Recommended Platform Capabilities
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(generatedBlueprint.recommended_capabilities || []).map((cap) => (
                    <div key={cap.id} className="p-3 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{cap.name || cap.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase font-mono">
                          {cap.category || 'standard'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--slate-v2-text-secondary)]">{cap.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Recommended Approval Governance Policies
                </h4>
                <div className="space-y-2">
                  {(generatedBlueprint.approval_requirements || []).map((pol) => (
                    <div key={pol.key} className="p-2.5 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{pol.name}</div>
                        <div className="text-[11px] text-slate-400">Module: {pol.module} | Type: {pol.approval_type}</div>
                      </div>
                      <div className="font-mono text-amber-400">${Number(pol.threshold_amount).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-[var(--slate-v2-border-subtle)]">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white">
                  Back to Profile
                </Button>
                <Button onClick={handleProvision} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs">
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Approve & Provision Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card className="bg-[var(--slate-v2-surface-1)] border-emerald-500/30 text-white">
          <CardContent className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Business Blueprint Provisioned!</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your business structure, capabilities, approval policies, and default workflows have been activated.
            </p>
            <div className="pt-2">
              <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                Launch Modern Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
