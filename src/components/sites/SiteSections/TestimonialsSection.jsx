import React from 'react';
import { Star } from 'lucide-react';

const TestimonialsSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline, testimonials } = data || {};
  
  const sectionStyle = {
    backgroundColor: theme?.backgroundColor || '#f8fafc',
    color: theme?.textColor || '#0f172a',
    padding: '96px 24px',
    fontFamily: theme?.fontFamily || 'system-ui, sans-serif',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
  };

  return (
    <section style={sectionStyle} onClick={isEditing ? onEdit : undefined}>
      <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '64px' }}>
        {headline || 'What Our Customers Say'}
      </h2>
      <div style={gridStyle}>
        {(testimonials || [1, 2]).map((test, idx) => (
          <div key={idx} style={cardStyle}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', color: '#eab308' }}>
              {[...Array(test.rating || 5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
            </div>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.7', marginBottom: '32px', fontStyle: 'italic' }}>
              "{test.text || 'This product completely changed how I work. Highly recommended!'}"
            </p>
            <div>
              <p style={{ fontWeight: '600', fontSize: '1rem' }}>{test.name || 'John Doe'}</p>
              <p style={{ color: theme?.secondaryColor || '#64748b', fontSize: '0.875rem' }}>{test.role || 'CEO, Company'}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
