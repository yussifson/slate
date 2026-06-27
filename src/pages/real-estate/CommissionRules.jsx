import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Percent, Plus, Edit, Trash2, Search, DollarSign, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
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

export default function CommissionRules() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [rules, setRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    ruleName: '',
    ruleType: 'percentage',
    commissionPercentage: 0,
    flatFee: 0,
    propertyTypes: 'residential',
    priceRangeMin: 0,
    priceRangeMax: 0,
    description: '',
    isActive: true,
  });

  // Fetch commission rules
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_commission_rules WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setRules(data);
      } catch (e) {
        console.error('[CommissionRules] Fetch failed:', e);
        toast.error('Failed to load commission rules');
      }
      setIsLoading(false);
    };

    if (companyId) fetchRules();
  }, [companyId]);

  // Filter rules
  useEffect(() => {
    let filtered = rules;
    if (search) {
      filtered = filtered.filter(r =>
        r.rule_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.rule_type?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => (statusFilter === 'active' ? r.is_active : !r.is_active));
    }
    setFilteredRules(filtered);
  }, [rules, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateCommissionRule(companyId, editingId, formData, user.id);
        toast.success('Commission rule updated successfully');
      } else {
        await RealEstateAPI.createCommissionRule(companyId, formData, user.id);
        toast.success('Commission rule created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        ruleName: '',
        ruleType: 'percentage',
        commissionPercentage: 0,
        flatFee: 0,
        propertyTypes: 'residential',
        priceRangeMin: 0,
        priceRangeMax: 0,
        description: '',
        isActive: true,
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_commission_rules WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRules(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[CommissionRules] Submit failed:', e);
      toast.error('Failed to save commission rule');
    }
  };

  const handleEdit = (rule) => {
    setFormData({
      ruleName: rule.rule_name || '',
      ruleType: rule.rule_type || 'percentage',
      commissionPercentage: rule.commission_percentage || 0,
      flatFee: rule.flat_fee || 0,
      propertyTypes: rule.property_types || 'residential',
      priceRangeMin: rule.price_range_min || 0,
      priceRangeMax: rule.price_range_max || 0,
      description: rule.description || '',
      isActive: rule.is_active !== false,
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this commission rule?')) return;
    try {
      await RealEstateAPI.deleteCommissionRule(companyId, id, user.id);
      toast.success('Commission rule deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_commission_rules WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setRules(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[CommissionRules] Delete failed:', e);
      toast.error('Failed to delete commission rule');
    }
  };

  // KPI calculations
  const activeRules = rules.filter(r => r.is_active).length;
  const totalRules = rules.length;
  const avgCommission = rules.length > 0
    ? (rules.reduce((sum, r) => sum + (r.commission_percentage || 0), 0) / rules.length).toFixed(2)
    : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commission Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure commission structures for transactions</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          ruleName: '',
          ruleType: 'percentage',
          commissionPercentage: 0,
          flatFee: 0,
          propertyTypes: 'residential',
          priceRangeMin: 0,
          priceRangeMax: 0,
          description: '',
          isActive: true,
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Rule
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow transition-all duration-200 overflow-hidden flex flex-col">
          <CardHeader className="relative p-5 border-b border-slate-100 dark:border-slate-800 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col relative z-10 bg-transparent">
            <div className="text-2xl font-bold">{totalRules}</div>
            <p className="text-xs text-muted-foreground mt-1">Commission configurations</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow transition-all duration-200 overflow-hidden flex flex-col">
          <CardHeader className="relative p-5 border-b border-slate-100 dark:border-slate-800 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col relative z-10 bg-transparent">
            <div className="text-2xl font-bold text-green-600">{activeRules}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in use</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow transition-all duration-200 overflow-hidden flex flex-col">
          <CardHeader className="relative p-5 border-b border-slate-100 dark:border-slate-800 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Avg Commission
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col relative z-10 bg-transparent">
            <div className="text-2xl font-bold">{avgCommission}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by rule name, type..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map(rule => (
          <Card key={rule.id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow transition-all duration-200 overflow-hidden flex flex-col">
            <CardHeader className="relative p-5 border-b border-slate-100 dark:border-slate-800 bg-transparent overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    {rule.rule_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{rule.rule_type}</p>
                </div>
                <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                  {rule.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 flex-1 flex flex-col relative z-10 bg-transparent">
              <div className="grid grid-cols-2 gap-3">
                {rule.commission_percentage > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Percent className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Commission</p>
                      <p className="font-bold text-blue-600">{rule.commission_percentage}%</p>
                    </div>
                  </div>
                )}
                {rule.flat_fee > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Flat Fee</p>
                      <p className="font-bold text-green-600">${rule.flat_fee.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {(rule.price_range_min || rule.price_range_max) && (
                <div className="text-sm p-2 bg-amber-50 rounded">
                  <p className="text-xs text-muted-foreground mb-1">Price Range</p>
                  <p className="font-medium">
                    ${rule.price_range_min?.toLocaleString() || '0'} - ${rule.price_range_max?.toLocaleString() || 'unlimited'}
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p><span className="text-foreground font-medium">Property Types:</span> {rule.property_types}</p>
              </div>

              {rule.description && (
                <p className="text-sm text-muted-foreground italic">{rule.description}</p>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(rule)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(rule.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRules.length === 0 && (
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow transition-all duration-200 overflow-hidden flex flex-col">
          <Percent className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No commission rules found. Create your first rule!</p>
        </Card>
      )}

      {/* Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Commission Rule' : 'Add New Commission Rule'}</SheetTitle>
            <SheetDescription>Configure how commissions are calculated for transactions</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Rule Name</label>
              <Input
                value={formData.ruleName}
                onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                placeholder="e.g., Standard Residential"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Rule Type</label>
                <Select value={formData.ruleType} onValueChange={(value) => setFormData({ ...formData, ruleType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Fee</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Property Type</label>
                <Select value={formData.propertyTypes} onValueChange={(value) => setFormData({ ...formData, propertyTypes: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="all">All Types</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.ruleType === 'percentage' || formData.ruleType === 'hybrid') && (
              <div>
                <label className="text-sm font-medium">Commission Percentage</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commissionPercentage}
                  onChange={(e) => setFormData({ ...formData, commissionPercentage: parseFloat(e.target.value) })}
                  placeholder="e.g., 5.5"
                />
              </div>
            )}

            {(formData.ruleType === 'flat' || formData.ruleType === 'hybrid') && (
              <div>
                <label className="text-sm font-medium">Flat Fee ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.flatFee}
                  onChange={(e) => setFormData({ ...formData, flatFee: parseFloat(e.target.value) })}
                  placeholder="e.g., 500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Min Price Range ($)</label>
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.priceRangeMin}
                  onChange={(e) => setFormData({ ...formData, priceRangeMin: parseFloat(e.target.value) })}
                  placeholder="e.g., 0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Price Range ($)</label>
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.priceRangeMax}
                  onChange={(e) => setFormData({ ...formData, priceRangeMax: parseFloat(e.target.value) })}
                  placeholder="e.g., 1000000"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this rule..."
                className="w-full p-2 border rounded text-sm"
                rows="3"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Rule is active
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Rule
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
