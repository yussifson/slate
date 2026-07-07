import React, { useState, useEffect } from 'react';
import { ToggleRight, Globe, Power, PowerOff, Loader2, Save, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { INDUSTRIES } from '@/config/industries';
import { useAuth } from '@/lib/AuthContext';
import { useIndustryRollout, saveIndustryRollout } from '@/hooks/useIndustryRollout';
import { useToast } from '@/components/ui/use-toast';

// All industries available in the platform
const ALL_PLATFORM_INDUSTRIES = [
  { key: 'law',         name: 'Law Firm',                icon: '⚖️',  description: 'Legal case management, billing, conflict checks' },
  { key: 'school',      name: 'School & Education',      icon: '🏫',  description: 'Student management, timetables, fee collection' },
  { key: 'hospital',    name: 'Hospital & Healthcare',   icon: '🏥',  description: 'Patient records, appointments, ward management' },
  { key: 'hotel',       name: 'Hotel & Hospitality',     icon: '🏨',  description: 'Room bookings, housekeeping, POS & F&B' },
  { key: 'logistics',   name: 'Logistics & Delivery',    icon: '🚚',  description: 'Fleet management, shipments, driver tracking' },
  { key: 'insurance',   name: 'Insurance Agency',        icon: '🛡️',  description: 'Policy management, claims, renewals' },
  { key: 'religion',    name: 'Religious Organization',  icon: '⛪',  description: 'Member management, events, tithe & offerings' },
  { key: 'hr',          name: 'HR & ERP',                icon: '👥',  description: 'Payroll, leave management, performance reviews' },
  { key: 'retail',      name: 'Retail / POS',            icon: '🛒',  description: 'Point of sale, inventory, purchase orders' },
  { key: 'real_estate', name: 'Real Estate',             icon: '🏠',  description: 'Properties, listings, transactions, leases' },
];

export default function AdminRollout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { enabledIndustries, loading: rolloutLoading, refetch } = useIndustryRollout(user);

  // Local working state (toggled before saving)
  const [localState, setLocalState] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync local state when rollout data loads
  useEffect(() => {
    if (!rolloutLoading) {
      setLocalState({ ...enabledIndustries });
      setDirty(false);
    }
  }, [rolloutLoading, enabledIndustries]);

  const handleToggle = (key) => {
    setLocalState(prev => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await saveIndustryRollout(localState);
      if (error) throw error;
      toast({
        title: '✅ Rollout saved',
        description: 'Industry visibility has been updated for all users.',
      });
      setDirty(false);
      refetch();
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err.message || 'Could not save rollout state.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalState({ ...enabledIndustries });
    setDirty(false);
  };

  const enabledCount = Object.values(localState).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary flex items-center gap-3">
            <ToggleRight className="w-8 h-8" />
            Industry Rollout Manager
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Control which industries are visible to users during onboarding and industry switching.
            <span className="ml-1 font-medium text-foreground">{enabledCount} of {ALL_PLATFORM_INDUSTRIES.length} enabled.</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              dirty
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <div className="text-sm">
          <span className="font-semibold text-amber-700 dark:text-amber-400">Super Admin visibility:</span>
          <span className="text-muted-foreground ml-1">
            You always see all industries regardless of rollout status. Toggling an industry OFF hides it only from regular users.
          </span>
        </div>
      </div>

      {/* Industry Cards */}
      {rolloutLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3">
          {ALL_PLATFORM_INDUSTRIES.map((industry, idx) => {
            const isOn = localState[industry.key] !== false;
            return (
              <motion.div
                key={industry.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-card rounded-2xl border-[0.5px] p-5 flex items-center justify-between transition-all hover:shadow-md ${
                  isOn
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                    : 'border-rose-500/20 opacity-70'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{industry.icon}</span>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      {industry.name}
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          isOn
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isOn ? 'Live' : 'Hidden'}
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground">{industry.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      {isOn ? 'Visible in onboarding & industry switcher' : 'Hidden from all regular users'}
                    </div>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => handleToggle(industry.key)}
                  className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    isOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  title={isOn ? 'Click to hide from users' : 'Click to make visible to users'}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center ${
                      isOn ? 'left-8' : 'left-1'
                    }`}
                  >
                    {isOn
                      ? <Power className="w-2.5 h-2.5 text-emerald-500" />
                      : <PowerOff className="w-2.5 h-2.5 text-slate-400" />
                    }
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unsaved changes banner */}
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-2xl shadow-lg px-5 py-3 flex items-center gap-3 z-50"
        >
          <span className="text-sm font-medium">Unsaved changes</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Save now'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
