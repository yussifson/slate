import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { SlateSitesAPI } from '@/api/SlateSitesAPI';
import { generatePageFromPrompt, generateSectionCopy, suggestSections } from '@/api/SlateSitesAI';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// ── Dynamic section imports ──────────────────────────────────────────────────
// We use dynamic/lazy imports so the builder doesn't fail if a section doesn't exist yet
const SECTION_COMPONENTS = {};
const sectionImports = {
  hero: () => import('@/components/sites/SiteSections/HeroSection'),
  features: () => import('@/components/sites/SiteSections/FeaturesSection'),
  testimonials: () => import('@/components/sites/SiteSections/TestimonialsSection'),
  faq: () => import('@/components/sites/SiteSections/FAQSection'),
  stats: () => import('@/components/sites/SiteSections/StatsSection'),
  cta: () => import('@/components/sites/SiteSections/CTASection'),
  contact: () => import('@/components/sites/SiteSections/ContactSection'),
  team: () => import('@/components/sites/SiteSections/TeamSection'),
  pricing: () => import('@/components/sites/SiteSections/PricingSection'),
  gallery: () => import('@/components/sites/SiteSections/GallerySection'),
  logos: () => import('@/components/sites/SiteSections/LogosSection'),
  timeline: () => import('@/components/sites/SiteSections/TimelineSection'),
  video: () => import('@/components/sites/SiteSections/VideoSection'),
  form: () => import('@/components/sites/SiteSections/FormSection'),
  booking: () => import('@/components/sites/SiteSections/BookingSection'),
  products: () => import('@/components/sites/SiteSections/ProductsSection'),
  menu: () => import('@/components/sites/SiteSections/MenuSection'),
  jobs: () => import('@/components/sites/SiteSections/JobsSection'),
  blog: () => import('@/components/sites/SiteSections/BlogSection'),
  map: () => import('@/components/sites/SiteSections/MapSection'),
  chat: () => import('@/components/sites/SiteSections/ChatSection'),
};

// ── Section metadata for the "Add Section" panel ─────────────────────────────
const SECTION_META = [
  { type: 'hero', label: 'Hero Banner', emoji: '🌟', category: 'Layout', desc: 'Big headline with CTA buttons' },
  { type: 'features', label: 'Features', emoji: '⚡', category: 'Layout', desc: 'Grid of key features/services' },
  { type: 'testimonials', label: 'Testimonials', emoji: '💬', category: 'Social Proof', desc: 'Client reviews and ratings' },
  { type: 'stats', label: 'Stats/Numbers', emoji: '📊', category: 'Social Proof', desc: 'Key metrics and achievements' },
  { type: 'logos', label: 'Client Logos', emoji: '🏆', category: 'Social Proof', desc: 'Partner and client logos' },
  { type: 'team', label: 'Team', emoji: '👥', category: 'About', desc: 'Team member profiles' },
  { type: 'timeline', label: 'Timeline', emoji: '📅', category: 'About', desc: 'Company history or process' },
  { type: 'cta', label: 'Call to Action', emoji: '🎯', category: 'Conversion', desc: 'Bold CTA section' },
  { type: 'pricing', label: 'Pricing', emoji: '💎', category: 'Conversion', desc: 'Pricing plans comparison' },
  { type: 'faq', label: 'FAQ', emoji: '❓', category: 'Support', desc: 'Accordion Q&A section' },
  { type: 'form', label: 'Contact Form', emoji: '📋', category: 'Conversion', desc: 'Lead capture form' },
  { type: 'booking', label: 'Booking', emoji: '📆', category: 'Conversion', desc: 'Appointment booking' },
  { type: 'products', label: 'Products', emoji: '📦', category: 'Commerce', desc: 'Product catalog grid' },
  { type: 'menu', label: 'Menu', emoji: '🍽️', category: 'Commerce', desc: 'Restaurant/cafe menu' },
  { type: 'jobs', label: 'Job Listings', emoji: '💼', category: 'HR', desc: 'Open positions' },
  { type: 'gallery', label: 'Gallery', emoji: '🖼️', category: 'Media', desc: 'Photo gallery' },
  { type: 'video', label: 'Video', emoji: '🎬', category: 'Media', desc: 'Video embed' },
  { type: 'blog', label: 'Blog Posts', emoji: '📝', category: 'Content', desc: 'Blog article previews' },
  { type: 'contact', label: 'Contact Info', emoji: '📍', category: 'Contact', desc: 'Address, email, phone' },
  { type: 'map', label: 'Map', emoji: '🗺️', category: 'Contact', desc: 'Location map embed' },
  { type: 'chat', label: 'Live Chat', emoji: '💭', category: 'Support', desc: 'Chat widget CTA' },
];

