import React from 'react';

const TWITTER_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.733-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const LINKEDIN_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const INSTAGRAM_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
const FACEBOOK_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const SOCIAL_ICONS = {
  twitter:   TWITTER_ICON,
  x:         TWITTER_ICON,
  linkedin:  LINKEDIN_ICON,
  instagram: INSTAGRAM_ICON,
  facebook:  FACEBOOK_ICON,
};

/**
 * SiteFooter — Public-facing footer for a Slate Site.
 *
 * Props:
 *   site – full site record
 */
export default function SiteFooter({ site = {} }) {
  const theme       = site.theme || {};
  const primary     = theme.primaryColor   || '#2563eb';
  const fontFamily  = theme.fontFamily     || 'inherit';
  const borderRadius = theme.borderRadius  || '8px';
  const footerBg    = theme.footerBg       || '#111827';
  const footerText  = theme.footerText     || '#d1d5db';
  const year        = new Date().getFullYear();

  const footerLinks   = Array.isArray(site.footer_links)  ? site.footer_links  : [];
  const socialLinks   = site.social_links || {};
  const socialEntries = Object.entries(socialLinks).filter(([, url]) => url);

  const divider = (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '28px 0' }} />
  );

  return (
    <footer style={{
      backgroundColor: footerBg,
      color:           footerText,
      fontFamily,
      padding:         '60px 24px 32px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Top row: brand + columns */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap:                 '40px',
          marginBottom:        '12px',
        }}>
          {/* Brand column */}
          <div style={{ maxWidth: '280px' }}>
            {site.logo_url
              ? (
                <img
                  src={site.logo_url}
                  alt={site.site_name || 'Logo'}
                  style={{ height: '38px', width: 'auto', marginBottom: '12px', filter: 'brightness(0) invert(1)', opacity: 0.9 }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              )
              : (
                <div style={{ fontWeight: '700', fontSize: '20px', color: '#ffffff', marginBottom: '12px' }}>
                  {site.site_name || ''}
                </div>
              )
            }
            {site.tagline && (
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: footerText, margin: '0 0 16px' }}>
                {site.tagline}
              </p>
            )}

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform}
                    style={{
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      width:           '36px',
                      height:          '36px',
                      borderRadius:    '50%',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color:           '#ffffff',
                      textDecoration:  'none',
                      transition:      'background 0.18s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = primary; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    {SOCIAL_ICONS[platform.toLowerCase()] || platform[0].toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer nav links */}
          {footerLinks.length > 0 && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
                Quick Links
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {footerLinks.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url || '#'}
                      style={{ color: footerText, textDecoration: 'none', fontSize: '14px', transition: 'color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = footerText; }}
                    >
                      {link.label || link.title || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact info */}
          {(site.contact_email || site.contact_phone || site.address) && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
                Contact
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {site.contact_email && (
                  <a
                    href={`mailto:${site.contact_email}`}
                    style={{ color: footerText, textDecoration: 'none', fontSize: '14px', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = footerText; }}
                  >
                    ? {site.contact_email}
                  </a>
                )}
                {site.contact_phone && (
                  <a
                    href={`tel:${site.contact_phone}`}
                    style={{ color: footerText, textDecoration: 'none', fontSize: '14px', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = footerText; }}
                  >
                    ? {site.contact_phone}
                  </a>
                )}
                {site.address && (
                  <span style={{ fontSize: '14px', color: footerText, lineHeight: '1.5' }}>
                    ?? {site.address}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {divider}

        {/* Bottom row */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '12px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: `${footerText}bb` }}>
            © {year} {site.site_name || site.company_name || ''}. All rights reserved.
          </p>

          {/* Powered by Slate badge */}
          <a
            href="https://slatesites.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '5px',
              padding:        '4px 10px',
              borderRadius,
              backgroundColor: 'rgba(255,255,255,0.06)',
              color:           `${footerText}99`,
              textDecoration:  'none',
              fontSize:        '12px',
              fontWeight:      '500',
              transition:      'background 0.15s, color 0.15s',
              border:          '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = footerText;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = `${footerText}99`;
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"/>
              <path d="M6.5 5.5A1.5 1.5 0 018 4a1.5 1.5 0 011.5 1.5v.5H8v-.5a.5.5 0 00-1 0V7H9.5a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5H7V5.5z"/>
            </svg>
            Powered by Slate
          </a>
        </div>
      </div>
    </footer>
  );
}
