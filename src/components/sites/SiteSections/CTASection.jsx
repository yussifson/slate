import React from 'react';

const CTASection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline, subheadline, ctaText, ctaLink } = data || {};
  
  const sectionStyle = {
    backgroundColor: theme?.backgroundColor || '#ffffff',
    color: theme?.textColor || '#0f172a',
    padding: '120px 24px',
    fontFamily: theme?.fontFamily || 'system-ui, sans-serif',
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
    backgroundColor: theme?.cardColor || '#f8fafc',
    padding: '64px',
    borderRadius: '32px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  };

  const buttonStyle = {
    backgroundColor: theme?.primaryColor || '#3b82f6',
    color: '#ffffff',
    padding: '16px 40px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.125rem',
    display: 'inline-block',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  return (
    <section style={sectionStyle} onClick={isEditing ? onEdit : undefined}>
      <div style={containerStyle}>
        <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '24px', lineHeight: '1.2' }}>
          {headline || 'Ready to get started?'}
        </h2>
        <p style={{ fontSize: '1.25rem', color: theme?.secondaryColor || '#64748b', marginBottom: '40px' }}>
          {subheadline || 'Join thousands of users who are already seeing results.'}
        </p>
        <a href={isEditing ? '#' : ctaLink} style={buttonStyle} onClick={e => isEditing && e.preventDefault()}>
          {ctaText || 'Get Started Now'}
        </a>
      </div>
    </section>
  );
};

export default CTASection;