const DEFAULT_THEME = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  fontFamily: 'Inter',
  headingFont: 'Inter',
  borderRadius: '12px',
  darkMode: false,
};

const DEFAULT_DATA = {
  hero: { headline: 'Welcome to Our Business', subheadline: 'We provide exceptional services tailored to your needs.', ctaText: 'Get Started', ctaLink: '/contact', backgroundType: 'gradient' },
  features: { headline: 'Why Choose Us', subheadline: 'What sets us apart', features: [{ icon: '⭐', title: 'Feature 1', description: 'Description of this feature.' }, { icon: '🚀', title: 'Feature 2', description: 'Description of this feature.' }, { icon: '🎯', title: 'Feature 3', description: 'Description of this feature.' }] },
  testimonials: { headline: 'What Our Clients Say', testimonials: [{ name: 'Jane Smith', role: 'Client', company: '', text: 'Excellent service!', rating: 5 }] },
  faq: { headline: 'Frequently Asked Questions', faqs: [{ question: 'How do I get started?', answer: 'Contact us to schedule a free consultation.' }] },
  stats: { headline: 'Our Numbers', stats: [{ value: '100+', label: 'Clients Served', icon: '👥' }, { value: '5★', label: 'Average Rating', icon: '⭐' }] },
  cta: { headline: 'Ready to Get Started?', subheadline: 'Contact us today for a free consultation.', ctaText: 'Contact Us', ctaLink: '/contact', backgroundType: 'primary' },
  contact: { headline: 'Get In Touch', email: 'hello@example.com', phone: '+1 (555) 000-0000', address: '123 Business Street, City, State' },
  team: { headline: 'Meet Our Team', members: [{ name: 'John Doe', role: 'CEO', bio: 'Experienced leader.' }] },
  pricing: { headline: 'Simple Pricing', plans: [{ name: 'Starter', price: '$99', period: 'month', features: ['Feature 1', 'Feature 2'], ctaText: 'Start Free', featured: false }, { name: 'Pro', price: '$299', period: 'month', features: ['Everything in Starter', 'Feature 3', 'Feature 4'], ctaText: 'Start Pro', featured: true }] },
  gallery: { headline: 'Gallery', images: [] },
  logos: { headline: 'Trusted By', logos: [{ name: 'Company A' }, { name: 'Company B' }, { name: 'Company C' }] },
  timeline: { headline: 'Our Story', items: [{ year: '2020', title: 'Founded', description: 'Our journey began.' }] },
  video: { headline: 'See Us in Action', videoUrl: '', description: 'Watch our story unfold.' },
  form: { headline: 'Get in Touch', formId: 'contact', fields: [{ label: 'Name', type: 'text', required: true }, { label: 'Email', type: 'email', required: true }, { label: 'Message', type: 'textarea', required: true }], submitText: 'Send Message', successMessage: 'Thank you! We will be in touch soon.' },
  booking: { headline: 'Book an Appointment', subheadline: 'Choose a convenient time to meet.', ctaText: 'Schedule Now' },
  products: { headline: 'Our Products', products: [{ name: 'Product 1', price: '$99', description: 'Description.' }] },
  menu: { headline: 'Our Menu', categories: [{ name: 'Mains', items: [{ name: 'Dish 1', description: 'Delicious.', price: '$15' }] }] },
  jobs: { headline: 'Join Our Team', jobs: [{ title: 'Position 1', department: 'Operations', type: 'Full-time', location: 'Remote' }] },
  blog: { headline: 'Latest News', posts: [{ title: 'Post Title', date: 'Today', excerpt: 'Post excerpt.' }] },
  map: { headline: 'Find Us', address: '123 Business St, City' },
  chat: { headline: 'Chat With Us', subheadline: 'We respond within minutes.', buttonText: 'Start Chat' },
};

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  primary: '#6366f1',
  dark: '#09090b',
  bg: '#f5f5f7',
  white: '#ffffff',
  border: '#e4e4e7',
  text: '#111827',
  muted: '#6b7280',
  panel: '#ffffff',
  panelBorder: '#e5e7eb',
  sidebar: '#1c1c1e',
  sidebarText: '#d1d5db',
  sidebarActive: '#6366f1',
};

