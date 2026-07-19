import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2, XCircle, RefreshCw, Plug, Unplug, ExternalLink,
  Loader2, Clock, FileText, MessageSquare, Video, Github,
  AlertCircle, Zap, Search, Filter
} from 'lucide-react';

// ─── Integration Definitions ─────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Import Docs, Sheets, Slides and PDFs. AI makes them searchable and actionable.',
    icon: <svg viewBox="0 0 87.3 81.8" className="w-6 h-6"><path d="m58 81.8-29-50.4h58.3z" fill="#00832d"/><path d="M29 81.8 0 31.5l29-50.4 29.1 50.4z" fill="#00aa4b"/><path d="m58 31.5-29-50.4h58.3z" fill="#ffd100"/><path d="M29.1 31.4 0 81.8h58.2z" fill="#2684fc"/></svg>,
    color: 'from-green-500/10 to-green-600/5',
    border: 'border-green-500/20',
    category: 'Storage',
    provider: 'google',
    scopes: 'email profile https://www.googleapis.com/auth/drive.readonly',
    phase: 1,
    importTypes: ['Documents', 'Spreadsheets', 'Presentations', 'PDFs'],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync pages and databases into your organizational memory.',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4.459 4.208c-.746.286-1.144.914-1.282 2.052l-.08 1.096c-.046.617.206 1.05.777 1.256l11.436 4.382v2.327l-5.632-1.996v2.308l5.632 2.03v2.368l-10.45-3.666V8.67l-2.023-.746v9.702c0 .874.577 1.487 1.465 1.79l11.234 3.99c.92.325 1.706-.05 1.884-.966l.08-1.077c.046-.628-.217-1.077-.777-1.29l-11.455-4.407v-2.316l5.65 2.02v-2.31l-5.65-2.03V5.006l10.468 3.655v7.697l2.02.766V7.4c0-.853-.564-1.488-1.453-1.802L4.459 4.208z"/></svg>,
    color: 'from-slate-500/10 to-slate-600/5',
    border: 'border-slate-500/20',
    category: 'Knowledge Base',
    provider: 'notion',
    scopes: '',
    phase: 1,
    importTypes: ['Pages', 'Databases', 'Notes'],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Capture channel messages, threads, and files for AI analysis.',
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.835zM17.688 8.835a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313zM15.165 18.958a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.52v-2.522h2.523zM15.165 17.687a2.527 2.527 0 0 1-2.523-2.521 2.528 2.528 0 0 1 2.523-2.521h6.313A2.527 2.527 0 0 1 24 15.166a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill="#E01E5A"/></svg>,
    color: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20',
    category: 'Messaging',
    provider: 'slack',
    scopes: 'channels:history channels:read files:read users:read',
    phase: 1,
    importTypes: ['Messages', 'Threads', 'Files'],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Auto-import meeting recordings and transcripts. Get instant AI summaries.',
    icon: <svg viewBox="0 0 24 24" fill="#2D8CFF" className="w-6 h-6"><path d="M17.063 5.438h-11.45c-2.31 0-4.188 1.878-4.188 4.188v6.75c0 2.31 1.878 4.188 4.188 4.188h11.45c2.31 0 4.188-1.878 4.188-4.188v-6.75c0-2.31-1.878-4.188-4.188-4.188zm-5.188 9.375h-2.25v2.25c0 .315-.248.563-.563.563s-.563-.248-.563-.563v-2.25h-2.25c-.315 0-.563-.248-.563-.563s.248-.563.563-.563h2.25v-2.25c0-.315.248-.563.563-.563s.563.248.563.563v2.25h2.25c.315 0 .563.248.563.563s-.248.563-.563.563zm10.125-1.125l-2.688 1.688v-3.375l2.688 1.688z"/></svg>,
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    category: 'Meetings',
    provider: 'zoom',
    scopes: 'recording:read meeting:read',
    phase: 1,
    importTypes: ['Recordings', 'Transcripts', 'Meeting Notes'],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link issues, PRs, and commits to your meeting decisions.',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>,
    color: 'from-gray-500/10 to-gray-600/5',
    border: 'border-gray-500/20',
    category: 'Engineering',
    provider: 'github',
    scopes: 'repo read:org',
    phase: 1,
    importTypes: ['Issues', 'Pull Requests', 'Commits'],
  },
  {
    id: 'microsoft_onedrive',
    name: 'Microsoft OneDrive',
    description: 'Connect Microsoft 365 documents, SharePoint, and OneDrive files.',
    icon: '🔷',
    color: 'from-sky-500/10 to-sky-600/5',
    border: 'border-sky-500/20',
    category: 'Storage',
    provider: 'microsoft',
    scopes: 'offline_access user.read Files.Read.All',
    phase: 2,
    importTypes: ['Documents', 'Spreadsheets', 'Presentations'],
  },
  {
    id: 'ms_teams',
    name: 'Microsoft Teams',
    description: 'Sync Teams chats, meeting recordings, and shared files.',
    icon: '🟦',
    color: 'from-indigo-500/10 to-indigo-600/5',
    border: 'border-indigo-500/20',
    category: 'Meetings',
    provider: 'microsoft',
    scopes: 'offline_access user.read Chat.Read ChannelMessage.Read.All',
    phase: 2,
    importTypes: ['Chats', 'Recordings', 'Files'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Capture important emails and link them to projects and meetings.',
    icon: '📧',
    color: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
    category: 'Email',
    provider: 'google',
    scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly',
    phase: 2,
    importTypes: ['Emails', 'Attachments', 'Threads'],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Connect tickets, sprints, and bugs to meeting decisions.',
    icon: '🔵',
    color: 'from-blue-600/10 to-blue-700/5',
    border: 'border-blue-600/20',
    category: 'Project Management',
    provider: 'jira',
    phase: 2,
    importTypes: ['Issues', 'Sprints', 'Epics'],
  },
  {
    id: 'confluence',
    name: 'Confluence',
    description: 'Import engineering docs and enterprise knowledge pages.',
    icon: '🔵',
    color: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/20',
    category: 'Knowledge Base',
    provider: 'confluence',
    phase: 2,
    importTypes: ['Pages', 'Spaces', 'Blogs'],
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    description: 'Tasks and project management integrated with your meeting knowledge.',
    icon: '🟪',
    color: 'from-violet-500/10 to-violet-600/5',
    border: 'border-violet-500/20',
    category: 'Project Management',
    provider: 'clickup',
    phase: 2,
    importTypes: ['Tasks', 'Docs', 'Comments'],
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Sync projects and tasks with your organizational memory.',
    icon: '🔴',
    color: 'from-red-400/10 to-red-500/5',
    border: 'border-red-400/20',
    category: 'Project Management',
    provider: 'asana',
    phase: 2,
    importTypes: ['Projects', 'Tasks', 'Goals'],
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Engineering issue tracking connected to your meeting notes.',
    icon: '🟤',
    color: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20',
    category: 'Engineering',
    provider: 'linear',
    phase: 2,
    importTypes: ['Issues', 'Projects', 'Cycles'],
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Import boards and cards into your knowledge base.',
    icon: <svg viewBox="0 0 24 24" fill="#0052CC" className="w-6 h-6"><path d="M1.385 0h21.23C23.38 0 24 .62 24 1.385v21.23C24 23.38 23.38 24 22.615 24H1.385C.62 24 0 23.38 0 22.615V1.385C0 .62.62 0 1.385 0zM10.84 11.23H3.692V3.692h7.149v7.538zm9.468 5.539h-7.149V3.692h7.149v13.077z"/></svg>,
    color: 'from-blue-400/10 to-blue-500/5',
    border: 'border-blue-400/20',
    category: 'Project Management',
    provider: 'trello',
    phase: 1,
    importTypes: ['Boards', 'Cards', 'Comments'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud file synchronization for documents and media.',
    icon: <svg viewBox="0 0 24 24" fill="#0061FF" className="w-6 h-6"><path d="M6.022 1.4L0 5.267l5.978 3.844L12 5.289 6.022 1.4zM17.978 1.4L12 5.289l5.978 3.822L24 5.267 17.978 1.4zM0 13.022l6.022 3.867L12 13.044 6.022 9.2 0 13.022zm24 0l-6.022 3.867L12 13.044l5.978-3.844L24 13.022zm-12 4.022L6.022 20.8 12 24l5.978-3.2L12 17.044z"/></svg>,
    color: 'from-sky-400/10 to-sky-500/5',
    border: 'border-sky-400/20',
    category: 'Storage',
    provider: 'dropbox',
    phase: 1,
    importTypes: ['Files', 'Folders'],
  },
  {
    id: 'box',
    name: 'Box',
    description: 'Enterprise document management and content collaboration.',
    icon: <svg viewBox="0 0 24 24" fill="#0061D5" className="w-6 h-6"><path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zM8.887 15.656h-2.1v-6.9h2.525c2.476 0 3.856 1.545 3.856 3.447 0 1.944-1.408 3.453-3.896 3.453zm-.088-1.579h.336c1.238 0 1.838-.727 1.838-1.874 0-1.127-.575-1.854-1.815-1.854h-.359v3.728zm7.534 1.579h-2.22l2.366-3.34-2.18-3.56h2.24l1.018 1.84c.159.294.279.564.385.836h.024c.106-.272.226-.542.399-.836l1.025-1.84h2.15l-2.2 3.483 2.457 3.417h-2.316l-1.228-1.954a6.624 6.624 0 01-.399-.748h-.024a5.955 5.955 0 01-.385.748l-1.148 1.954z"/></svg>,
    color: 'from-blue-300/10 to-blue-400/5',
    border: 'border-blue-300/20',
    category: 'Storage',
    provider: 'box',
    phase: 1,
    importTypes: ['Files', 'Folders', 'Notes'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect customer meetings and sales knowledge.',
    icon: <svg viewBox="0 0 24 24" fill="#00A1E0" className="w-6 h-6"><path d="M16.14 8.79a4.84 4.84 0 00-4.66-3.41 4.78 4.78 0 00-3.69 1.77 3.51 3.51 0 00-2.36-.93 3.55 3.55 0 00-3.55 3.43c0 .09 0 .17.02.26A2.88 2.88 0 000 12.63a2.9 2.9 0 002.9 2.9h14.93a3.57 3.57 0 001.35-6.86A4.81 4.81 0 0016.14 8.79z"/></svg>,
    color: 'from-sky-500/10 to-sky-600/5',
    border: 'border-sky-500/20',
    category: 'CRM',
    provider: 'salesforce',
    phase: 1,
    importTypes: ['Accounts', 'Opportunities', 'Notes'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Link CRM data with meeting notes and customer interactions.',
    icon: <svg viewBox="0 0 24 24" fill="#FF7A59" className="w-6 h-6"><path d="M21.2 5.9c.7-1.3-.2-2.8-1.7-2.8h-4.3c-1.1 0-2.1.7-2.5 1.7l-1 2.5c-.3.7-1.1 1-1.8.6l-1.9-1.2c-.8-.5-1.9-.3-2.5.4l-3 3c-.6.6-.7 1.6-.2 2.3l1.8 2.3c.5.6.5 1.5 0 2.2l-3 3c-.7.7-1.8.7-2.5 0-.4-.4-.5-.9-.5-1.4v-4.1c0-1.5 1.6-2.5 2.9-1.8l3.1 1.7c.6.3 1.3.1 1.7-.5l1.6-2c.5-.6.4-1.6-.3-2l-3.3-2c-.9-.5-2-.2-2.6.6l-2.1 2.7c-1 1.3-3.1.6-3.1-1.1v-6c0-1.7 2-2.4 3.1-1.1l2 2.6c.5.6 1.5.8 2.2.3l3.3-2c.8-.5 1.9-.2 2.5.6l1.6 2c.4.5 1.2.7 1.7.3l3.1-1.8c1.3-.8 3-1 4.2.3.8.8.8 2.1 0 2.9l-4.1 4c-.6.6-.7 1.6-.2 2.3l1.6 2c.5.7 1.3.9 2.1.6l3-1c1-.3 2.1.2 2.5 1.2.5 1 0 2.2-.9 2.6L16 23.3c-1.2.5-2.6-.2-3.2-1.3l-1.3-2.6c-.3-.7-1.1-1-1.8-.5l-1.8 1.1c-.8.5-1.8.4-2.5-.2l-2.9-2.6c-1.3-1.1-1-3.1.5-3.8l3-1.5c.7-.3 1.5-.1 1.9.6l1.4 2.1c.4.6 1.3.8 1.9.4l2.5-1.5c1.4-.8 3.1-.3 3.9 1.1l2.5 4.3z"/></svg>,
    color: 'from-orange-500/10 to-orange-600/5',
    border: 'border-orange-500/20',
    category: 'CRM',
    provider: 'hubspot',
    phase: 1,
    importTypes: ['Contacts', 'Deals', 'Notes'],
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    description: 'Import Google Meet recordings and transcripts automatically.',
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M21 2H3c-.55 0-1 .45-1 1v18c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-6 13h-3v3H9v-3H6v-3h3V9h3v3h3v3z" fill="#00832d"/></svg>,
    color: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20',
    category: 'Meetings',
    provider: 'google',
    scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly',
    phase: 1,
    importTypes: ['Recordings', 'Transcripts'],
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Capture important emails from Outlook and Office 365.',
    icon: <svg viewBox="0 0 24 24" fill="#0078D4" className="w-6 h-6"><path d="M12.983 6.963a4.013 4.013 0 004.02-4.018A4.016 4.016 0 0012.983 0a4.01 4.01 0 00-4.018 4.018c0 2.222 1.795 4.018 4.018 4.018zm6.541.341c.642.66 1.045 1.564 1.045 2.557v.296h3.42V7.337c0-1.228-1.57-2.316-4.062-2.735-.121.848-.466 1.637-.991 2.298l.588.404zM3.463 9.873h11.23v14.076H3.463V9.873zm14.417.296h-1.895v13.567h5.952v-2.836c0-4.148-1.63-7.51-4.057-10.731z"/></svg>,
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    category: 'Email',
    provider: 'microsoft',
    phase: 1,
    importTypes: ['Emails', 'Calendar', 'Attachments'],
  },
];

const CATEGORIES = ['All', 'Storage', 'Messaging', 'Meetings', 'Engineering', 'Knowledge Base', 'Project Management', 'Email', 'CRM'];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function IntegrationsHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const companyId = user?.user_metadata?.company_id || user?.company_id;

  const [connected, setConnected] = useState({});
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [disconnecting, setDisconnecting] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle OAuth callback status
  useEffect(() => {
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const message = searchParams.get('message');

    if (status === 'success' && provider) {
      toast({ title: '✅ Connected!', description: `${provider.replace('_', ' ')} connected successfully. Syncing your data...` });
      setSearchParams({});
      loadConnected();
    } else if (status === 'error') {
      toast({ title: 'Connection Failed', description: message?.replace(/_/g, ' ') || 'Authentication failed.', variant: 'destructive' });
      setSearchParams({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConnected = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from('clipad_integrations').select('*').eq('company_id', companyId);
    if (data) {
      const map = {};
      data.forEach(row => { map[row.provider] = row; });
      setConnected(map);
    }
    setLoading(false);
  }, [companyId]);

  const loadKnowledge = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from('clipad_imported_knowledge').select('id, provider, content_type, title, url, imported_at, ai_summary').eq('company_id', companyId).order('imported_at', { ascending: false }).limit(20);
    if (data) setKnowledge(data);
  }, [companyId]);

  useEffect(() => {
    loadConnected();
    loadKnowledge();
  }, [loadConnected, loadKnowledge]);

  const handleConnect = (integration) => {
    if (!companyId) {
      toast({ title: 'Not authorized', description: 'You must be an admin to connect integrations.', variant: 'destructive' });
      return;
    }
    const returnUrl = encodeURIComponent(window.location.href.split('?')[0]);
    const oauthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-init?provider=${integration.provider}&company_id=${companyId}&user_id=${user.id}&integration_id=${integration.id}&return_url=${returnUrl}`;
    window.location.href = oauthUrl;
  };

  const handleDisconnect = async (integration) => {
    setDisconnecting(prev => ({ ...prev, [integration.id]: true }));
    try {
      await supabase.from('clipad_integrations').delete().eq('company_id', companyId).eq('provider', integration.provider);
      toast({ title: 'Disconnected', description: `${integration.name} has been disconnected.` });
      await loadConnected();
    } catch (e) {
      toast({ title: 'Error', description: 'Could not disconnect.', variant: 'destructive' });
    } finally {
      setDisconnecting(prev => ({ ...prev, [integration.id]: false }));
    }
  };

  const handleSyncNow = async (integration) => {
    const conn = connected[integration.provider];
    if (!conn) return;
    setSyncing(prev => ({ ...prev, [integration.id]: true }));
    try {
      const { error } = await supabase.functions.invoke('integration-sync', {
        body: { integrationId: conn.id, provider: integration.id }
      });
      if (error) throw error;
      toast({ title: '🔄 Sync started', description: `Syncing ${integration.name}. New items will appear shortly.` });
      setTimeout(() => { loadConnected(); loadKnowledge(); }, 3000);
    } catch (e) {
      toast({ title: 'Sync failed', description: e.message || 'Could not sync.', variant: 'destructive' });
    } finally {
      setSyncing(prev => ({ ...prev, [integration.id]: false }));
    }
  };

  const clearSyncError = async (integration) => {
    const conn = connected[integration.provider] || connected[integration.id];
    if (!conn) return;
    try {
      await supabase.from('clipad_integrations').update({ sync_error: null }).eq('id', conn.id);
      setConnected(prev => ({ ...prev, [integration.id || integration.provider]: { ...conn, sync_error: null }}));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredIntegrations = INTEGRATIONS.filter(i => {
    const matchesCategory = activeCategory === 'All' || i.category === activeCategory;
    const matchesSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = Object.keys(connected).length;
  const knowledgeCount = knowledge.length;

  return (
    <div className="min-h-full bg-background text-foreground pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(var(--primary-rgb),0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
              <p className="text-sm text-muted-foreground">Connect your tools. Build organizational memory.</p>
            </div>
          </div>
          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: 'Connected', value: connectedCount, icon: CheckCircle2, color: 'text-emerald-500' },
              { label: 'Knowledge Items', value: knowledgeCount, icon: FileText, color: 'text-blue-500' },
              { label: 'Available', value: INTEGRATIONS.length, icon: Zap, color: 'text-primary' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="font-bold text-foreground">{stat.value}</span>
                <span className="text-muted-foreground text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8 space-y-8">

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Connected integrations summary */}
        {connectedCount > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
            <h2 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {connectedCount} Active Connection{connectedCount !== 1 ? 's' : ''}
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(connected).map(([provider, conn]) => {
                const intg = INTEGRATIONS.find(i => i.provider === provider || i.id === provider);
                if (!intg) return null;
                return (
                  <div key={provider} className="flex items-center gap-2 bg-white dark:bg-card border border-emerald-500/20 rounded-xl px-3 py-1.5">
                    <span>{intg.icon}</span>
                    <span className="text-sm font-semibold">{intg.name}</span>
                    {conn.last_synced_at && (
                      <span className="text-xs text-muted-foreground">• synced {new Date(conn.last_synced_at).toLocaleDateString()}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Integration Cards Grid */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">
            {activeCategory === 'All' ? 'All Integrations' : activeCategory}
            <span className="ml-2 text-muted-foreground font-normal text-sm">({filteredIntegrations.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIntegrations.map(integration => {
              const conn = connected[integration.provider] || connected[integration.id];
              const isConnected = !!conn;
              const isSyncing = syncing[integration.id];
              const isDisconnecting = disconnecting[integration.id];
              const isPhase1 = integration.phase === 1;

              return (
                <div
                  key={integration.id}
                  className={`group relative bg-card border ${integration.border} rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200 ${!isPhase1 ? 'opacity-75' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${integration.color} border ${integration.border} flex items-center justify-center text-2xl shadow-sm shrink-0`}>
                        {integration.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm">{integration.name}</h3>
                          {isConnected && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Connected
                            </span>
                          )}
                          {!isPhase1 && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{integration.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">{integration.description}</p>

                  {/* Import types */}
                  <div className="flex flex-wrap gap-1.5">
                    {integration.importTypes?.map(type => (
                      <span key={type} className="px-2 py-0.5 bg-secondary text-muted-foreground text-[11px] rounded-lg font-medium">{type}</span>
                    ))}
                  </div>

                  {/* Sync status */}
                  {isConnected && conn?.last_synced_at && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Last synced: {new Date(conn.last_synced_at).toLocaleString()}
                    </div>
                  )}
                  {isConnected && conn?.sync_error && (
                    <div className="flex items-start justify-between gap-1.5 text-xs text-red-500 bg-red-500/10 p-2 rounded-lg">
                      <div className="flex gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="leading-snug break-all">{conn.sync_error}</span>
                      </div>
                      <button onClick={() => clearSyncError(integration)} className="hover:bg-red-500/20 rounded p-0.5 shrink-0 transition-colors">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                    {isPhase1 ? (
                      isConnected ? (
                        <>
                          <button
                            onClick={() => handleSyncNow(integration)}
                            disabled={isSyncing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                          </button>
                          <button
                            onClick={() => handleDisconnect(integration)}
                            disabled={isDisconnecting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors disabled:opacity-50 ml-auto"
                          >
                            {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                          <Plug className="w-3.5 h-3.5" />
                          Connect
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Available in the next release</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Imported Knowledge */}
        {knowledge.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recently Imported Knowledge
              <span className="ml-1 text-muted-foreground font-normal text-sm">({knowledge.length} items)</span>
            </h2>
            <div className="space-y-2">
              {knowledge.map(item => {
                const intg = INTEGRATIONS.find(i => i.provider === item.provider || i.id === item.provider);
                return (
                  <div key={item.id} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
                    <div className="text-xl shrink-0 mt-0.5">{intg?.icon || '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground truncate">{item.title || 'Untitled'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-md shrink-0">{item.content_type}</span>
                      </div>
                      {item.ai_summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.ai_summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">{intg?.name || item.provider}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{new Date(item.imported_at).toLocaleDateString()}</span>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* API credentials notice */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 mb-1">API Credentials Required</h3>
            <p className="text-sm text-muted-foreground">
              To activate integrations, register OAuth apps on each provider's developer portal and add the credentials as Supabase secrets. 
              Contact your administrator or check the <strong>CliPad Integration Setup Guide</strong> for step-by-step instructions.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
