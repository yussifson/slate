import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { SlateSitesAPI } from '@/api/SlateSitesAPI';
import { generateSiteFromPrompt } from '@/api/SlateSitesAI';
import { VercelAPI } from '@/api/VercelAPI';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TemplateGallery from '@/components/sites/SiteTemplates/TemplateGallery';

// ── Icons (inline SVG for zero-dependency) ──────────────────────────────────
const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const icons = {
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    sparkles: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
    layers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    external: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    link: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  };
  return icons[name] || null;
};

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  primary: '#6366f1',
  primaryLight: '#eef2ff',
  green: '#10b981',
  greenLight: '#ecfdf5',
  amber: '#f59e0b',
  amberLight: '#fffbeb',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.08)',
};

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = C.primary, bg = C.primaryLight }) {
  return (
    <div style={{
      background: C.white, borderRadius: '14px', padding: '20px 24px',
      boxShadow: C.shadow, display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon} size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: C.gray900, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '13px', color: C.gray600, marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}

// ── Quick Action Button ───────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, variant = 'default', disabled = false }) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === 'primary';
  const isSuccess = variant === 'success';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 18px', borderRadius: '10px',
        border: isPrimary || isSuccess ? 'none' : `1px solid ${C.gray200}`,
        background: disabled ? C.gray100 :
                    isPrimary ? (hovered ? '#4f46e5' : C.primary) :
                    isSuccess ? (hovered ? '#059669' : C.green) :
                    hovered ? C.gray100 : C.white,
        color: disabled ? C.gray400 :
               isPrimary || isSuccess ? C.white : C.gray700,
        fontWeight: 600, fontSize: '14px', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isPrimary && !disabled ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
      }}
    >
      <Icon name={icon} size={16} color={disabled ? C.gray400 : isPrimary || isSuccess ? C.white : C.gray700} />
      {label}
    </button>
  );
}

