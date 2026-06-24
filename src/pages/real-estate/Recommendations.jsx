import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Plus, Edit, Trash2, Search, TrendingUp, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Recommendations</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered recommendations matching clients with agents</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          clientId: '',
          recommendedAgentId: '',
          propertyId: '',
          recommendationType: 'agent_match',
          recommendationScore: 0.85,
          recommendationReason: '',
          clientAction: 'pending',
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Recommendation
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Total Recs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecs}</div>
            <p className="text-xs text-muted-foreground mt-1">Recommendations generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedRecs}</div>
            <p className="text-xs text-muted-foreground mt-1">Clients approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRecs}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgScore * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Match confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
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

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecs.map(rec => (
          <Card key={rec.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Client: {rec.client_id?.substring(0, 20)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{rec.recommendation_type?.replace('_', ' ')}</p>
                </div>
                <Badge variant={rec.client_action === 'accepted' ? 'default' : rec.client_action === 'pending' ? 'secondary' : 'outline'}>
                  {rec.client_action}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-muted-foreground mb-1">Match Score</p>
                <p className="text-2xl font-bold text-blue-600">{(rec.recommendation_score * 100).toFixed(0)}%</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Recommended Agent</p>
                <p className="font-medium text-sm">{rec.recommended_agent_id?.substring(0, 20)}</p>
              </div>

              {rec.property_id && (
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-xs text-muted-foreground mb-1">Property</p>
                  <p className="font-medium text-sm">{rec.property_id?.substring(0, 20)}</p>
                </div>
              )}

              {rec.recommendation_reason && (
                <div className="text-sm p-2 bg-amber-50 rounded">
                  <p className="text-xs text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm">{rec.recommendation_reason}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(rec)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(rec.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecs.length === 0 && (
        <Card className="text-center py-12">
          <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No recommendations found. Create your first recommendation!</p>
        </Card>
      )}

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
