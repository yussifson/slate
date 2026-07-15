import { supabase } from '@/lib/supabase';

export const EnterpriseAnalyticsAPI = {
  /**
   * Fetch high-level utilization metrics for the entire tenant.
   */
  async getTenantMetrics(companyId) {
    try {
      // Spaces Count
      const { count: spacesCount, error: errSpaces } = await supabase
        .from('clipad_spaces')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
        
      if (errSpaces) console.error('[Enterprise] errSpaces:', errSpaces);

      // Total Videos (Async)
      const { count: videosCount, error: errVideos } = await supabase
        .from('clipad_videos')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
        
      if (errVideos) console.error('[Enterprise] errVideos:', errVideos);

      // Total Meetings
      const { count: meetingsCount, error: errMeetings } = await supabase
        .from('clipad_meeting_records')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (errMeetings) console.error('[Enterprise] errMeetings:', errMeetings);

      // Fetch a simple sample to determine total size (if sizing is available, else mock storage usage)
      // Usually storage is in a bucket, so we'll mock the storage based on video counts (e.g. 50MB per video/meeting)
      const totalAssets = (videosCount || 0) + (meetingsCount || 0);
      const estimatedStorageGB = ((totalAssets * 50) / 1024).toFixed(2);

      return {
        spaces: spacesCount || 0,
        videos: videosCount || 0,
        meetings: meetingsCount || 0,
        storageUsedGB: parseFloat(estimatedStorageGB)
      };
    } catch (e) {
      console.error('[Enterprise] getTenantMetrics failed:', e);
      return { spaces: 0, videos: 0, meetings: 0, storageUsedGB: 0 };
    }
  },

  /**
   * Fetch Organizational Intelligence Health across the workspace.
   */
  async getOrgIntelligenceHealth(companyId) {
    try {
      const { count: blockersCount } = await supabase
        .from('clipad_blockers')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', companyId)
        .eq('status', 'open');

      const { count: decisionsCount } = await supabase
        .from('clipad_decisions')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', companyId);

      const { count: commitmentsCount } = await supabase
        .from('clipad_commitments')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', companyId)
        .eq('status', 'pending');

      return {
        openBlockers: blockersCount || 0,
        totalDecisions: decisionsCount || 0,
        pendingCommitments: commitmentsCount || 0
      };
    } catch (e) {
      console.error('[Enterprise] getOrgIntelligenceHealth failed:', e);
      return { openBlockers: 0, totalDecisions: 0, pendingCommitments: 0 };
    }
  },

  /**
   * Fetch Usage & Adoption Trends (Video vs Meeting last 30 days)
   */
  async getAdoptionTrends(companyId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromIso = thirtyDaysAgo.toISOString();

      const { data: videos } = await supabase
        .from('clipad_videos')
        .select('created_at')
        .eq('company_id', companyId)
        .gte('created_at', fromIso);

      const { data: meetings } = await supabase
        .from('clipad_meeting_records')
        .select('created_at')
        .eq('company_id', companyId)
        .gte('created_at', fromIso);

      // Group by day
      const trends = {};
      
      const processRecords = (records, type) => {
        if (!records) return;
        records.forEach(r => {
          const day = r.created_at.split('T')[0];
          if (!trends[day]) trends[day] = { date: day, videos: 0, meetings: 0 };
          trends[day][type] += 1;
        });
      };

      processRecords(videos, 'videos');
      processRecords(meetings, 'meetings');

      const sortedTrends = Object.values(trends).sort((a, b) => new Date(a.date) - new Date(b.date));
      return sortedTrends;
    } catch (e) {
      console.error('[Enterprise] getAdoptionTrends failed:', e);
      return [];
    }
  },

  /**
   * Fetch recent audit and security events.
   */
  async getRecentAuditLogs(companyId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('clipad_org_events')
        .select('*, profiles(full_name, avatar_url)')
        .eq('workspace_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[Enterprise] getRecentAuditLogs failed:', e);
      return [];
    }
  }
};
