import React, { useEffect, useRef, Suspense } from 'react';

/**
 * SitePageRenderer — Renders a page's section array using a dynamic section registry.
 *
 * Props:
 *   page      – page record with page.content (array of section blocks)
 *   site      – full site record (theme, etc.)
 *   siteId    – UUID of the site
 *   companyId – UUID of the company
 */

// Lazy section component cache
const componentCache = {};

/**
 * Attempt to import a section component by type.
 * Falls back gracefully if the registry or component doesn't exist.
 */
async function loadSectionComponent(type) {
  if (componentCache[type] !== undefined) return componentCache[type];

  try {
    // Primary: ask the registry
    const registry = await import('../SiteSections/index.jsx');
    if (registry.getSectionComponent) {
      const comp = registry.getSectionComponent(type);
      componentCache[type] = comp || null;
      return componentCache[type];
    }
    if (registry.default && typeof registry.default === 'object') {
      componentCache[type] = registry.default[type] || null;
      return componentCache[type];
    }
  } catch (_) {
    // Registry not yet available — try direct import as fallback
    try {
      const mod = await import(`../SiteSections/${type}.jsx`);
      componentCache[type] = mod.default || null;
      return componentCache[type];
    } catch (__) {
      componentCache[type] = null;
    }
  }
  return null;
}

/** Individual section renderer with lazy loading */
function SectionBlock({ block, site, siteId, companyId }) {
  const [Comp, setComp] = React.useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let cancelled = false;
    loadSectionComponent(block.type).then(c => {
      if (!cancelled) setComp(() => c);
    });
    return () => { cancelled = true; };
  }, [block.type]);

  if (Comp === undefined) {
    // Skeleton while loading section component
    return (
      <div style={{
        minHeight:       '120px',
        backgroundColor: '#f3f4f6',
        borderRadius:    '8px',
        margin:          '8px 0',
        animation:       'sectionShimmer 1.4s infinite linear',
        backgroundImage: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
        backgroundSize:  '400% 100%',
      }} />
    );
  }

  if (!Comp) return null; // Unknown section type — skip gracefully

  return (
    <div style={{ position: 'relative' }}>
      <Comp
        block={block}
        settings={block.settings || {}}
        content={block.content || {}}
        site={site}
        siteId={siteId}
        companyId={companyId}
        isEditing={false}
      />
    </div>
  );
}

export default function SitePageRenderer({ page, site, siteId, companyId }) {
  const theme      = site?.theme || {};
  const primary    = theme.primaryColor    || '#2563eb';
  const secondary  = theme.secondaryColor  || '#7c3aed';
  const fontFamily = theme.fontFamily      || 'system-ui, sans-serif';
  const bg         = theme.backgroundColor || '#ffffff';
  const textColor  = theme.textColor       || '#111827';
  const radius     = theme.borderRadius    || '8px';

  const sections = Array.isArray(page?.content) ? page.content : [];

  if (sections.length === 0) {
    return (
      <div style={{
        minHeight:   '60vh',
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'center',
        fontFamily,
        color:       textColor,
      }}>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px', color: textColor }}>
            Page Coming Soon
          </h2>
          <p style={{ color: `${textColor}88`, margin: 0 }}>
            This page is under construction. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        '--site-primary':    primary,
        '--site-secondary':  secondary,
        '--site-font':       fontFamily,
        '--site-bg':         bg,
        '--site-text':       textColor,
        '--site-radius':     radius,
        backgroundColor:     bg,
        color:               textColor,
        fontFamily,
        minHeight:           '60vh',
      }}
    >
      <style>{`
        @keyframes sectionShimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>

      {sections.map((block, idx) => (
        <SectionBlock
          key={block.id || `section-${idx}`}
          block={block}
          site={site}
          siteId={siteId}
          companyId={companyId}
        />
      ))}
    </main>
  );
}
