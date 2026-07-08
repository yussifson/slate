import React from 'react';
import * as Icons from 'lucide-react';

const FeaturesSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline, subheadline, features } = data || {};
  
  const sectionStyle = {
    backgroundColor: theme?.backgroundColor || '#ffffff',
    color: theme?.textColor || '#0f172a',
    padding: '96px 24px',
    fontFamily: theme?.fontFamily || 'system-ui, sans-serif',
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const headerContainerStyle = {
    textAlign: 'center',
    marginBottom: '64px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '48px',
  };

  const featureCardStyle = {
    padding: '32px',
    borderRadius: '16px',
    backgroundColor: theme?.cardColor || '#f8fafc',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.3s ease',
  };

  const iconContainerStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: `${theme?.primaryColor || '#3b82f6'}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    color: theme?.primaryColor || '#3b82f6',
  };

  return (
    <section style={sectionStyle} onClick={isEditing ? onEdit : undefined}>
      <div style={containerStyle}>
        <div style={headerContainerStyle}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px' }}>{headline || 'Features'}</h2>
          <p style={{ fontSize: '1.125rem', color: theme?.secondaryColor || '#64748b', maxWidth: '600px', margin: '0 auto' }}>
            {subheadline || 'Explore what makes our product stand out.'}
          </p>
        </div>
        <div style={gridStyle}>
          {(features || [1, 2, 3]).map((feature, idx) => {
            const Icon = Icons[feature.icon] || Icons.Star;
            return (
              <div key={idx} style={featureCardStyle}>
                <div style={iconContainerStyle}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>{feature.title || 'Feature Title'}</h3>
                <p style={{ color: theme?.secondaryColor || '#64748b', lineHeight: '1.6' }}>
                  {feature.description || 'Description of the feature goes here. It explains the benefits.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
