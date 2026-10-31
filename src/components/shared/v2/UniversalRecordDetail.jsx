import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { IdentityResolutionService } from '@/services/IdentityResolutionService';
import { CorePartyService } from '@/services/CorePartyService';
import SlateDrawer from '@/components/ui/v2/SlateDrawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Building, Users, Mail, Phone, Calendar, 
  Clock, Shield, Activity, FileText, CheckCircle2, 
  ExternalLink, UserCheck, Plus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function UniversalRecordDetail({
  party,
  isOpen,
  onClose,
  onPartyUpdated
}) {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [newRole, setNewRole] = useState('vendor');
  const [isAddingRole, setIsAddingRole] = useState(false);

  useEffect(() => {
    if (party?.id && companyId && isOpen) {
      loadActivities();
    }
  }, [party?.id, companyId, isOpen]);

  const loadActivities = async () => {
    try {
      const logs = await IdentityResolutionService.getPartyActivities(companyId, party.id);
      setActivities(logs);
    } catch (err) {
      console.warn('[UniversalRecordDetail] Failed to load activities:', err);
    }
  };

  const handleAddRole = async () => {
    if (!party?.id || !companyId) return;
    try {
      await CorePartyService.addRole(companyId, party.id, newRole);
      await IdentityResolutionService.recordActivity(
        companyId,
        party.id,
        user?.id,
        `Added role: ${newRole}`,
        'role_added',
        { role: newRole }
      );
      toast({
        title: "Role Assigned",
        description: `Successfully attached role '${newRole}' to ${party.primary_name}.`
      });
      setIsAddingRole(false);
      loadActivities();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      toast({
        title: "Role Assignment Failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  if (!party) return null;

  return (
    <SlateDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={party.primary_name}
      subtitle={`Party ID: ${party.id} • ${party.party_type}`}
      width="max-w-2xl"
    >
      <div className="space-y-6 text-xs">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] w-full justify-start p-1 rounded-xl">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Roles & Relationships
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Activity History ({activities.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--slate-v2-text-tertiary)] font-medium">Identity Type</span>
                <Badge variant="outline" className="capitalize text-white">
                  {party.party_type}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--slate-v2-text-tertiary)] font-medium">Primary Name</span>
                <span className="text-white font-semibold">{party.primary_name}</span>
              </div>
              {party.legal_name && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--slate-v2-text-tertiary)] font-medium">Legal Name / Entity</span>
                  <span className="text-white">{party.legal_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--slate-v2-text-tertiary)] font-medium">Email Address</span>
                <span className="text-white font-mono">{party.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--slate-v2-text-tertiary)] font-medium">Phone Number</span>
                <span className="text-white font-mono">{party.phone || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--slate-v2-text-tertiary)] font-medium">Record Status</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${party.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className="capitalize text-white">{party.status}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Roles & Relationships */}
          <TabsContent value="roles" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
                Business Roles
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingRole(true)}
                className="h-7 text-xs border-[var(--slate-v2-border-subtle)] text-white hover:bg-[var(--slate-v2-surface-3)] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach Role</span>
              </Button>
            </div>

            {isAddingRole && (
              <div className="p-3 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] flex items-center gap-3">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="px-2 py-1.5 rounded-md bg-[var(--slate-v2-surface-1)] border border-[var(--slate-v2-border-subtle)] text-white text-xs"
                >
                  <option value="client">Client</option>
                  <option value="vendor">Vendor / Supplier</option>
                  <option value="contractor">Contractor</option>
                  <option value="tenant">Tenant</option>
                  <option value="employee">Employee</option>
                  <option value="patient">Patient</option>
                  <option value="student">Student</option>
                </select>
                <Button size="sm" onClick={handleAddRole} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingRole(false)} className="h-7 text-xs text-slate-400">
                  Cancel
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {party.core_party_roles?.map((r, i) => (
                <div key={i} className="p-3 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-white capitalize truncate">{r.role_type}</div>
                    <div className="text-[10px] text-[var(--slate-v2-text-tertiary)] font-mono">Status: {r.role_status}</div>
                  </div>
                </div>
              )) || <div className="text-[var(--slate-v2-text-tertiary)] col-span-2">No roles currently attached.</div>}
            </div>
          </TabsContent>

          {/* Tab 3: Timeline & Audit History */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-[var(--slate-v2-text-tertiary)] rounded-xl bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)]">
                  No recorded activity entries for this party yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] flex items-start gap-3">
                    <Activity className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{act.summary}</span>
                        <span className="text-[10px] font-mono text-[var(--slate-v2-text-tertiary)]">
                          {new Date(act.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--slate-v2-text-secondary)] mt-0.5 capitalize">
                        Action Type: {act.activity_type}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SlateDrawer>
  );
}
