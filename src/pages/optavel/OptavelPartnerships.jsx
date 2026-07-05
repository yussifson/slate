import React, { useState } from 'react';
import { Handshake, Globe, Ticket, Users, Plus, Loader2, TrendingUp, Building2, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

const PARTNER_TYPES = ['Technology', 'Reseller', 'Integration', 'Referral', 'Strategic'];

const typeColor = {
  Technology: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  Reseller: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  Integration: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  Referral: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  Strategic: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
};

export default function OptavelPartnerships() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerType, setNewPartnerType] = useState('Technology');
  const [newRevenueShare, setNewRevenueShare] = useState('');
  const [showPartnerForm, setShowPartnerForm] = useState(false);

  const { data: registrations = [] } = useQuery({
    queryKey: ['optavel_summit_registrations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_summit_registrations WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['optavel_partners', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_partners WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const register = useMutation({
    mutationFn: async () => {
      if (!newName) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_summit_registrations (id, company_id, name, company, ticket_type) VALUES (?, ?, ?, ?, ?)`,
        [id, companyId, newName, newCompany, 'standard']
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_summit_registrations']);
      setNewName('');
      setNewCompany('');
    }
  });

  const addPartner = useMutation({
    mutationFn: async () => {
      if (!newPartnerName) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_partners (id, company_id, name, type, status, revenue_share, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, newPartnerName, newPartnerType, 'active', parseFloat(newRevenueShare) || 0, new Date().toISOString()]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_partners']);
      setNewPartnerName('');
      setNewRevenueShare('');
      setShowPartnerForm(false);
    }
  });

  const totalRevShare = partners.reduce((sum, p) => sum + (p.revenue_share || 0), 0);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Handshake className="w-8 h-8 text-orange-500" />
          Partnerships & Growth
        </h1>
        <p className="text-slate-400 mt-1">AXIS Summit Management and Ecosystem Tracking.</p>
      </div>

      {/* Partner Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{partners.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active Partners</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-orange-500">{registrations.length || '1,240+'}</p>
          <p className="text-xs text-slate-500 mt-1">Summit Registrations</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-500">{totalRevShare.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">Avg Revenue Share</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ecosystem Partners */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" /> Ecosystem Partners
            </h2>
            <button
              onClick={() => setShowPartnerForm(v => !v)}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showPartnerForm && (
            <div className="mb-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl space-y-3">
              <input
                type="text" placeholder="Partner Name"
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)}
              />
              <div className="flex gap-3">
                <select
                  value={newPartnerType} onChange={e => setNewPartnerType(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                >
                  {PARTNER_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input
                  type="number" placeholder="Rev Share %"
                  className="w-28 bg-slate-50 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  value={newRevenueShare} onChange={e => setNewRevenueShare(e.target.value)}
                />
              </div>
              <Button
                onClick={() => addPartner.mutate()}
                disabled={addPartner.isPending || !newPartnerName}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {addPartner.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Partner
              </Button>
            </div>
          )}

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {partnersLoading ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading partners...</p>
            ) : partners.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                No partners added yet. Click + to add your first partner.
              </p>
            ) : partners.map(p => (
              <div key={p.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColor[p.type] || 'bg-slate-100 text-slate-600'}`}>
                        {p.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-500">{p.revenue_share || 0}%</p>
                  <p className="text-xs text-slate-400">Rev Share</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AXIS Summit */}
        <div className="bg-gradient-to-br from-slate-50 dark:from-slate-900 to-slate-100 dark:to-slate-800 border border-orange-500/30 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 pointer-events-none">
            <Globe className="w-64 h-64 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">AXIS SUMMIT 2027</h2>
          <p className="text-orange-400 text-sm font-medium mb-8">Nairobi, Kenya • Sept 12–14</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="text-sm text-slate-400 mb-1">Registrations</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-400" />
                {registrations.length > 0 ? registrations.length : '1,240'}
              </div>
            </div>
            <div className="bg-slate-50/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="text-sm text-slate-400 mb-1">Partners</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Handshake className="w-5 h-5 text-emerald-400" />
                {partners.length > 0 ? partners.length : 14}
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-white/5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Manual Registration</h3>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text" placeholder="Name..."
                className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 flex-1 min-w-0"
                value={newName} onChange={e => setNewName(e.target.value)}
              />
              <input
                type="text" placeholder="Company..."
                className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 flex-1 min-w-0"
                value={newCompany} onChange={e => setNewCompany(e.target.value)}
              />
              <button
                onClick={() => register.mutate()}
                disabled={register.isPending || !newName}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {register.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
            </div>
          </div>

          {/* Recent registrations */}
          {registrations.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Registrations</p>
              {registrations.slice(0, 3).map(r => (
                <div key={r.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{r.name}</span>
                  <span className="text-slate-400">{r.company}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
