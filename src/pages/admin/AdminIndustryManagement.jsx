import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';
import { Search, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getAllIndustryVisibility, updateIndustryVisibility, getIndustryVisibilityAuditLog } from '@/lib/industryVisibility';
import { INDUSTRIES } from '@/config/industries';

export default function AdminIndustryManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingIndustryKey, setUpdatingIndustryKey] = useState(null);

  // Fetch all industry visibility records
  const { data: industryVisibility = [], isLoading, refetch } = useQuery({
    queryKey: ['admin_industry_visibility'],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getAllIndustryVisibility(user.id);
    },
    enabled: !!user?.id,
  });

  // Fetch audit log
  const { data: auditLog = [] } = useQuery({
    queryKey: ['industry_visibility_audit'],
    queryFn: async () => {
      return await getIndustryVisibilityAuditLog();
    },
  });

  // Update industry visibility mutation
  const updateMutation = useMutation({
    mutationFn: async ({ industryKey, isActive }) => {
      return await updateIndustryVisibility(industryKey, isActive, user?.id);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: `Industry ${variables.isActive ? 'activated' : 'deactivated'} for users.`,
        });
        queryClient.invalidateQueries({ queryKey: ['admin_industry_visibility'] });
        queryClient.invalidateQueries({ queryKey: ['industry_visibility_audit'] });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update industry visibility',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update industry',
        variant: 'destructive',
      });
    },
  });

  const handleToggle = async (industryKey, currentStatus) => {
    setUpdatingIndustryKey(industryKey);
    try {
      await updateMutation.mutateAsync({
        industryKey,
        isActive: !currentStatus,
      });
    } finally {
      setUpdatingIndustryKey(null);
    }
  };

  // Filter industries by search term
  const filteredIndustries = industryVisibility.filter((ind) =>
    ind.industry_key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get industry config for display
  const getIndustryConfig = (key) => INDUSTRIES[key] || { name: key, icon: '📦' };

  // Get active/inactive counts
  const activeCount = industryVisibility.filter((i) => i.is_active).length;
  const inactiveCount = industryVisibility.length - activeCount;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Industry Visibility Management"
        subtitle="Control which industries are available to regular users during onboarding. Inactive industries remain visible to super admins only."
        action={
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="rounded-xl border-primary/40"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-card to-blue-50/50 dark:from-card dark:to-blue-950/20 border-[0.5px] border-black/9 dark:border-white/8 border-blue-200/50 dark:border-blue-900/50 rounded-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-blue-600/80 uppercase tracking-wider mb-1 tracking-[0.04em]">
                  Total Industries
                </p>
                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">
                  {industryVisibility.length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-green-50/50 dark:from-card dark:to-green-950/20 border-[0.5px] border-black/9 dark:border-white/8 border-green-200/50 dark:border-green-900/50 rounded-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-green-600/80 uppercase tracking-wider mb-1 tracking-[0.04em]">
                  Active Industries
                </p>
                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">
                  {activeCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-orange-50/50 dark:from-card dark:to-orange-950/20 border-[0.5px] border-black/9 dark:border-white/8 border-orange-200/50 dark:border-orange-900/50 rounded-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-orange-600/80 uppercase tracking-wider mb-1 tracking-[0.04em]">
                  Inactive Industries
                </p>
                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-[-0.02em]">
                  {inactiveCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search industries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 bg-card border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
        />
      </div>

      {/* Industries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredIndustries.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No industries found matching your search.</p>
          </div>
        ) : (
          filteredIndustries.map((industry) => {
            const config = getIndustryConfig(industry.industry_key);
            return (
              <Card
                key={industry.industry_key}
                className={`border-[0.5px] rounded-2xl transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] ${
                  industry.is_active
                    ? 'bg-gradient-to-br from-card to-green-50/30 dark:from-card dark:to-green-950/10 border-green-200/50 dark:border-green-900/30'
                    : 'bg-gradient-to-br from-card to-slate-50/50 dark:from-card dark:to-slate-900/30 border-slate-200/50 dark:border-slate-700/30 opacity-75'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl leading-none pt-1">{config.icon}</div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {config.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                          {industry.industry_key}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold rounded-lg ${
                        industry.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-300 dark:border-green-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                      }`}
                    >
                      {industry.is_active ? '🟢 Active' : '⚪ Inactive'}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(industry.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {industry.is_active ? 'Visible to Users' : 'Super Admin Only'}
                    </span>
                    <button
                      onClick={() => handleToggle(industry.industry_key, industry.is_active)}
                      disabled={updatingIndustryKey === industry.industry_key || updateMutation.isPending}
                      className="relative inline-flex h-7 w-12 items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={
                        industry.is_active
                          ? { backgroundColor: 'rgb(34, 197, 94)' }
                          : { backgroundColor: 'rgb(203, 213, 225)' }
                      }
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                          industry.is_active ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                      {updatingIndustryKey === industry.industry_key && (
                        <Loader2 className="absolute w-3 h-3 animate-spin text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Info Text */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                    {industry.is_active
                      ? 'This industry is available to all users during onboarding.'
                      : 'Only super admins can select this industry during onboarding.'}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Recent Changes Section */}
      {auditLog.length > 0 && (
        <Card className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Recent Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {auditLog.slice(0, 10).map((log, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {log.industry_key}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {log.old_status !== undefined && log.new_status !== undefined ? (
                        <>
                          Changed from{' '}
                          <span className={log.old_status ? 'text-green-600' : 'text-orange-600'}>
                            {log.old_status ? 'Active' : 'Inactive'}
                          </span>
                          {' '}to{' '}
                          <span className={log.new_status ? 'text-green-600' : 'text-orange-600'}>
                            {log.new_status ? 'Active' : 'Inactive'}
                          </span>
                        </>
                      ) : (
                        'Updated'
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2">
                    {new Date(log.changed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