// ── Tab ──────────────────────────────────────────────────────────────────────
function Tab({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 16px', borderRadius: '10px', border: 'none',
        background: active ? C.primaryLight : 'transparent',
        color: active ? C.primary : C.gray600,
        fontWeight: active ? 700 : 500, fontSize: '14px',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <Icon name={icon} size={15} color={active ? C.primary : C.gray600} />
      {label}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function SlateSites() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiIndustry, setAiIndustry] = useState('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDomainSettings, setShowDomainSettings] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  // ── Fetch site ─────────────────────────────────────────────────────────────
  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ['slate_site', companyId],
    queryFn: () => SlateSitesAPI.getSite(companyId),
    enabled: !!companyId,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['slate_site_pages', site?.id],
    queryFn: () => SlateSitesAPI.getPages(site.id),
    enabled: !!site?.id,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['slate_site_submissions', site?.id],
    queryFn: () => SlateSitesAPI.getSubmissions(site.id),
    enabled: !!site?.id,
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['slate_site_analytics', site?.id],
    queryFn: () => SlateSitesAPI.getAnalytics(site.id, { days: 30 }),
    enabled: !!site?.id,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createSiteMutation = useMutation({
    mutationFn: () => SlateSitesAPI.createSite({
      companyId, createdBy: user?.email, siteName: user?.company_name || 'My Website',
    }),
    onSuccess: () => queryClient.invalidateQueries(['slate_site', companyId]),
  });

  const publishMutation = useMutation({
    mutationFn: (publish) => SlateSitesAPI.publishSite(site.id, publish),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['slate_site', companyId]);
      toast.success(data.is_published ? '🚀 Site published!' : 'Site unpublished');
    },
  });

  const connectDomainMutation = useMutation({
    mutationFn: async (domain) => {
      // Add to Vercel
      try { await VercelAPI.addDomain(domain); } catch (e) { console.warn('Vercel domain add:', e); }
      // Save to DB
      return SlateSitesAPI.connectDomain(site.id, domain);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['slate_site', companyId]);
      toast.success('Custom domain connected! Update your DNS as shown below.');
      setShowDomainSettings(false);
    },
    onError: (e) => toast.error(e.message),
  });

  // ── AI Generation ──────────────────────────────────────────────────────────
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const siteData = await generateSiteFromPrompt(
        aiPrompt, aiIndustry,
        { name: user?.company_name, tagline: '' }
      );
      // Apply template
      let currentSite = site;
      if (!currentSite) {
        currentSite = await createSiteMutation.mutateAsync();
      }
      await SlateSitesAPI.applyTemplate(currentSite.id, companyId, user?.email, siteData);
      queryClient.invalidateQueries(['slate_site', companyId]);
      queryClient.invalidateQueries(['slate_site_pages', currentSite.id]);
      toast.success('🎉 AI generated your website! Open the builder to customize.');
      setShowAIDialog(false);
      setAiPrompt('');
    } catch (e) {
      toast.error('AI generation failed: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Template apply ─────────────────────────────────────────────────────────
  const handleApplyTemplate = async (templateData) => {
    try {
      let currentSite = site;
      if (!currentSite) {
        currentSite = await createSiteMutation.mutateAsync();
      }
      await SlateSitesAPI.applyTemplate(currentSite.id, companyId, user?.email, templateData);
      queryClient.invalidateQueries(['slate_site', companyId]);
      queryClient.invalidateQueries(['slate_site_pages', currentSite.id]);
      toast.success('Template applied! Open the builder to customize.');
      setShowTemplates(false);
    } catch (e) {
      toast.error('Failed to apply template: ' + e.message);
    }
  };

  // ── Site URL ───────────────────────────────────────────────────────────────
  const siteUrl = site?.custom_domain
    ? `https://${site.custom_domain}`
    : site?.subdomain
    ? `https://${site.subdomain}.slate.com`
    : null;

  const subdomain = window.location.hostname.split('.')[0];
  const previewUrl = `${window.location.protocol}//${window.location.hostname}`;

  // ── Analytics summary ──────────────────────────────────────────────────────
  const totalVisits = analytics.length;
  const newSubmissions = submissions.filter(s => s.status === 'new').length;
  const uniquePages = [...new Set(analytics.map(a => a.page_slug))].length;

  // ─────────────────────────────────────────────────────────────────────────
  if (siteLoading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: `3px solid ${C.gray200}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: C.gray600 }}>Loading Slate Sites...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ─── NO SITE YET — onboarding screen ─────────────────────────────────────
  if (!site) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: `linear-gradient(135deg, ${C.primary}, #8b5cf6)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}>
            <Icon name="globe" size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: C.gray900, margin: '0 0 12px' }}>
            Welcome to Slate Sites
          </h1>
          <p style={{ fontSize: '16px', color: C.gray600, margin: 0, maxWidth: '480px', marginInline: 'auto', lineHeight: 1.6 }}>
            Build a beautiful, professional website for your business — natively connected to your Slate CRM, bookings, inventory, and more.
          </p>
        </div>

        {/* 3 options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          {[
            {
              icon: 'sparkles', label: 'Generate with AI',
              desc: 'Describe your business. AI builds your entire website in seconds.',
              color: '#8b5cf6', bg: '#f5f3ff', action: () => setShowAIDialog(true),
            },
            {
              icon: 'layers', label: 'Choose a Template',
              desc: 'Start with a professionally designed template for your industry.',
              color: C.primary, bg: C.primaryLight, action: () => setShowTemplates(true),
            },
            {
              icon: 'edit', label: 'Start from Scratch',
              desc: 'Build your website exactly how you want it, block by block.',
              color: C.green, bg: C.greenLight, action: () => createSiteMutation.mutate(),
            },
          ].map(opt => (
            <button
              key={opt.label}
              onClick={opt.action}
              style={{
                background: C.white, border: `1px solid ${C.gray200}`, borderRadius: '16px',
                padding: '28px 24px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s ease', boxShadow: C.shadow,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = C.shadowMd; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = C.shadow; }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              }}>
                <Icon name={opt.icon} size={24} color={opt.color} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: C.gray900 }}>{opt.label}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: C.gray600, lineHeight: 1.5 }}>{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Feature highlights */}
        <div style={{ background: C.gray50, borderRadius: '16px', padding: '24px', border: `1px solid ${C.gray100}` }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: C.gray900 }}>
            🔗 Natively Connected to Your Slate Workspace
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Booking forms → CRM leads', icon: '📋' },
              { label: 'Product pages → Live inventory', icon: '📦' },
              { label: 'Menu sections → POS data', icon: '🍽️' },
              { label: 'Appointments → Booking module', icon: '📅' },
              { label: 'Contact forms → Auto CRM entry', icon: '🤝' },
              { label: 'Job pages → HR module', icon: '👥' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.gray700 }}>
                <span>{f.icon}</span> {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* AI Dialog */}
        {showAIDialog && <AIDialog
          prompt={aiPrompt} setPrompt={setAiPrompt}
          industry={aiIndustry} setIndustry={setAiIndustry}
          onGenerate={handleAIGenerate} onClose={() => setShowAIDialog(false)}
          isGenerating={isGenerating}
        />}

        {/* Templates */}
        {showTemplates && <TemplateGallery onSelect={handleApplyTemplate} onClose={() => setShowTemplates(false)} />}
      </div>
    );
  }

  // ─── HAS SITE — main management UI ───────────────────────────────────────
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: C.gray900 }}>
              Slate Sites
            </h1>
            <span style={{
              padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
              background: site.is_published ? C.greenLight : C.amberLight,
              color: site.is_published ? C.green : C.amber,
            }}>
              {site.is_published ? '● Live' : '○ Draft'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: C.gray600 }}>
            {site.site_name || 'My Website'} {siteUrl && <span>· <a href={siteUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.primary }}>{siteUrl}</a></span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ActionBtn icon="eye" label="Preview" onClick={() => window.open(previewUrl, '_blank')} />
          <ActionBtn icon="edit" label="Open Builder" onClick={() => navigate('/sites/builder')} />
          <ActionBtn
            icon={site.is_published ? 'check' : 'globe'}
            label={site.is_published ? 'Unpublish' : 'Publish Site'}
            variant={site.is_published ? 'default' : 'primary'}
            onClick={() => publishMutation.mutate(!site.is_published)}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon="chart" label="Page Views (30d)" value={totalVisits || '—'} />
        <StatCard icon="mail" label="New Form Submissions" value={newSubmissions || '—'} color={C.green} bg={C.greenLight} />
        <StatCard icon="layers" label="Published Pages" value={pages.length} color="#8b5cf6" bg="#f5f3ff" />
        <StatCard icon="globe" label="Site Status" value={site.is_published ? 'Live 🟢' : 'Draft'} color={site.is_published ? C.green : C.amber} bg={site.is_published ? C.greenLight : C.amberLight} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${C.gray100}`, paddingBottom: '4px' }}>
        {[
          { id: 'overview', label: 'Overview', icon: 'chart' },
          { id: 'pages', label: 'Pages', icon: 'layers' },
          { id: 'submissions', label: 'Form Submissions', icon: 'mail' },
          { id: 'settings', label: 'Settings', icon: 'settings' },
        ].map(t => <Tab key={t.id} {...t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />)}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div>
          {/* Quick actions */}
          <div style={{ background: C.white, borderRadius: '16px', padding: '24px', boxShadow: C.shadow, marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: C.gray900 }}>Quick Actions</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <ActionBtn icon="edit" label="Open Builder" onClick={() => navigate('/sites/builder')} variant="primary" />
              <ActionBtn icon="sparkles" label="AI: Generate Page" onClick={() => setShowAIDialog(true)} />
              <ActionBtn icon="layers" label="Apply Template" onClick={() => setShowTemplates(true)} />
              <ActionBtn icon="link" label="Custom Domain" onClick={() => { setActiveTab('settings'); setShowDomainSettings(true); }} />
              <ActionBtn icon="eye" label="View Live Site" onClick={() => window.open(previewUrl, '_blank')} />
            </div>
          </div>

          {/* Pages summary */}
          <div style={{ background: C.white, borderRadius: '16px', padding: '24px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: C.gray900 }}>Site Pages</h2>
              <ActionBtn icon="plus" label="Add Page" onClick={() => navigate('/sites/builder')} />
            </div>
            {pages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: C.gray400 }}>
                <Icon name="layers" size={32} color={C.gray300} />
                <p style={{ margin: '12px 0 0', fontSize: '14px' }}>No pages yet. Open the builder to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pages.map(page => (
                  <div key={page.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '10px', background: C.gray50,
                    border: `1px solid ${C.gray100}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>{page.is_home ? '🏠' : '📄'}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: C.gray900 }}>{page.title}</div>
                        <div style={{ fontSize: '12px', color: C.gray500 }}>{page.slug}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                        background: page.is_published ? C.greenLight : C.gray100,
                        color: page.is_published ? C.green : C.gray500,
                      }}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                      <button
                        onClick={() => navigate(`/sites/builder?page=${page.id}`)}
                        style={{ padding: '5px 10px', borderRadius: '8px', border: `1px solid ${C.gray200}`, background: C.white, cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: C.gray700 }}
                      >Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div style={{ background: C.white, borderRadius: '16px', padding: '24px', boxShadow: C.shadow }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: C.gray900 }}>
            Form Submissions ({submissions.length})
          </h2>
          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: C.gray400 }}>
              <Icon name="mail" size={40} color={C.gray300} />
              <p style={{ margin: '16px 0 0', fontSize: '14px' }}>No form submissions yet. Publish your site to start receiving leads.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {submissions.map(sub => (
                <div key={sub.id} style={{
                  padding: '16px', borderRadius: '12px', border: `1px solid ${C.gray200}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: C.gray900 }}>
                      {sub.contact_name || 'Anonymous'}
                    </div>
                    <div style={{ fontSize: '13px', color: C.gray600, marginTop: '4px' }}>
                      {sub.contact_email} {sub.contact_phone && `· ${sub.contact_phone}`}
                    </div>
                    {sub.message && (
                      <div style={{ fontSize: '13px', color: C.gray600, marginTop: '6px', fontStyle: 'italic' }}>
                        "{sub.message.slice(0, 100)}{sub.message.length > 100 ? '...' : ''}"
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: C.gray400, marginTop: '8px' }}>
                      {new Date(sub.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                    background: sub.status === 'new' ? C.amberLight : sub.status === 'converted' ? C.greenLight : C.gray100,
                    color: sub.status === 'new' ? C.amber : sub.status === 'converted' ? C.green : C.gray600,
                    flexShrink: 0,
                  }}>
                    {sub.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pages' && (
        <div style={{ background: C.white, borderRadius: '16px', padding: '24px', boxShadow: C.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: C.gray900 }}>All Pages</h2>
            <ActionBtn icon="edit" label="Open Builder" onClick={() => navigate('/sites/builder')} variant="primary" />
          </div>
          <p style={{ color: C.gray600, fontSize: '14px' }}>Manage pages directly in the visual builder.</p>
          <ActionBtn icon="edit" label="Go to Builder →" onClick={() => navigate('/sites/builder')} variant="primary" />
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Domain Settings */}
          <div style={{ background: C.white, borderRadius: '16px', padding: '24px', boxShadow: C.shadow }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: C.gray900 }}>Domain Settings</h2>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: C.gray600 }}>Connect a custom domain to your Slate Site.</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: C.gray700, display: 'block', marginBottom: '6px' }}>Custom Domain</label>
                <input
                  value={customDomain || site.custom_domain || ''}
                  onChange={e => setCustomDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: `1px solid ${C.gray200}`, fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                onClick={() => connectDomainMutation.mutate(customDomain || site.custom_domain)}
                disabled={!customDomain && !site.custom_domain}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  background: C.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                }}
              >
                {site.custom_domain ? 'Update Domain' : 'Connect Domain'}
              </button>
            </div>
            {site.custom_domain && (
              <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '10px', background: C.gray50, border: `1px solid ${C.gray200}` }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: C.gray700 }}>DNS Configuration Required</p>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: C.gray600 }}>Add this CNAME record to your domain registrar:</p>
                <code style={{ fontSize: '12px', background: C.gray900, color: '#a3e635', padding: '8px 12px', borderRadius: '8px', display: 'block' }}>
                  CNAME: {site.custom_domain} → cname.vercel-dns.com
                </code>
              </div>
            )}
          </div>

          {/* SEO Settings */}
          <div style={{ background: C.white, borderRadius: '16px', padding: '24px', boxShadow: C.shadow }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: C.gray900 }}>SEO & Meta Tags</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Site Name', field: 'site_name', placeholder: 'My Business Name' },
                { label: 'SEO Title', field: 'seo_title', placeholder: 'My Business | Professional Services' },
                { label: 'Meta Description', field: 'seo_description', placeholder: '150-160 characters describing your business...' },
                { label: 'Google Analytics ID', field: 'google_analytics', placeholder: 'G-XXXXXXXXXX' },
              ].map(f => (
                <div key={f.field}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: C.gray700, display: 'block', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    defaultValue={site[f.field] || ''}
                    placeholder={f.placeholder}
                    onBlur={e => SlateSitesAPI.updateSite(site.id, { [f.field]: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: `1px solid ${C.gray200}`, fontSize: '14px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ background: '#fff5f5', borderRadius: '16px', padding: '24px', border: '1px solid #fee2e2' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>Danger Zone</h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#7f1d1d' }}>These actions are irreversible.</p>
            <button
              onClick={() => publishMutation.mutate(false)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            >
              Unpublish Site
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAIDialog && (
        <AIDialog
          prompt={aiPrompt} setPrompt={setAiPrompt}
          industry={aiIndustry} setIndustry={setAiIndustry}
          onGenerate={handleAIGenerate} onClose={() => setShowAIDialog(false)}
          isGenerating={isGenerating}
        />
      )}
      {showTemplates && (
        <TemplateGallery onSelect={handleApplyTemplate} onClose={() => setShowTemplates(false)} />
      )}
    </div>
  );
}

// ── AI Generation Dialog ──────────────────────────────────────────────────────
function AIDialog({ prompt, setPrompt, industry, setIndustry, onGenerate, onClose, isGenerating }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '560px', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: C.gray900 }}>AI Website Generator</h2>
            <p style={{ margin: 0, fontSize: '13px', color: C.gray600 }}>Describe your business and AI builds your entire site</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: C.gray100, border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: C.gray600 }}>✕</button>
        </div>

        {/* Industry */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: C.gray700, display: 'block', marginBottom: '8px' }}>Industry</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['general', 'law', 'hospital', 'restaurant', 'hotel', 'school', 'retail', 'agency'].map(ind => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                style={{
                  padding: '6px 14px', borderRadius: '100px', border: industry === ind ? 'none' : `1px solid ${C.gray200}`,
                  background: industry === ind ? C.primary : C.white,
                  color: industry === ind ? '#fff' : C.gray700,
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >{ind}</button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: C.gray700, display: 'block', marginBottom: '8px' }}>Describe Your Business</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. 'Build a law firm website for Smith & Associates specializing in personal injury and criminal defense in New York City'"
            rows={4}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: '12px',
              border: `1px solid ${C.gray200}`, fontSize: '14px',
              resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.gray400 }}>
            The more detail you provide, the better the result. Include your business name, location, and key services.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${C.gray200}`, background: C.white, color: C.gray700, fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Cancel
          </button>
          <button
            onClick={onGenerate}
            disabled={!prompt.trim() || isGenerating}
            style={{
              flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
              background: !prompt.trim() || isGenerating ? C.gray200 : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: !prompt.trim() || isGenerating ? C.gray400 : '#fff',
              fontWeight: 700, cursor: !prompt.trim() || isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {isGenerating ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Generating your website...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </>
            ) : (
              <>✨ Generate Website</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
