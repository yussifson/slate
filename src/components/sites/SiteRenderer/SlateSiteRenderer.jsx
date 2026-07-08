import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';
import SitePageRenderer from './SitePageRenderer';

/* ─── helpers ──────────────────────────────────────────────────────────── */

function getSlugFromPath(pathname) {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts.length === 0) return 'home';
  return parts[0];
}

function generateSessionId() {
  const key = '__slate_sid';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

function injectGoogleFont(fontFamily) {
  if (!fontFamily || fontFamily === 'inherit' || fontFamily === 'system-ui') return;
  const fontName = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  const id = `gfont-${fontName.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id   = id;
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function applyTheme(theme = {}) {
  const root = document.documentElement;
  root.style.setProperty('--site-primary',    theme.primaryColor    || '#2563eb');
  root.style.setProperty('--site-secondary',  theme.secondaryColor  || '#7c3aed');
  root.style.setProperty('--site-font',       theme.fontFamily      || 'system-ui, sans-serif');
  root.style.setProperty('--site-bg',         theme.backgroundColor || '#ffffff');
  root.style.setProperty('--site-text',       theme.textColor       || '#111827');
  root.style.setProperty('--site-radius',     theme.borderRadius    || '8px');
}

/* ─── Shimmer skeleton ──────────────────────────────────────────────────── */

function SkeletonPulse({ width = '100%', height = '20px', borderRadius = '6px', style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      backgroundColor:  '#e5e7eb',
      backgroundImage:  'linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%)',
      backgroundSize:   '400% 100%',
      animation:        'siteSkeletonShimmer 1.5s infinite linear',
      ...style,
    }} />
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <style>{`
        @keyframes siteSkeletonShimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>

      {/* Nav skeleton */}
      <div style={{
        height:          '64px',
        backgroundColor: '#ffffff',
        borderBottom:    '1px solid #f3f4f6',
        display:         'flex',
        alignItems:      'center',
        padding:         '0 24px',
        gap:             '24px',
        boxShadow:       '0 1px 0 rgba(0,0,0,0.06)',
      }}>
        <SkeletonPulse width="120px" height="32px" borderRadius="6px" />
        <div style={{ flex: 1 }} />
        <SkeletonPulse width="60px" height="16px" />
        <SkeletonPulse width="60px" height="16px" />
        <SkeletonPulse width="60px" height="16px" />
        <SkeletonPulse width="90px" height="36px" borderRadius="8px" />
      </div>

      {/* Hero skeleton */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 0 60px' }}>
          <SkeletonPulse width="55%" height="52px" borderRadius="8px" style={{ marginBottom: '20px' }} />
          <SkeletonPulse width="75%" height="24px" borderRadius="6px" style={{ marginBottom: '12px' }} />
          <SkeletonPulse width="60%" height="24px" borderRadius="6px" style={{ marginBottom: '36px' }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <SkeletonPulse width="140px" height="48px" borderRadius="8px" />
            <SkeletonPulse width="120px" height="48px" borderRadius="8px" />
          </div>
        </div>
      </div>

      {/* Card grid skeleton */}
      <div style={{ backgroundColor: '#f9fafb', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SkeletonPulse width="180px" height="32px" borderRadius="6px" style={{ margin: '0 auto 12px', display: 'block' }} />
          <SkeletonPulse width="280px" height="18px" borderRadius="4px" style={{ margin: '0 auto 40px', display: 'block' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <SkeletonPulse width="100%" height="180px" borderRadius="0" />
                <div style={{ padding: '20px' }}>
                  <SkeletonPulse width="70%" height="18px" borderRadius="4px" style={{ marginBottom: '10px' }} />
                  <SkeletonPulse width="90%" height="14px" borderRadius="4px" style={{ marginBottom: '8px' }} />
                  <SkeletonPulse width="60%" height="14px" borderRadius="4px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div style={{ backgroundColor: '#111827', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            {[0, 1, 2].map(i => (
              <div key={i}>
                <SkeletonPulse width="100px" height="20px" borderRadius="4px" style={{ marginBottom: '16px', backgroundColor: '#374151', backgroundImage: 'linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%)', backgroundSize: '400% 100%' }} />
                {[0, 1, 2].map(j => (
                  <SkeletonPulse key={j} width="80%" height="14px" borderRadius="3px" style={{ marginBottom: '10px', backgroundColor: '#374151', backgroundImage: 'linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%)', backgroundSize: '400% 100%' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 404 page ──────────────────────────────────────────────────────────── */

function Page404({ site }) {
  const theme      = site?.theme || {};
  const primary    = theme.primaryColor   || '#2563eb';
  const fontFamily = theme.fontFamily     || 'system-ui, sans-serif';
  const bg         = theme.backgroundColor || '#ffffff';
  const textColor  = theme.textColor       || '#111827';

  return (
    <div style={{
      minHeight:      '80vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily,
      backgroundColor: bg,
      color:           textColor,
      padding:         '48px 24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{
          fontSize:        '96px',
          fontWeight:      '900',
          color:           primary,
          lineHeight:      1,
          marginBottom:    '16px',
          opacity:         0.15,
          letterSpacing:   '-4px',
        }}>
          404
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 12px', color: textColor }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: '16px', color: `${textColor}99`, margin: '0 0 32px', lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          style={{
            display:         'inline-block',
            padding:         '12px 28px',
            borderRadius:    theme.borderRadius || '8px',
            backgroundColor: primary,
            color:           '#ffffff',
            textDecoration:  'none',
            fontWeight:      '600',
            fontSize:        '15px',
            transition:      'opacity 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          ← Go Home
        </a>
      </div>
    </div>
  );
}

/* ─── Coming Soon / Not Found site page ────────────────────────────────── */

function ComingSoon({ companyId }) {
  const label = companyId
    ? companyId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'This Business';

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      background:      'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)',
      fontFamily:      'system-ui, -apple-system, sans-serif',
      padding:         '48px 24px',
      textAlign:       'center',
    }}>
      <div style={{ maxWidth: '560px' }}>
        {/* Decorative ring */}
        <div style={{
          width:        '96px',
          height:       '96px',
          borderRadius: '50%',
          border:       '3px solid rgba(255,255,255,0.25)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          margin:       '0 auto 32px',
          fontSize:     '40px',
        }}>
          🚀
        </div>

        <h1 style={{
          fontSize:     'clamp(28px, 5vw, 42px)',
          fontWeight:   '800',
          color:        '#ffffff',
          margin:       '0 0 16px',
          lineHeight:   1.2,
        }}>
          {label}
        </h1>

        <p style={{
          fontSize:     '18px',
          color:        'rgba(255,255,255,0.75)',
          margin:       '0 0 40px',
          lineHeight:   1.6,
        }}>
          Our website is coming soon.<br />
          We're working hard to bring something great.
        </p>

        <div style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            '12px',
          padding:        '12px 24px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius:   '12px',
          border:         '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: '20px' }}>✨</span>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: '500' }}>
            Stay tuned — something exciting is on its way
          </span>
        </div>

        <div style={{ marginTop: '60px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
          Powered by{' '}
          <a href="https://slatesites.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: '500' }}>
            Slate Sites
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Renderer ─────────────────────────────────────────────────────── */

/**
 * SlateSiteRenderer — Root public renderer.
 *
 * Props:
 *   companyId – UUID of the company whose site to render
 */
export default function SlateSiteRenderer({ companyId }) {
  const [site, setSite]         = useState(null);
  const [pages, setPages]       = useState([]);
  const [currentSlug, setCurrentSlug] = useState(() => getSlugFromPath(window.location.pathname));
  const [loading, setLoading]   = useState(true);
  const [siteError, setSiteError] = useState(false); // true if site not found/not published

  const trackedRef = useRef(new Set());

  /* Load site + pages */
  useEffect(() => {
    if (!companyId) {
      setSiteError(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        // 1. Fetch the published site record
        const { data: siteData, error: siteErr } = await supabase
          .from('slate_sites')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_published', true)
          .maybeSingle();

        if (siteErr) throw siteErr;
        if (!siteData) {
          if (!cancelled) { setSiteError(true); setLoading(false); }
          return;
        }

        // 2. Fetch all published pages
        const { data: pagesData, error: pagesErr } = await supabase
          .from('slate_site_pages')
          .select('*')
          .eq('site_id', siteData.id)
          .eq('is_published', true)
          .order('page_order');

        if (pagesErr) throw pagesErr;

        if (!cancelled) {
          setSite(siteData);
          setPages(pagesData || []);
          setSiteError(false);
          setLoading(false);

          // Apply theme
          applyTheme(siteData.theme || {});
          injectGoogleFont((siteData.theme || {}).fontFamily);
        }
      } catch (err) {
        console.error('[SlateSiteRenderer] load error:', err);
        if (!cancelled) { setSiteError(true); setLoading(false); }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [companyId]);

  /* Track page visit */
  const trackVisit = useCallback(async (siteId, slug) => {
    const trackKey = `${siteId}:${slug}`;
    if (trackedRef.current.has(trackKey)) return;
    trackedRef.current.add(trackKey);
    try {
      await supabase.from('slate_site_analytics').insert({
        site_id:    siteId,
        company_id: companyId,
        page_slug:  slug,
        referrer:   document.referrer || null,
        session_id: generateSessionId(),
        visited_at: new Date().toISOString(),
      });
    } catch (err) {
      // Analytics failure must never break the page
      console.warn('[SlateSiteRenderer] analytics insert failed:', err?.message);
    }
  }, [companyId]);

  /* Track on initial load + track when site is ready */
  useEffect(() => {
    if (site?.id) trackVisit(site.id, currentSlug);
  }, [site?.id, currentSlug, trackVisit]);

  /* Handle SPA navigation via popstate (back/forward) */
  useEffect(() => {
    const onPopState = () => {
      const newSlug = getSlugFromPath(window.location.pathname);
      setCurrentSlug(newSlug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /* Intercept <a> clicks for internal SPA navigation */
  useEffect(() => {
    const onClick = (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('#')) return;
      e.preventDefault();
      const newSlug = getSlugFromPath(href);
      window.history.pushState({}, '', href);
      setCurrentSlug(newSlug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  /* ── Render states ── */

  if (loading) return <LoadingSkeleton />;

  if (siteError) return <ComingSoon companyId={companyId} />;

  const theme      = site?.theme || {};
  const primary    = theme.primaryColor    || '#2563eb';
  const secondary  = theme.secondaryColor  || '#7c3aed';
  const fontFamily = theme.fontFamily      || 'system-ui, sans-serif';
  const bg         = theme.backgroundColor || '#ffffff';
  const textColor  = theme.textColor       || '#111827';

  // Find current page
  const currentPage = pages.find(p =>
    p.slug === currentSlug ||
    (currentSlug === 'home' && (p.slug === 'home' || p.is_home_page))
  ) || (currentSlug === 'home' ? pages[0] : null);

  const pageNotFound = !currentPage;

  return (
    <>
      <Helmet>
        <title>
          {currentPage
            ? `${currentPage.title}${site.site_name ? ` | ${site.site_name}` : ''}`
            : site.site_name || 'Website'}
        </title>
        {site.meta_description && <meta name="description" content={site.meta_description} />}
        {currentPage?.meta_description && <meta name="description" content={currentPage.meta_description} />}
        {currentPage?.meta_title && <title>{currentPage.meta_title}</title>}
        {site.favicon_url && <link rel="icon" href={site.favicon_url} />}
        <meta name="theme-color" content={primary} />
        {/* Open Graph */}
        <meta property="og:title" content={currentPage?.title || site.site_name || ''} />
        {site.meta_description && <meta property="og:description" content={site.meta_description} />}
        {site.logo_url && <meta property="og:image" content={site.logo_url} />}
        <meta property="og:type" content="website" />
      </Helmet>

      <div
        style={{
          minHeight:       '100vh',
          display:         'flex',
          flexDirection:   'column',
          backgroundColor: bg,
          color:           textColor,
          fontFamily,
          '--site-primary':   primary,
          '--site-secondary': secondary,
          '--site-font':      fontFamily,
          '--site-bg':        bg,
          '--site-text':      textColor,
          '--site-radius':    theme.borderRadius || '8px',
        }}
      >
        <SiteNav
          site={site}
          pages={pages}
          currentSlug={currentSlug}
        />

        <div style={{ flex: 1 }}>
          {pageNotFound
            ? <Page404 site={site} />
            : (
              <SitePageRenderer
                page={currentPage}
                site={site}
                siteId={site.id}
                companyId={companyId}
              />
            )
          }
        </div>

        <SiteFooter site={site} />
      </div>
    </>
  );
}
