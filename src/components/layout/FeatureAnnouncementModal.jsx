import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Download, Archive, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FeatureAnnouncementModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAnnouncements = async () => {
    if (!user?.company_id) return;
    
    try {
      // 1. Get all announcements for this company or general
      const { data: announcements, error: annErr } = await supabase
        .from('univ_feature_announcements')
        .select('*')
        .or(`target_company_id.eq.${user.company_id},announcement_type.eq.general`)
        .order('created_at', { ascending: true });

      if (annErr) throw annErr;
      if (!announcements || announcements.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Get decisions made by this company
      const { data: decisions, error: decErr } = await supabase
        .from('univ_company_feature_decisions')
        .select('announcement_id')
        .eq('company_id', user.company_id);

      if (decErr) throw decErr;

      const decidedIds = new Set(decisions?.map(d => d.announcement_id) || []);
      
      // 3. Find the first announcement without a decision
      const pendingAnnouncement = announcements.find(a => !decidedIds.has(a.id));
      
      if (pendingAnnouncement) {
        setAnnouncement(pendingAnnouncement);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error checking feature announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Small delay so it doesn't jarringly block the initial load
    const timer = setTimeout(() => {
      checkAnnouncements();
    }, 2000);
    return () => clearTimeout(timer);
  }, [user]);

  const recordDecision = async (decision) => {
    try {
      const { error } = await supabase.from('univ_company_feature_decisions').insert({
        company_id: user.company_id,
        announcement_id: announcement.id,
        decision
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to process your choice');
      return false;
    }
  };

  const handleAccept = async () => {
    const success = await recordDecision('accepted');
    if (!success) return;

    try {
      // Add module to company's active_modules
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .select('active_modules')
        .eq('id', user.company_id)
        .single();
        
      if (compErr) throw compErr;

      const currentModules = company.active_modules || [];
      const moduleToInstall = announcement.module_identifier;
      
      if (moduleToInstall && !currentModules.includes(moduleToInstall)) {
        const newModules = [...currentModules, moduleToInstall];
        await supabase.from('companies').update({ active_modules: newModules }).eq('id', user.company_id);
      }

      toast.success(`${announcement.title} is now active in your workspace!`);
      setIsOpen(false);
      setTimeout(() => window.location.reload(), 1500); // Reload to ensure routes apply
    } catch (error) {
      console.error(error);
      toast.error('Failed to install feature.');
    }
  };

  const handleDraft = async () => {
    const success = await recordDecision('draft');
    if (success) {
      toast.success('Feature saved to Feature Vault');
      setIsOpen(false);
      checkAnnouncements(); // Check if there's another one in queue
    }
  };

  const handleIgnore = async () => {
    const success = await recordDecision('ignored');
    if (success) {
      setIsOpen(false);
      checkAnnouncements();
    }
  };

  if (!announcement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing by clicking outside to ensure a decision is made
      // Or they can dismiss it, which we'll treat as 'draft' implicitly, 
      // but let's force a button click for clarity.
    }}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0" hideCloseButton>
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-8 text-white relative">
          <Button variant="ghost" size="icon" onClick={handleDraft} className="absolute right-4 top-4 text-white/70 hover:text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-sm">
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <div className="text-indigo-200 text-sm font-bold tracking-wider uppercase mb-0.5">
                {announcement.announcement_type === 'specific' ? 'Custom Built For You' : 'New Platform Feature'}
              </div>
              <h2 className="text-3xl font-black tracking-tight">{announcement.title}</h2>
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-white dark:bg-slate-900 space-y-8">
          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
            {announcement.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button onClick={handleAccept} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2 py-6 text-lg rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <Download className="w-5 h-5" />
              Install Now
            </Button>
            <Button onClick={handleDraft} variant="outline" className="w-full sm:w-auto gap-2 py-6 text-lg rounded-xl">
              <Archive className="w-5 h-5 text-amber-500" />
              Save to Drafts
            </Button>
            <div className="flex-1" />
            <Button onClick={handleIgnore} variant="ghost" className="w-full sm:w-auto text-slate-400 hover:text-red-500 py-6">
              Ignore
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