// ── Section card in builder ───────────────────────────────────────────────────
function SectionBlock({ section, theme, isSelected, onClick, onMoveUp, onMoveDown, onDelete, onDuplicate, isFirst, isLast }) {
  const [hovered, setHovered] = useState(false);
  const [SectionComp, setSectionComp] = useState(null);

  useEffect(() => {
    const loader = sectionImports[section.type];
    if (loader) {
      loader().then(mod => setSectionComp(() => mod.default)).catch(() => {});
    }
  }, [section.type]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        border: isSelected ? `2px solid ${C.primary}` : hovered ? `2px solid #c7d2fe` : '2px solid transparent',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
        background: C.white,
      }}
    >
      {/* Section label badge */}
      {(hovered || isSelected) && (
        <div style={{
          position: 'absolute', top: '8px', left: '8px', zIndex: 10,
          background: isSelected ? C.primary : 'rgba(0,0,0,0.7)',
          color: '#fff', borderRadius: '6px', padding: '3px 8px',
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          {SECTION_META.find(s => s.type === section.type)?.emoji} {section.type}
        </div>
      )}

      {/* Controls */}
      {(hovered || isSelected) && (
        <div style={{
          position: 'absolute', top: '8px', right: '8px', zIndex: 10,
          display: 'flex', gap: '4px',
        }}>
          {!isFirst && (
            <ControlBtn onClick={(e) => { e.stopPropagation(); onMoveUp(); }} title="Move Up">↑</ControlBtn>
          )}
          {!isLast && (
            <ControlBtn onClick={(e) => { e.stopPropagation(); onMoveDown(); }} title="Move Down">↓</ControlBtn>
          )}
          <ControlBtn onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicate">⧉</ControlBtn>
          <ControlBtn onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete" danger>✕</ControlBtn>
        </div>
      )}

      {/* Render section preview */}
      <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {SectionComp ? (
          <SectionComp data={section.data} theme={theme} isEditing={false} />
        ) : (
          <div style={{
            height: '120px', background: `linear-gradient(135deg, #f3f4f6, #e5e7eb)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '28px' }}>{SECTION_META.find(s => s.type === section.type)?.emoji || '📦'}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'capitalize' }}>{section.type} Section</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlBtn({ onClick, children, title, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '28px', height: '28px', borderRadius: '6px', border: 'none',
        background: danger ? (hov ? '#ef4444' : 'rgba(239,68,68,0.85)') : (hov ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.9)'),
        color: danger ? '#fff' : '#374151',
        cursor: 'pointer', fontSize: '13px', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)', transition: 'all 0.1s',
      }}
    >{children}</button>
  );
}

// ── Properties Panel ──────────────────────────────────────────────────────────
function PropertiesPanel({ section, onUpdate, onAIRewrite, theme, onThemeChange }) {
  const [isAILoading, setIsAILoading] = useState(false);
  if (!section) {
    return (
      <div style={{ padding: '24px', color: C.muted, textAlign: 'center', fontSize: '13px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>👆</div>
        Click a section in the canvas to edit its properties
      </div>
    );
  }

  const data = section.data || {};

  const handleFieldChange = (field, value) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleAIRewrite = async () => {
    setIsAILoading(true);
    try {
      const newData = await generateSectionCopy(section.type, {
        siteName: 'Business', industry: 'general', existingContent: data,
      });
      onUpdate({ ...data, ...newData });
      toast.success('AI rewrote the copy!');
    } catch (e) {
      toast.error('AI rewrite failed');
    } finally {
      setIsAILoading(false);
    }
  };

  const FieldInput = ({ label, field, type = 'text', placeholder = '' }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={data[field] || ''}
          onChange={e => handleFieldChange(field, e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
        />
      ) : (
        <input
          type={type}
          value={data[field] || ''}
          onChange={e => handleFieldChange(field, e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
        />
      )}
    </div>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
      {/* Section type badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{SECTION_META.find(s => s.type === section.type)?.emoji}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827', textTransform: 'capitalize' }}>{section.type}</div>
            <div style={{ fontSize: '11px', color: C.muted }}>Section Properties</div>
          </div>
        </div>
        <button
          onClick={handleAIRewrite}
          disabled={isAILoading}
          style={{
            padding: '6px 10px', borderRadius: '8px', border: 'none',
            background: isAILoading ? '#e5e7eb' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: isAILoading ? '#9ca3af' : '#fff',
            fontSize: '11px', fontWeight: 700, cursor: isAILoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          {isAILoading ? '...' : '✨ AI Rewrite'}
        </button>
      </div>

      {/* Common fields */}
      {data.headline !== undefined && <FieldInput label="Headline" field="headline" />}
      {data.subheadline !== undefined && <FieldInput label="Subheadline" field="subheadline" type="textarea" />}
      {data.ctaText !== undefined && <FieldInput label="Button Text" field="ctaText" />}
      {data.ctaLink !== undefined && <FieldInput label="Button Link" field="ctaLink" placeholder="/contact" />}
      {data.description !== undefined && <FieldInput label="Description" field="description" type="textarea" />}
      {data.email !== undefined && <FieldInput label="Email" field="email" type="email" />}
      {data.phone !== undefined && <FieldInput label="Phone" field="phone" />}
      {data.address !== undefined && <FieldInput label="Address" field="address" />}

      {/* Background type */}
      {data.backgroundType !== undefined && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Background</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['gradient', 'solid', 'image', 'primary'].map(bt => (
              <button
                key={bt}
                onClick={() => handleFieldChange('backgroundType', bt)}
                style={{
                  padding: '5px 10px', borderRadius: '6px', border: 'none',
                  background: data.backgroundType === bt ? C.primary : '#f3f4f6',
                  color: data.backgroundType === bt ? '#fff' : '#374151',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                }}
              >{bt}</button>
            ))}
          </div>
        </div>
      )}

      {/* Theme overrides */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global Theme</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Primary', field: 'primaryColor' },
            { label: 'Secondary', field: 'secondaryColor' },
          ].map(f => (
            <div key={f.field}>
              <label style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '4px' }}>{f.label}</label>
              <input
                type="color"
                value={theme[f.field] || '#6366f1'}
                onChange={e => onThemeChange({ ...theme, [f.field]: e.target.value })}
                style={{ width: '100%', height: '36px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '4px' }}>Font Family</label>
          <select
            value={theme.fontFamily || 'Inter'}
            onChange={e => onThemeChange({ ...theme, fontFamily: e.target.value, headingFont: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', cursor: 'pointer' }}
          >
            {['Inter', 'Outfit', 'Lora', 'Playfair Display', 'Cormorant Garamond', 'Merriweather', 'Roboto', 'Poppins', 'Nunito'].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN BUILDER PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function SiteBuilderPage() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialPageId = searchParams.get('page');

  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [activePanelTab, setActivePanelTab] = useState('sections'); // 'sections' | 'pages'
  const [showAddSection, setShowAddSection] = useState(false);
  const [addSectionCategory, setAddSectionCategory] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const { data: site } = useQuery({
    queryKey: ['slate_site', companyId],
    queryFn: () => SlateSitesAPI.getSite(companyId),
    enabled: !!companyId,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['slate_site_pages', site?.id],
    queryFn: () => SlateSitesAPI.getPages(site.id),
    enabled: !!site?.id,
  });

  // Active page & sections
  const [activePageId, setActivePageId] = useState(initialPageId || null);
  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const [sections, setSections] = useState([]);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // Sync sections when active page changes
  useEffect(() => {
    if (activePage?.content) {
      setSections(Array.isArray(activePage.content) ? activePage.content : []);
    } else {
      setSections([]);
    }
  }, [activePage?.id]);

  // Sync theme from site
  useEffect(() => {
    if (site?.theme) {
      setTheme({ ...DEFAULT_THEME, ...site.theme });
    }
  }, [site?.id]);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // ── Save ───────────────────────────────────────────────────────────────────
  const autoSaveTimer = useRef(null);

  const saveSections = useCallback(async (newSections) => {
    if (!activePage?.id) return;
    setIsSaving(true);
    try {
      await SlateSitesAPI.saveSections(activePage.id, newSections);
      setLastSaved(new Date());
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  }, [activePage?.id]);

  const saveTheme = useCallback(async (newTheme) => {
    if (!site?.id) return;
    try {
      await SlateSitesAPI.updateSite(site.id, { theme: newTheme });
    } catch (e) {
      console.error('Theme save failed', e);
    }
  }, [site?.id]);

  // Auto-save on sections change
  const updateSections = useCallback((newSections) => {
    setSections(newSections);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveSections(newSections), 1500);
  }, [saveSections]);

  // Theme change with auto-save
  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveTheme(newTheme), 1500);
  }, [saveTheme]);

  // ── Section operations ─────────────────────────────────────────────────────
  const addSection = (type) => {
    const newSection = {
      id: `section-${type}-${Date.now()}`,
      type,
      data: { ...(DEFAULT_DATA[type] || {}) },
    };
    const newSections = [...sections, newSection];
    updateSections(newSections);
    setSelectedSectionId(newSection.id);
    setShowAddSection(false);
    toast.success(`${SECTION_META.find(s => s.type === type)?.label || type} section added!`);
  };

  const deleteSection = (id) => {
    const newSections = sections.filter(s => s.id !== id);
    updateSections(newSections);
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const duplicateSection = (id) => {
    const idx = sections.findIndex(s => s.id === id);
    const original = sections[idx];
    const dupe = { ...original, id: `section-${original.type}-${Date.now()}`, data: { ...original.data } };
    const newSections = [...sections.slice(0, idx + 1), dupe, ...sections.slice(idx + 1)];
    updateSections(newSections);
  };

  const moveSection = (id, direction) => {
    const idx = sections.findIndex(s => s.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sections.length - 1)) return;
    const newSections = [...sections];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
    updateSections(newSections);
  };

  const updateSectionData = (id, newData) => {
    const newSections = sections.map(s => s.id === id ? { ...s, data: newData } : s);
    updateSections(newSections);
  };

  // ── Add Page ───────────────────────────────────────────────────────────────
  const addPage = async () => {
    if (!site?.id) return;
    try {
      const page = await SlateSitesAPI.createPage({
        siteId: site.id,
        companyId,
        createdBy: user?.email,
        title: 'New Page',
        slug: `/page-${Date.now()}`,
        pageType: 'custom',
        content: [],
      });
      queryClient.invalidateQueries(['slate_site_pages', site.id]);
      setActivePageId(page.id);
      toast.success('New page created!');
    } catch (e) {
      toast.error('Failed to create page');
    }
  };

  // ── Publish ────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!site?.id) return;
    await saveSections(sections);
    await SlateSitesAPI.publishSite(site.id, !site.is_published);
    queryClient.invalidateQueries(['slate_site', companyId]);
    toast.success(site.is_published ? 'Site unpublished' : '🚀 Site is now live!');
  };

  const categories = ['All', ...new Set(SECTION_META.map(s => s.category))];
  const filteredSections = addSectionCategory === 'All' ? SECTION_META : SECTION_META.filter(s => s.category === addSectionCategory);

  if (!site) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🌐</div>
        <p style={{ fontSize: '16px', color: C.muted }}>No site found. Go back to create one.</p>
        <button onClick={() => navigate('/sites')} style={{ padding: '10px 20px', borderRadius: '10px', background: C.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          Go to Slate Sites
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      {/* ── TOP TOOLBAR ──────────────────────────────────────────────────── */}
      <div style={{
        height: '52px', background: C.sidebar, display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.4)', zIndex: 100,
        flexShrink: 0,
      }}>
        {/* Back */}
        <button onClick={() => navigate('/sites')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Back
        </button>

        {/* Site name */}
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', flex: 1 }}>
          {site?.site_name || 'Slate Sites Builder'}
          {activePage && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: '8px' }}>/ {activePage.title}</span>}
        </div>

        {/* Save status */}
        <div style={{ fontSize: '12px', color: lastSaved ? '#86efac' : '#9ca3af' }}>
          {isSaving ? '⏳ Saving...' : lastSaved ? `✓ Saved` : 'Auto-save'}
        </div>

        {/* Preview toggle */}
        <button
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            background: isPreviewMode ? '#fff' : 'rgba(255,255,255,0.1)',
            color: isPreviewMode ? C.primary : '#fff',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          }}
        >
          {isPreviewMode ? '✏️ Edit' : '👁 Preview'}
        </button>

        {/* Publish */}
        <button
          onClick={handlePublish}
          style={{
            padding: '7px 18px', borderRadius: '8px', border: 'none',
            background: site?.is_published ? '#ef4444' : C.primary,
            color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}
        >
          {site?.is_published ? 'Unpublish' : '🚀 Publish'}
        </button>
      </div>

      {/* ── MAIN LAYOUT ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT PANEL — Sections & Pages */}
        {!isPreviewMode && (
          <div style={{
            width: '240px', background: C.panel, borderRight: `1px solid ${C.panelBorder}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
          }}>
            {/* Panel tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.panelBorder}` }}>
              {[{ id: 'sections', label: '⚡ Sections' }, { id: 'pages', label: '📄 Pages' }].map(t => (
                <button key={t.id} onClick={() => setActivePanelTab(t.id)} style={{
                  flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                  background: activePanelTab === t.id ? C.primaryLight : 'transparent',
                  color: activePanelTab === t.id ? C.primary : C.muted,
                  borderBottom: activePanelTab === t.id ? `2px solid ${C.primary}` : '2px solid transparent',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* SECTIONS panel */}
            {activePanelTab === 'sections' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                <button
                  onClick={() => setShowAddSection(true)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    border: `2px dashed ${C.primary}`, background: C.primaryLight,
                    color: C.primary, fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginBottom: '12px',
                  }}
                >
                  + Add Section
                </button>
                {sections.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: '13px' }}>
                    No sections yet.<br />Add your first section above.
                  </div>
                ) : (
                  sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
                        background: selectedSectionId === sec.id ? C.primaryLight : 'transparent',
                        border: `1px solid ${selectedSectionId === sec.id ? C.primary : 'transparent'}`,
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.1s',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{SECTION_META.find(s => s.type === sec.type)?.emoji || '📦'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: C.text, textTransform: 'capitalize', flex: 1 }}>{sec.type}</span>
                      <span style={{ fontSize: '11px', color: C.muted }}>#{idx + 1}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PAGES panel */}
            {activePanelTab === 'pages' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                <button
                  onClick={addPage}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    border: `2px dashed ${C.primary}`, background: C.primaryLight,
                    color: C.primary, fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginBottom: '12px',
                  }}
                >
                  + New Page
                </button>
                {pages.map(page => (
                  <div
                    key={page.id}
                    onClick={() => setActivePageId(page.id)}
                    style={{
                      padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
                      background: activePage?.id === page.id ? C.primaryLight : 'transparent',
                      border: `1px solid ${activePage?.id === page.id ? C.primary : 'transparent'}`,
                      transition: 'all 0.1s',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{page.is_home ? '🏠 ' : '📄 '}{page.title}</div>
                    <div style={{ fontSize: '11px', color: C.muted }}>{page.slug}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CENTER CANVAS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isPreviewMode ? '0' : '24px', background: isPreviewMode ? '#fff' : C.bg }}>
          {isPreviewMode ? (
            <div>
              {/* Preview mode — render sections for real */}
              {sections.map(sec => {
                const loader = sectionImports[sec.type];
                if (!loader) return null;
                const LazyComp = React.lazy(loader);
                return (
                  <React.Suspense key={sec.id} fallback={<div style={{ height: '100px', background: '#f3f4f6' }} />}>
                    <LazyComp data={sec.data} theme={theme} isEditing={false} />
                  </React.Suspense>
                );
              })}
            </div>
          ) : (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              {/* Page header */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.text }}>{activePage?.title || 'Select a Page'}</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: C.muted }}>{activePage?.slug} · {sections.length} sections</p>
                </div>
              </div>

              {sections.length === 0 ? (
                <div style={{
                  border: `2px dashed ${C.border}`, borderRadius: '16px',
                  padding: '80px 40px', textAlign: 'center', background: C.white,
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: C.text }}>This page is empty</h3>
                  <p style={{ margin: '0 0 20px', color: C.muted, fontSize: '14px' }}>Add sections to start building your page</p>
                  <button onClick={() => setShowAddSection(true)} style={{ padding: '12px 24px', borderRadius: '12px', background: C.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                    + Add First Section
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sections.map((sec, idx) => (
                    <SectionBlock
                      key={sec.id}
                      section={sec}
                      theme={theme}
                      isSelected={selectedSectionId === sec.id}
                      onClick={() => setSelectedSectionId(sec.id === selectedSectionId ? null : sec.id)}
                      onMoveUp={() => moveSection(sec.id, 'up')}
                      onMoveDown={() => moveSection(sec.id, 'down')}
                      onDelete={() => deleteSection(sec.id)}
                      onDuplicate={() => duplicateSection(sec.id)}
                      isFirst={idx === 0}
                      isLast={idx === sections.length - 1}
                    />
                  ))}
                  <button onClick={() => setShowAddSection(true)} style={{ padding: '16px', borderRadius: '12px', border: `2px dashed ${C.border}`, background: 'transparent', color: C.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                    + Add Section
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Properties */}
        {!isPreviewMode && (
          <div style={{
            width: '280px', background: C.panel, borderLeft: `1px solid ${C.panelBorder}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
          }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.panelBorder}`, fontSize: '13px', fontWeight: 800, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Properties
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <PropertiesPanel
                section={selectedSection}
                onUpdate={(newData) => selectedSection && updateSectionData(selectedSection.id, newData)}
                theme={theme}
                onThemeChange={handleThemeChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── ADD SECTION MODAL ─────────────────────────────────────────────── */}
      {showAddSection && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '760px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Add Section</h3>
              <button onClick={() => setShowAddSection(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            {/* Category filter */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setAddSectionCategory(cat)} style={{ padding: '4px 12px', borderRadius: '100px', border: addSectionCategory === cat ? 'none' : '1px solid #e5e7eb', background: addSectionCategory === cat ? C.primary : '#fff', color: addSectionCategory === cat ? '#fff' : '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{cat}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', alignContent: 'start' }}>
              {filteredSections.map(sec => (
                <button
                  key={sec.type}
                  onClick={() => addSection(sec.type)}
                  style={{
                    padding: '20px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.primaryLight; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{sec.emoji}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{sec.label}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{sec.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CSS variable for primary light ───────────────────────────────────────────
const C2 = { primaryLight: '#eef2ff' };
Object.assign(C, C2);
