import React, { useState } from 'react';
import lawFirm from './templates/law-firm.json';
import hospital from './templates/hospital.json';
import restaurant from './templates/restaurant.json';
import hotel from './templates/hotel.json';
import school from './templates/school.json';
import retailStore from './templates/retail-store.json';
import agency from './templates/agency.json';
import generalBusiness from './templates/general-business.json';

const TEMPLATES = [
  {
    id: 'general-business',
    data: generalBusiness,
    previewColor: '#6366f1',
    accentColor: '#8b5cf6',
    emoji: '🏢',
    tags: ['Consulting', 'Services', 'Professional'],
    description: 'Perfect for any professional services company.',
  },
  {
    id: 'law-firm',
    data: lawFirm,
    previewColor: '#1e3a5f',
    accentColor: '#c9a84c',
    emoji: '⚖️',
    tags: ['Legal', 'Law', 'Attorney'],
    description: 'Professional design for law firms and legal practices.',
  },
  {
    id: 'hospital',
    data: hospital,
    previewColor: '#0d6efd',
    accentColor: '#20c997',
    emoji: '🏥',
    tags: ['Healthcare', 'Medical', 'Clinic'],
    description: 'Warm and trustworthy design for medical facilities.',
  },
  {
    id: 'restaurant',
    data: restaurant,
    previewColor: '#b5451b',
    accentColor: '#f4c542',
    emoji: '🍽️',
    tags: ['Food', 'Restaurant', 'Menu'],
    description: 'Inviting design with menu and reservation features.',
  },
  {
    id: 'hotel',
    data: hotel,
    previewColor: '#1a1a2e',
    accentColor: '#c9a87d',
    emoji: '🏨',
    tags: ['Hospitality', 'Hotel', 'Resort'],
    description: 'Luxurious design for hotels and hospitality venues.',
  },
  {
    id: 'school',
    data: school,
    previewColor: '#1565c0',
    accentColor: '#fdd835',
    emoji: '🎓',
    tags: ['Education', 'School', 'Academy'],
    description: 'Professional design with admissions and programs focus.',
  },
  {
    id: 'retail-store',
    data: retailStore,
    previewColor: '#111827',
    accentColor: '#f97316',
    emoji: '🛍️',
    tags: ['Retail', 'Shop', 'E-commerce'],
    description: 'Modern product-focused design for retail brands.',
  },
  {
    id: 'agency',
    data: agency,
    previewColor: '#6c63ff',
    accentColor: '#ff6584',
    emoji: '🚀',
    tags: ['Agency', 'Creative', 'Marketing'],
    description: 'Bold dark-mode design for creative agencies.',
  },
];

export default function TemplateGallery({ onSelect, onClose }) {
  const [selected, setSelected] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Legal', 'Healthcare', 'Food', 'Hospitality', 'Education', 'Retail', 'Agency', 'Professional'];

  const filtered = filter === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.tags.some(tag => tag.toLowerCase() === filter.toLowerCase() || t.data.industry === filter.toLowerCase()));

  const handleSelect = (template) => {
    setSelected(template.id);
  };

  const handleApply = () => {
    const template = TEMPLATES.find(t => t.id === selected);
    if (template) {
      onSelect(template.data);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        width: '100%', maxWidth: '960px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 32px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#111827' }}>
              Choose a Template
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Start with a professional template and customize it to match your brand
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', color: '#6b7280',
              transition: 'all 0.15s',
            }}
          >✕</button>
        </div>

        {/* Filter tabs */}
        <div style={{
          padding: '16px 32px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', gap: '8px', flexWrap: 'wrap',
        }}>
          {['All', 'Legal', 'Healthcare', 'Food', 'Hospitality', 'Education', 'Retail', 'Creative', 'Professional'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                border: filter === cat ? 'none' : '1px solid #e5e7eb',
                background: filter === cat ? '#6366f1' : '#fff',
                color: filter === cat ? '#fff' : '#374151',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '24px 32px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px', alignContent: 'start',
        }}>
          {filtered.map(template => {
            const isSelected = selected === template.id;
            const isHovered = hoveredId === template.id;
            return (
              <div
                key={template.id}
                onClick={() => handleSelect(template)}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  borderRadius: '14px',
                  border: isSelected ? `2px solid #6366f1` : '2px solid transparent',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isHovered && !isSelected ? 'translateY(-3px)' : 'none',
                  boxShadow: isSelected
                    ? '0 0 0 3px rgba(99,102,241,0.2), 0 8px 24px rgba(0,0,0,0.12)'
                    : isHovered
                    ? '0 8px 24px rgba(0,0,0,0.12)'
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  background: '#fff',
                }}
              >
                {/* Preview Area */}
                <div style={{
                  height: '160px',
                  background: `linear-gradient(135deg, ${template.previewColor}, ${template.accentColor})`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '10px', position: 'relative', overflow: 'hidden',
                }}>
                  {/* Decorative bars */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '28px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', marginLeft: '6px' }} />
                  </div>
                  <div style={{ fontSize: '40px' }}>{template.emoji}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.5)', borderRadius: '3px' }} />
                    <div style={{ width: '56px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
                  </div>
                  {/* Selected badge */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: '#fff', color: '#6366f1',
                      borderRadius: '100px', padding: '3px 8px',
                      fontSize: '11px', fontWeight: 700,
                    }}>✓ Selected</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                      {template.data.siteName.split(' ').slice(0, 3).join(' ')}
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                    {template.description}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {template.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '2px 8px', borderRadius: '100px',
                        background: '#f3f4f6', color: '#374151',
                        fontSize: '11px', fontWeight: 500,
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fafafa',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            {selected
              ? `Selected: ${TEMPLATES.find(t => t.id === selected)?.data.siteName}`
              : 'Select a template to get started'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                border: '1px solid #e5e7eb', background: '#fff',
                color: '#374151', fontWeight: 600, cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selected}
              style={{
                padding: '10px 24px', borderRadius: '10px',
                border: 'none',
                background: selected ? '#6366f1' : '#e5e7eb',
                color: selected ? '#fff' : '#9ca3af',
                fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed',
                fontSize: '14px', transition: 'all 0.15s',
              }}
            >
              Apply Template →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
