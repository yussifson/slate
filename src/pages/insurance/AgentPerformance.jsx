import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, Trash2, Award, TrendingUp, DollarSign, MoreVertical, Eye, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function AgentPerformance() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('agent');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const agents = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null);

  const [formData, setFormData] = useState({
    agentName: '',
    region: 'North',
    policiesSold: 0,
    premiumCollected: 0,
    claimsHandled: 0,
    commissionEarned: 0,
    rating: 5
  });
  const [viewRecord, setViewRecord] = useState(null);

  const handleCreateAgent = () => {
    if (!formData.agentName.trim()) {
      return toast.error("Please enter agent name");
    }
    
    if (editTargetId) {
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'agent',
        payload: { ...formData },
        status: formData.status || 'active',
        searchText: `${formData.agentName} ${formData.region}`
      }, {
        onSuccess: () => {
          toast.success('Agent updated successfully!');
          setShowModal(false);
          setFormData({
            agentName: '', region: 'North', policiesSold: 0, premiumCollected: 0, claimsHandled: 0, commissionEarned: 0, rating: 5
          });
        },
        onError: (err) => toast.error('Failed to update agent: ' + err.message)
      });
    } else {
      const agentCode = `AGT-${Math.floor(1000 + Math.random() * 9000)}`;

      mutateRecord.mutate({
        recordType: 'agent',
        payload: { ...formData, agentCode },
        status: 'active',
        searchText: `${formData.agentName} ${formData.region} ${agentCode}`
      }, {
        onSuccess: () => {
          toast.success('Agent added successfully!');
          setShowModal(false);
          setFormData({
            agentName: '', region: 'North', policiesSold: 0, premiumCollected: 0, claimsHandled: 0, commissionEarned: 0, rating: 5
          });
        },
        onError: (err) => toast.error('Failed to add agent: ' + err.message)
      });
    }
  };

  const handleEdit = (agent) => {
    setFormData({
      agentName: agent.agentName || '',
      region: agent.region || 'North',
      policiesSold: agent.policiesSold || 0,
      premiumCollected: agent.premiumCollected || 0,
      claimsHandled: agent.claimsHandled || 0,
      commissionEarned: agent.commissionEarned || 0,
      rating: agent.rating || 5,
      status: agent.status
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setFormData({
      agentName: '', region: 'North', policiesSold: 0, premiumCollected: 0, claimsHandled: 0, commissionEarned: 0, rating: 5
    });
    setShowModal(true);
  };

  const handleUpdateStatus = (agent, newStatus) => {
    const payload = { ...agent };
    delete payload.id;
    delete payload.status;
    
    mutateRecord.mutate({
      id: agent.id,
      recordType: 'agent',
      payload,
      status: newStatus,
      searchText: `${agent.agentName} ${agent.agentCode}`
    }, {
      onSuccess: () => toast.success(`Agent status updated to ${newStatus}`)
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'agent' }, {
      onSuccess: () => {
        toast.success('Agent removed!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = agents.filter(a => 
    a.agentName?.toLowerCase().includes(search.toLowerCase()) || 
    a.agentCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCommission = agents.reduce((sum, a) => sum + (Number(a.commissionEarned) || 0), 0);
  const avgPolicies = agents.length > 0 ? (agents.reduce((sum, a) => sum + (Number(a.policiesSold) || 0), 0) / agents.length).toFixed(1) : 0;

  // Find top performer
  const topPerformer = [...agents].sort((a, b) => (Number(b.policiesSold) || 0) - (Number(a.policiesSold) || 0))[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("agent_performance", "Agent Performance")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "track_agent_sales_commissions_",
            "Track agent sales, commissions, and ratings"
          )}</p>
        </div>
        <Button onClick={openNewModal} className="gap-2 bg-insurance-600 hover:bg-insurance-700 text-white">
          <Plus className="w-4 h-4" /> {t("add_agent", "Add Agent")}
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground"><Users className="w-4 h-4"/> {t("total_agents", "Total Agents")}</div>
          <p className="text-2xl font-bold text-card-foreground">{agents.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-insurance-600"><TrendingUp className="w-4 h-4"/> {t("avg_policies_sold", "Avg Policies Sold")}</div>
          <p className="text-2xl font-bold text-card-foreground">{avgPolicies}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-green-600"><DollarSign className="w-4 h-4"/> {t("total_commission", "Total Commission")}</div>
          <p className="text-2xl font-bold text-card-foreground">${totalCommission.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600"><Award className="w-4 h-4"/> {t("top_performer", "Top Performer")}</div>
          <p className="text-lg font-bold text-card-foreground truncate">{topPerformer ? topPerformer.agentName : 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{topPerformer ? `${topPerformer.policiesSold} policies` : ''}</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search agent name or code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading_agents", "Loading agents...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-insurance-600" />
              <p className="font-semibold text-lg text-card-foreground">{t("no_agents_found", "No agents found")}</p>
              <p className="text-xs mt-1">{t(
                "add_an_agent_to_start_tracking",
                "Add an agent to start tracking performance."
              )}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("agent_info", "Agent Info")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("policies_sold", "Policies Sold")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("premium_collected", "Premium Collected")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("commission", "Commission")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(agent => {
                  return (
                    <tr key={agent.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-card-foreground">{agent.agentName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{agent.agentCode} • {agent.region}</p>
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => {
                            return (<Award key={i} className={`w-3 h-3 ${i < Number(agent.rating) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />);
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-card-foreground text-lg">{agent.policiesSold}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground font-medium">
                        ${Number(agent.premiumCollected).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-green-600">${Number(agent.commissionEarned).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={agent.status}
                          onChange={e => handleUpdateStatus(agent, e.target.value)}
                          className={`rounded-md border border-input px-2 py-1 text-xs font-bold ${
                            agent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <option value="Active">{t("active", "Active")}</option>
                          <option value="Inactive">{t("inactive", "Inactive")}</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{t("open_menu", "Open menu")}</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewRecord(agent)}>{t("view_details", "View Details")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(agent)}>{t("edit", "Edit")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTargetId(agent.id)} className="text-red-600">{t("delete", "Delete")}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Agent' : 'Add New Agent'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("agent_name", "Agent Name")}</label>
                <Input value={formData.agentName} onChange={e => setFormData({...formData, agentName: e.target.value})} placeholder="John Doe" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("region", "Region")}</label>
                <select value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                  <option>{t("north", "North")}</option>
                  <option>{t("south", "South")}</option>
                  <option>{t("east", "East")}</option>
                  <option>{t("west", "West")}</option>
                  <option>{t("central", "Central")}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("policies_sold", "Policies Sold")}</label>
                  <Input type="number" value={formData.policiesSold} onChange={e => setFormData({...formData, policiesSold: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("claims_handled", "Claims Handled")}</label>
                  <Input type="number" value={formData.claimsHandled} onChange={e => setFormData({...formData, claimsHandled: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("premium_collected", "Premium Collected ($)")}</label>
                  <Input type="number" value={formData.premiumCollected} onChange={e => setFormData({...formData, premiumCollected: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("commission", "Commission ($)")}</label>
                  <Input type="number" value={formData.commissionEarned} onChange={e => setFormData({...formData, commissionEarned: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("rating_1_5", "Rating (1-5)")}</label>
                <Input type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditTargetId(null); }}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-insurance-600 hover:bg-insurance-700 text-white" onClick={handleCreateAgent}>{editTargetId ? 'Save Changes' : 'Save Agent'}</Button>
            </div>
          </div>
        </div>
      )}
      <Sheet open={viewDetailsId !== null} onOpenChange={(open) => !open && setViewDetailsId(null)}>
        <SheetContent className="bg-card text-card-foreground">
          <SheetHeader>
            <SheetTitle>{t("record_details", "Record Details")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewDetailsId && (() => {
              const record = agents.find(r => r.id === viewDetailsId);
              if (!record) return null;
              return Object.entries(record).map(([key, value]) => {
                if (key === 'id') return null;
                return (
                  <div key={key}>
                    <label className="text-xs font-bold text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <p className="font-medium">{String(value)}</p>
                  </div>
                );
              });
            })()}
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Agent"
        message="Are you sure you want to completely remove this agent? This cannot be undone."
      />
      <Sheet open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("agent_details", "Agent Details")}</SheetTitle>
            <SheetDescription>{t(
              "view_complete_information_for_",
              "View complete information for this agent."
            )}</SheetDescription>
          </SheetHeader>
          {viewRecord && (
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("agent_name", "Agent Name")}</h4>
                <p className="text-base font-semibold">{viewRecord.agentName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("agent_code", "Agent Code")}</h4>
                <p className="text-base">{viewRecord.agentCode}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("region", "Region")}</h4>
                <p className="text-base">{viewRecord.region}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("status", "Status")}</h4>
                <p className="text-base">{viewRecord.status}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("rating", "Rating")}</h4>
                <div className="flex gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => {
                    return (<Award key={i} className={`w-4 h-4 ${i < Number(viewRecord.rating) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />);
                  })}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("policies_sold", "Policies Sold")}</h4>
                <p className="text-base">{viewRecord.policiesSold}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("claims_handled", "Claims Handled")}</h4>
                <p className="text-base">{viewRecord.claimsHandled}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("premium_collected", "Premium Collected")}</h4>
                <p className="text-base">${Number(viewRecord.premiumCollected).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("commission_earned", "Commission Earned")}</h4>
                <p className="text-base">${Number(viewRecord.commissionEarned).toLocaleString()}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
