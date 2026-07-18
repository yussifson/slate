import React, { useState, useEffect, useRef } from 'react';

/**
 * SiteNav — Public-facing navigation bar for a Slate Site.
 *
 * Props:
 *   site        – full site record (logo_url, site_name, theme, …)
 *   pages       – array of published page records ({ slug, title, page_order, … })
 *   currentSlug – slug of the currently active page
 */
export default function SiteNav({ site = {}, pages = [], currentSlug = '' }) {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [imgError, setImgError]   = useState(false);
  const navRef                    = useRef(null);

  const theme        = site.theme || {};
  const primary      = theme.primaryColor   || '#2563eb';
  const bg           = theme.navBg          || '#ffffff';
  const textColor    = theme.navText        || '#111827';
  const fontFamily   = theme.fontFamily     || 'inherit';
  const borderRadius = theme.borderRadius   || '8px';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const publishedPages = pages
    .filter(p => p.title && p.slug)
    .sort((a, b) => (a.page_order || 0) - (b.page_order || 0));

  const hasContactPage = publishedPages.some(p => p.slug === 'contact');

  const renderLink = (page, mobile = false) => {
    const isActive = page.slug === currentSlug || (currentSlug === '' && page.slug === 'home');
    return (
      <a
        key={page.slug}
        href={page.slug === 'home' ? '/' : `/${page.slug}`}
        onClick={() => setMenuOpen(false)}
        style={{
          display:         mobile ? 'block' : 'inline-block',
          padding:         mobile ? '10px 14px' : '6px 14px',
          borderRadius,
          fontFamily,
          fontSize:        mobile ? '16px' : '15px',
          fontWeight:      isActive ? '600' : '400',
          color:           isActive ? primary : textColor,
          textDecoration:  'none',
          backgroundColor: isActive ? `${primary}18` : 'transparent',
          transition:      'background 0.18s, color 0.18s',
          whiteSpace:      'nowrap',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = `${primary}12`;
            e.currentTarget.style.color = primary;
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = textColor;
          }
        }}
      >
        {page.title}
      </a>
    );
  };

  const ctaButton = hasContactPage && (
    <a
      href="/contact"
      onClick={() => setMenuOpen(false)}
      style={{
        display:         'inline-block',
        padding:         '8px 20px',
        borderRadius,
        fontFamily,
        fontSize:        '15px',
        fontWeight:      '600',
        color:           '#ffffff',
        backgroundColor: primary,
        textDecoration:  'none',
        transition:      'opacity 0.18s',
        flexShrink:      0,
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      Contact Us
    </a>
  );

  const logoContent = (site.logo_url && !imgError)
    ? (
      <img
        src={site.logo_url}
        alt={site.site_name || 'Logo'}
        onError={() => setImgError(true)}
        style={{ height: '36px', width: 'auto', display: 'block' }}
      />
    )
    : (
      <span style={{ fontFamily, fontWeight: '700', fontSize: '20px', color: primary, letterSpacing: '-0.3px' }}>
        {site.site_name || 'Site'}
      </span>
    );

  return (
    <nav
      ref={navRef}
      style={{
        position:        'sticky',
        top:             0,
        zIndex:          1000,
        backgroundColor: bg,
        boxShadow:       scrolled ? '0 2px 16px rgba(0,0,0,0.09)' : '0 1px 0 rgba(0,0,0,0.07)',
        transition:      'box-shadow 0.25s',
      }}
    >
      <div style={{
        maxWidth:       '1200px',
        margin:         '0 auto',
        padding:        '0 24px',
        height:         '64px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '16px',
      }}>
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>{logoContent}</a>

        {/* Desktop links */}
        <div className="__sitenav-desktop" style={{ display: 'none', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
          {publishedPages.map(p => renderLink(p, false))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div className="__sitenav-cta">{ctaButton}</div>

          <button
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(v => !v)}
            className="__sitenav-hamburger"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${primary}15`; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display:         'block',
                width:           '22px',
                height:          '2px',
                borderRadius:    '2px',
                backgroundColor: textColor,
                transition:      'transform 0.25s, opacity 0.25s',
                transform: menuOpen
                  ? i === 0 ? 'translateY(7px) rotate(45deg)'
                  : i === 2 ? 'translateY(-7px) rotate(-45deg)'
                  : 'scaleX(0)'
                  : 'none',
                opacity: (menuOpen && i === 1) ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div style={{
        overflow:        'hidden',
        maxHeight:       menuOpen ? '520px' : '0',
        transition:      'max-height 0.32s cubic-bezier(0.4,0,0.2,1)',
        backgroundColor: bg,
        borderTop:       menuOpen ? `1px solid ${primary}22` : 'none',
      }}>
        <div style={{ padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {publishedPages.map(p => renderLink(p, true))}
          {hasContactPage && <div style={{ marginTop: '8px' }}>{ctaButton}</div>}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .__sitenav-desktop { display: flex !important; }
          .__sitenav-cta     { display: block !important; }
          .__sitenav-hamburger { display: none !important; }
        }
        @media (max-width: 767px) {
          .__sitenav-desktop { display: none !important; }
          .__sitenav-cta     { display: none !important; }
          .__sitenav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
