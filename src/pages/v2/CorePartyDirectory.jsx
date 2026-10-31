import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { CorePartyService } from '@/services/CorePartyService';
import SlateDataGrid from '@/components/ui/v2/SlateDataGrid';
import SlateDrawer from '@/components/ui/v2/SlateDrawer';
import UniversalRecordDetail from '@/components/shared/v2/UniversalRecordDetail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserPlus, Building, Mail, Phone, 
  Globe, Shield, Tag, Calendar, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CorePartyDirectory({ filterRole = 'all' }) {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [parties, setParties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Party Form State
  const [formData, setFormData] = useState({
    party_type: 'individual',
    primary_name: '',
    legal_name: '',
    email: '',
    phone: '',
    website: '',
    initialRole: 'client'
  });

  const loadParties = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await CorePartyService.listParties(companyId, {
        roleType: filterRole !== 'all' ? filterRole : null
      });
      setParties(data);
    } catch (err) {
      console.warn('[CorePartyDirectory] Failed to load parties:', err);
      toast({
        title: "Error loading parties",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [companyId, filterRole]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.primary_name) return;

    try {
      await CorePartyService.createParty(
        companyId,
        {
          party_type: formData.party_type,
          primary_name: formData.primary_name,
          legal_name: formData.legal_name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website
        },
        [formData.initialRole],
        user?.id
      );

      toast({
        title: "Party Created",
        description: `${formData.primary_name} registered successfully.`
      });

      setIsCreateOpen(false);
      setFormData({
        party_type: 'individual',
        primary_name: '',
        legal_name: '',
        email: '',
        phone: '',
        website: '',
        initialRole: 'client'
      });
      loadParties();
    } catch (err) {
      toast({
        title: "Creation Failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const columns = [
    {
      field: 'primary_name',
      header: 'Party Name',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--slate-v2-surface-3)] flex items-center justify-center text-xs font-bold text-white border border-[var(--slate-v2-border-subtle)]">
            {row.party_type === 'organization' ? <Building className="w-4 h-4 text-indigo-400" /> : <Users className="w-4 h-4 text-emerald-400" />}
          </div>
          <div>
            <div className="font-semibold text-white">{val}</div>
            {row.legal_name && <div className="text-[11px] text-[var(--slate-v2-text-tertiary)]">{row.legal_name}</div>}
          </div>
        </div>
      )
    },
    {
      field: 'email',
      header: 'Email & Contact',
      render: (val, row) => (
        <div className="text-xs">
          <div className="text-white">{val || '—'}</div>
          {row.phone && <div className="text-[11px] text-[var(--slate-v2-text-tertiary)] font-mono">{row.phone}</div>}
        </div>
      )
    },
    {
      field: 'party_type',
      header: 'Type',
      width: '120px',
      render: (val) => (
        <Badge variant="outline" className="capitalize text-[10px] border-[var(--slate-v2-border-subtle)] text-[var(--slate-v2-text-secondary)]">
          {val}
        </Badge>
      )
    },
    {
      field: 'core_party_roles',
      header: 'Assigned Roles',
      render: (roles) => (
        <div className="flex flex-wrap gap-1">
          {roles && roles.length > 0 ? (
            roles.map((r, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--slate-v2-brand-surface)] text-[var(--slate-v2-brand)] border border-[var(--slate-v2-brand)]/20 capitalize">
                {r.role_type}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[var(--slate-v2-text-tertiary)]">Unassigned</span>
          )}
        </div>
      )
    },
    {
      field: 'status',
      header: 'Status',
      width: '100px',
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${val === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className="capitalize text-xs text-[var(--slate-v2-text-secondary)]">{val}</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Core Party Graph</h1>
          <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
            Universal business identities, cross-domain party roles, and relationship intelligence.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium h-9 px-4 rounded-lg shadow-sm shadow-indigo-600/25 flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Party</span>
        </Button>
      </div>

      {/* Main Data Grid */}
      <SlateDataGrid 
        columns={columns}
        data={parties}
        isLoading={isLoading}
        onRowClick={(party) => setSelectedParty(party)}
        emptyMessage="No parties registered in this workspace yet."
      />

      {/* Universal Record Detail Drawer with Timeline & Role Management */}
      <UniversalRecordDetail
        party={selectedParty}
        isOpen={Boolean(selectedParty)}
        onClose={() => setSelectedParty(null)}
        onPartyUpdated={loadParties}
      />

      {/* Create New Party Drawer */}
      <SlateDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Core Party"
        subtitle="Create an individual or organization entity in the shared party graph"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Party Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, party_type: 'individual' }))}
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  formData.party_type === 'individual'
                    ? 'bg-indigo-600/15 border-indigo-500 text-white font-semibold'
                    : 'bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-[var(--slate-v2-text-secondary)]'
                }`}
              >
                Individual Person
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, party_type: 'organization' }))}
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  formData.party_type === 'organization'
                    ? 'bg-indigo-600/15 border-indigo-500 text-white font-semibold'
                    : 'bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-[var(--slate-v2-text-secondary)]'
                }`}
              >
                Organization / Company
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Primary Display Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Johnathan Doe or Apex Corp"
              value={formData.primary_name}
              onChange={(e) => setFormData(p => ({ ...p, primary_name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white placeholder-[var(--slate-v2-text-tertiary)] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="contact@example.com"
              value={formData.email}
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white placeholder-[var(--slate-v2-text-tertiary)] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white placeholder-[var(--slate-v2-text-tertiary)] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Initial Primary Role
            </label>
            <select
              value={formData.initialRole}
              onChange={(e) => setFormData(p => ({ ...p, initialRole: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="client">Client / Customer</option>
              <option value="vendor">Vendor / Supplier</option>
              <option value="contractor">Contractor / Partner</option>
              <option value="tenant">Tenant</option>
              <option value="patient">Patient</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[var(--slate-v2-border-subtle)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="h-9 px-4 rounded-lg border-[var(--slate-v2-border-subtle)] text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              Register Party
            </Button>
          </div>
        </form>
      </SlateDrawer>
    </div>
  );
}
