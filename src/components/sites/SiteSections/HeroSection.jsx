import React from 'react';

const HeroSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline, subheadline, ctaText, ctaLink, backgroundType } = data || {};
  
  const sectionStyle = {
    backgroundColor: theme?.backgroundColor || '#f8fafc',
    color: theme?.textColor || '#0f172a',
    padding: '120px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '600px',
    fontFamily: theme?.fontFamily || 'system-ui, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  };

  const headlineStyle = {
    fontSize: '4rem',
    fontWeight: '800',
    lineHeight: '1.2',
    marginBottom: '24px',
    maxWidth: '800px',
    letterSpacing: '-0.02em',
  };

  const subheadlineStyle = {
    fontSize: '1.25rem',
    color: theme?.secondaryColor || '#64748b',
    marginBottom: '40px',
    maxWidth: '600px',
    lineHeight: '1.6',
  };

  const buttonStyle = {
    backgroundColor: theme?.primaryColor || '#3b82f6',
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.125rem',
    transition: 'opacity 0.2s',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  };

  return (
    <section style={sectionStyle} onClick={isEditing ? onEdit : undefined}>
      <h1 style={headlineStyle}>{headline || 'Stunning Headline Here'}</h1>
      <p style={subheadlineStyle}>{subheadline || 'A beautiful subheadline that explains the value proposition clearly and concisely.'}</p>
      {ctaText && (
        <a href={isEditing ? '#' : ctaLink} style={buttonStyle} onClick={e => isEditing && e.preventDefault()}>
          {ctaText}
        </a>
      )}
    </section>
  );
};

export default HeroSection;
