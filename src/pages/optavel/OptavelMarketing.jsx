import React, { useState, useCallback } from 'react';
import { Megaphone, Calendar, Share2, Search, UploadCloud, FileText, Trash2, Plus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

export default function OptavelMarketing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [newCampaignTitle, setNewCampaignTitle] = useState('');

  const companyId = user?.profile?.company_id || user?.company_id;

  // 1. Fetch Campaigns
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['optavel_campaigns', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_campaigns WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  // 2. Fetch Marketing Reports
  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['optavel_marketing_reports', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_marketing_reports WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  // 3. Fetch SEO Tracking
  const { data: seoKeywords = [], isLoading: loadingSeo } = useQuery({
    queryKey: ['optavel_seo_tracking', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_seo_tracking WHERE company_id = ? ORDER BY rank ASC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  // Create Campaign Mutation
  const createCampaign = useMutation({
    mutationFn: async (title) => {
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_campaigns (id, company_id, title, status) VALUES (?, ?, ?, ?)`,
        [id, companyId, title, 'planned']
      );
      return { id, title };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_campaigns']);
      setNewCampaignTitle('');
      toast({ title: 'Campaign created successfully' });
    }
  });

  // Upload Report File
  const handleFileUpload = async (file, campaignId = null) => {
    if (!companyId) return;
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/${uuidv4()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('optavel_marketing_assets')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('optavel_marketing_assets')
        .getPublicUrl(fileName);

      // Save to database
      const reportId = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_marketing_reports (id, company_id, campaign_id, file_url, file_name, uploaded_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [reportId, companyId, campaignId, publicUrlData.publicUrl, file.name, user.id]
      );

      queryClient.invalidateQueries(['optavel_marketing_reports']);
      toast({ title: 'Report uploaded successfully' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setDragActive(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-orange-500" />
          Marketing
        </h1>
        <p className="text-slate-400 mt-1">Campaigns, Content Calendar, SEO, and Brand Assets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Campaigns & Uploads */}
        <div className="col-span-2 space-y-6">
          
          {/* File Upload Dropzone */}
          <div 
            className={`bg-slate-50 dark:bg-slate-900 border-2 border-dashed rounded-2xl p-8 transition-colors flex flex-col items-center justify-center min-h-[200px] ${dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:border-white/20'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-slate-900 dark:text-white font-medium">Uploading report...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <UploadCloud className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Upload Marketing Reports</h3>
                  <p className="text-sm text-slate-400">Drag and drop PDFs, Images, or Spreadsheets here.</p>
                </div>
                <label className="px-6 py-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:bg-white/15 text-slate-900 dark:text-white text-sm font-medium rounded-lg cursor-pointer transition-colors mt-2">
                  Browse Files
                  <input type="file" className="hidden" onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }} />
                </label>
              </div>
            )}
          </div>

          {/* Active Campaigns */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-400" /> Active Campaigns</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New campaign..."
                  className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-orange-500"
                  value={newCampaignTitle}
                  onChange={e => setNewCampaignTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newCampaignTitle && createCampaign.mutate(newCampaignTitle)}
                />
                <button 
                  onClick={() => newCampaignTitle && createCampaign.mutate(newCampaignTitle)}
                  className="p-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-slate-900 dark:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {loadingCampaigns ? (
                <p className="text-sm text-slate-500">Loading campaigns...</p>
              ) : campaigns.length === 0 ? (
                <p className="text-sm text-slate-500">No campaigns found. Create one above.</p>
              ) : (
                campaigns.map(camp => (
                  <div key={camp.id} className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{camp.title}</h4>
                      <p className="text-xs text-slate-400">Budget: ${camp.budget || 0} • Spent: ${camp.spent || 0}</p>
                    </div>
                    <div>
                      <span className="px-3 py-1 text-xs rounded-full bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white capitalize">{camp.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column: SEO & Reports List */}
        <div className="space-y-6">
          
          {/* SEO Intelligence */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-emerald-400" /> SEO Intelligence</h2>
            <div className="space-y-3">
              {loadingSeo ? (
                <p className="text-sm text-slate-500">Loading SEO data...</p>
              ) : seoKeywords.length === 0 ? (
                <div className="text-center p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 border-dashed">
                  <p className="text-sm text-slate-500">No keywords tracked yet.</p>
                </div>
              ) : (
                seoKeywords.map(seo => (
                  <div key={seo.id} className="flex justify-between items-center p-3 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                    <span className="text-sm">{seo.keyword}</span>
                    <span className="text-sm text-emerald-400 font-bold">#{seo.rank}</span>
                  </div>
                ))
              )}
              
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" /> Recent Reports</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingReports ? (
                <p className="text-sm text-slate-500">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">No reports uploaded.</p>
              ) : (
                reports.map(rep => (
                  <a 
                    key={rep.id} 
                    href={rep.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:bg-white/10 transition-colors"
                  >
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm text-slate-900 dark:text-white truncate">{rep.file_name || 'Marketing Report'}</p>
                      <p className="text-xs text-slate-500">{new Date(rep.created_at).toLocaleDateString()}</p>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
