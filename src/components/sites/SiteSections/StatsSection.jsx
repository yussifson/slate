import React from 'react';
import * as Icons from 'lucide-react';

const StatsSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline, stats } = data || {};
  
  const sectionStyle = {
    backgroundColor: theme?.primaryColor || '#3b82f6',
    color: '#ffffff',
    padding: '96px 24px',
    fontFamily: theme?.fontFamily || 'system-ui, sans-serif',
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '48px',
    textAlign: 'center',
    marginTop: '64px',
  };

  return (
    <section style={sectionStyle} onClick={isEditing ? onEdit : undefined}>
      <div style={containerStyle}>
        {headline && (
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
            {headline}
          </h2>
        )}
        <div style={gridStyle}>
          {(stats || [
            { value: '10k+', label: 'Customers', icon: 'Users' },
            { value: '99%', label: 'Satisfaction', icon: 'Heart' },
            { value: '24/7', label: 'Support', icon: 'Clock' },
          ]).map((stat, idx) => {
            const Icon = Icons[stat.icon] || Icons.Activity;
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '16px', borderRadius: '50%', marginBottom: '24px' }}>
                  <Icon size={32} />
                </div>
                <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '8px' }}>{stat.value}</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '500', opacity: 0.9 }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
