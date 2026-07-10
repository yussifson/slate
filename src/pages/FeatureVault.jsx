import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { usePowerSync } from '@powersync/react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'react-hot-toast';
import { Archive, Download, Clock, Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FeatureVault() {
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async () => {
    try {
      if (!user?.company_id) return;
      
      // Get all decisions for this company that are 'draft'
      const { data: decisions, error: decErr } = await supabase
        .from('univ_company_feature_decisions')
        .select('*, announcement:univ_feature_announcements(*)')
        .eq('company_id', user.company_id)
        .eq('decision', 'draft');

      if (decErr) throw decErr;
      
      setDrafts(decisions || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast.error('Failed to load Feature Vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [user]);

  const handleInstall = async (decision) => {
    try {
      // 1. Update decision to 'accepted'
      const { error: updateErr } = await supabase
        .from('univ_company_feature_decisions')
        .update({ decision: 'accepted' })
        .eq('id', decision.id);
        
      if (updateErr) throw updateErr;

      // 2. Add module to company's active_modules
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .select('active_modules')
        .eq('id', user.company_id)
        .single();
        
      if (compErr) throw compErr;

      const currentModules = company.active_modules || [];
      const moduleToInstall = decision.announcement?.module_identifier;
      
      if (moduleToInstall && !currentModules.includes(moduleToInstall)) {
        const newModules = [...currentModules, moduleToInstall];
        await supabase.from('companies').update({ active_modules: newModules }).eq('id', user.company_id);
      }

      toast.success(`${decision.announcement?.title} installed successfully!`);
      fetchDrafts();
    } catch (error) {
      console.error(error);
      toast.error('Failed to install feature.');
    }
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Archive className="w-8 h-8 text-amber-500" />
            Feature Vault
          </h1>
          <p className="text-slate-500 mt-1">Features you've saved for later. Install them into your workspace whenever you're ready.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium bg-amber-50 text-amber-700 border-amber-200">
          {drafts.length} Saved Features
        </Badge>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p>Unlocking vault...</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 dark:bg-card/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Package className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Your Vault is Empty</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">When new features are announced, you can save them to draft and they will appear here for later installation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <Card key={draft.id} className="flex flex-col border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-200 group">
              <CardHeader className="bg-slate-50/50 dark:bg-card/50 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider">
                    {draft.announcement?.announcement_type === 'specific' ? 'Custom Module' : 'General Feature'}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(draft.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-xl leading-tight group-hover:text-indigo-600 transition-colors">
                  {draft.announcement?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex-grow">
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {draft.announcement?.description}
                </p>
              </CardContent>
              <CardFooter className="pt-4 pb-6">
                <Button onClick={() => handleInstall(draft)} className="w-full bg-slate-900 hover:bg-indigo-600 text-white transition-colors gap-2">
                  <Download className="w-4 h-4" /> Install Feature
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
