import React, { useState } from 'react';
import { Handshake, Plus, X, Globe, DollarSign, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CARD = 'bg-card border border-border rounded-2xl p-6 shadow-sm';
const HEAD = 'text-lg font-bold text-foreground flex items-center gap-2 mb-5';

export default function OptavelPartnerships() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [partnerModal, setPartnerModal] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: '', type: 'agency', status: 'active', revenue_share: '', contact_name: '', contact_email: '' });

  const { data: partners = [] } = useQuery({
    queryKey: ['optavel_partners', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_partners WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const submitPartner = async () => {
    if (!partnerForm.name) return toast.error('Name is required');
    await powerSync.execute(
      `INSERT INTO optavel_partners (id, company_id, name, type, status, revenue_share, contact_name, contact_email, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, partnerForm.name, partnerForm.type, partnerForm.status, Number(partnerForm.revenue_share)||0, partnerForm.contact_name, partnerForm.contact_email, new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Partner added!');
    setPartnerModal(false);
    setPartnerForm({ name: '', type: 'agency', status: 'active', revenue_share: '', contact_name: '', contact_email: '' });
    queryClient.invalidateQueries(['optavel_partners']);
  };

  const deletePartner = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_partners WHERE id=?`, [id]);
    queryClient.invalidateQueries(['optavel_partners']);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-background text-foreground" >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><Handshake className="w-7 h-7 text-primary" /></div>
            Partnerships
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Channel · Resellers · Integrations</p>
        </div>
        <Button onClick={() => setPartnerModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Add Partner
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Partners', val: partners.length, color: 'amber' },
          { label: 'Active', val: partners.filter(p => p.status === 'active').length, color: 'emerald' },
          { label: 'Partner Revenue', val: '$0', color: 'blue' },
          { label: 'Commissions Due', val: '$0', color: 'red' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${CARD}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-2xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      <div className={CARD}>
        <div className={HEAD}><Globe className="w-5 h-5 text-primary" /> Partner Directory</div>
        {partners.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No partners yet. Build your ecosystem!</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="pb-3 pr-4">Partner</th><th className="pb-3 pr-4">Type</th><th className="pb-3 pr-4">Contact</th><th className="pb-3 pr-4">Rev Share</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {partners.map(p => (
                <tr key={p.id} className="group">
                  <td className="py-3 pr-4 font-semibold text-foreground">{p.name}</td>
                  <td className="py-3 pr-4 capitalize text-muted-foreground">{p.type}</td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {p.contact_name && <span>{p.contact_name}<br/></span>}
                    {p.contact_email && <span>{p.contact_email}</span>}
                  </td>
                  <td className="py-3 pr-4 font-bold text-amber-400">{p.revenue_share}%</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold capitalize ${p.status === 'active' ? 'bg-primary/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-muted-foreground border-slate-500/30'}`}>{p.status}</span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => deletePartner(p.id)} className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={partnerModal} onOpenChange={setPartnerModal}>
        <DialogContent className="bg-background border border-border text-foreground">
          <DialogHeader><DialogTitle>Add Partner</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Partner Name *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="e.g. Acme Agency" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-muted-foreground">Type</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={partnerForm.type} onChange={e => setPartnerForm({...partnerForm, type: e.target.value})}>
                  <option value="agency">Agency</option><option value="reseller">Reseller</option><option value="integration">Integration</option>
                </select>
              </div>
              <div><Label className="text-muted-foreground">Rev Share %</Label><Input type="number" className="bg-muted border-border text-foreground mt-1" placeholder="20" value={partnerForm.revenue_share} onChange={e => setPartnerForm({...partnerForm, revenue_share: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Status</Label>
                <select className="w-full mt-1 bg-muted border border-border rounded-md px-3 py-2 text-foreground text-sm" value={partnerForm.status} onChange={e => setPartnerForm({...partnerForm, status: e.target.value})}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Contact Name</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="John Doe" value={partnerForm.contact_name} onChange={e => setPartnerForm({...partnerForm, contact_name: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Contact Email</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="john@acme.com" value={partnerForm.contact_email} onChange={e => setPartnerForm({...partnerForm, contact_email: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitPartner} className="bg-primary hover:bg-primary/90 text-primary-foreground">Add Partner</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
