import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Plus, Edit, Trash2, Search, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';
import { REPageHeader, REStatCard, REDataCard, REGridShell } from '@/components/real-estate/RealEstateViewKit';


export default function Recommendations() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [recommendations, setRecommendations] = useState([]);
  const [filteredRecs, setFilteredRecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    clientId: '',
    recommendedAgentId: '',
    propertyId: '',
    recommendationType: 'agent_match',
    recommendationScore: 0.85,
    recommendationReason: '',
    clientAction: 'pending',
  });

  // Fetch recommendations
  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_agent_recommendations WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setRecommendations(data);
      } catch (e) {
        console.error('[Recommendations] Fetch failed:', e);
        toast.error('Failed to load recommendations');
      }
      setIsLoading(false);
    };

    if (companyId) fetchRecs();
  }, [companyId]);

  // Filter recommendations
  useEffect(() => {
    let filtered = recommendations;
    if (search) {
      filtered = filtered.filter(r =>
        r.client_id?.toLowerCase().includes(search.toLowerCase()) ||
        r.property_id?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.client_action === statusFilter);
    }
    setFilteredRecs(filtered);
  }, [recommendations, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateRecommendation(companyId, editingId, formData, user.id);
        toast.success('Recommendation updated successfully');
      } else {
        await RealEstateAPI.createRecommendation(companyId, formData, user.id);
        toast.success('Recommendation created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        clientId: '',
        recommendedAgentId: '',
        propertyId: '',
        recommendationType: 'agent_match',
        recommendationScore: 0.85,
        recommendationReason: '',
        clientAction: 'pending',
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_agent_recommendations WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRecommendations(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[Recommendations] Submit failed:', e);
      toast.error('Failed to save recommendation');
    }
  };

  const handleEdit = (rec) => {
    setFormData({
      clientId: rec.client_id || '',
      recommendedAgentId: rec.recommended_agent_id || '',
      propertyId: rec.property_id || '',
      recommendationType: rec.recommendation_type || 'agent_match',
      recommendationScore: rec.recommendation_score || 0.85,
      recommendationReason: rec.recommendation_reason || '',
      clientAction: rec.client_action || 'pending',
    });
    setEditingId(rec.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recommendation?')) return;
    try {
      await RealEstateAPI.deleteRecommendation(companyId, id, user.id);
      toast.success('Recommendation deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_agent_recommendations WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRecommendations(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[Recommendations] Delete failed:', e);
      toast.error('Failed to delete recommendation');
    }
  };

  // KPI calculations
  const totalRecs = recommendations.length;
  const acceptedRecs = recommendations.filter(r => r.client_action === 'accepted').length;
  const pendingRecs = recommendations.filter(r => r.client_action === 'pending').length;
  const avgScore = recommendations.length > 0
    ? (recommendations.reduce((sum, r) => sum + (r.recommendation_score || 0), 0) / recommendations.length).toFixed(2)
    : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <REPageHeader 
        title="AI Recommendations" 
        subtitle="AI-powered recommendations matching clients with agents"
        actions={
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
            clientId: '',
            recommendedAgentId: '',
            propertyId: '',
            recommendationType: 'agent_match',
            recommendationScore: 0.85,
            recommendationReason: '',
            clientAction: 'pending',
          }); }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4" /> Add Recommendation
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <REStatCard label="Total Recs" value={totalRecs} hint="Recommendations generated" icon={Lightbulb} />
        <REStatCard label="Accepted" value={acceptedRecs} hint="Clients approved" icon={CheckCircle2} variant="success" />
        <REStatCard label="Pending" value={pendingRecs} hint="Awaiting response" icon={AlertCircle} variant="warning" />
        <REStatCard label="Avg Score" value={`${(avgScore * 100).toFixed(0)}%`} hint="Match confidence" icon={TrendingUp} />
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 bg-muted/50 flex flex-wrap gap-4 items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
            <Input
              placeholder="Search by client, property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <REGridShell empty={filteredRecs.length === 0 && <div className="py-12 text-center text-[#71717a] dark:text-gray-400"><Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" /><p className="font-semibold">No recommendations found.</p></div>}>
          {filteredRecs.map(rec => (
            <REDataCard 
              key={rec.id}
              title={`Client: ${rec.client_id?.substring(0, 20)}`}
              subtitle={`Agent: ${rec.recommended_agent_id?.substring(0, 20)}`}
              iconText={<Lightbulb className="w-6 h-6" />}
              badge={rec.client_action}
              badgeColor={rec.client_action === 'accepted' ? 'bg-primary/5 text-primary/90 border-primary/20' : 'bg-slate-100 text-slate-700 border-slate-200'}
              onEdit={() => handleEdit(rec)}
              onDelete={() => handleDelete(rec.id)}
              metrics={[
                { label: "Score", value: `${(rec.recommendation_score * 100).toFixed(0)}%` },
                { label: "Type", value: rec.recommendation_type?.replace('_', ' ') }
              ]}
            />
          ))}
        </REGridShell>
      </div>

      {/* Recommendation Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Recommendation' : 'Create Recommendation'}</SheetTitle>
            <SheetDescription>AI-powered client-agent matching recommendation</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Client ID</label>
              <Input
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="e.g., CLIENT-123"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Recommended Agent ID</label>
              <Input
                value={formData.recommendedAgentId}
                onChange={(e) => setFormData({ ...formData, recommendedAgentId: e.target.value })}
                placeholder="e.g., AGENT-456"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Property ID (Optional)</label>
              <Input
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                placeholder="e.g., PROP-789"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Recommendation Type</label>
                <Select value={formData.recommendationType} onValueChange={(value) => setFormData({ ...formData, recommendationType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent_match">Agent Match</SelectItem>
                    <SelectItem value="property_match">Property Match</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Match Score (0-1)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.recommendationScore}
                  onChange={(e) => setFormData({ ...formData, recommendationScore: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Recommendation Reason</label>
              <textarea
                value={formData.recommendationReason}
                onChange={(e) => setFormData({ ...formData, recommendationReason: e.target.value })}
                placeholder="Why this recommendation..."
                className="w-full p-2 border rounded text-sm"
                rows="3"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Client Action</label>
              <Select value={formData.clientAction} onValueChange={(value) => setFormData({ ...formData, clientAction: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Recommendation
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
