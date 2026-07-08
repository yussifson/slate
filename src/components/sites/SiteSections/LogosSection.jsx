import React from 'react';
import { Hexagon } from 'lucide-react';

const LogosSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline = "Trusted By", logos = [] } = data;

  const styles = {
    section: {
      padding: '4rem 2rem',
      backgroundColor: theme?.background || '#ffffff',
      color: theme?.text || '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderTop: `1px solid ${theme?.border || '#f3f4f6'}`,
      borderBottom: `1px solid ${theme?.border || '#f3f4f6'}`,
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center',
    },
    headline: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: theme?.secondary || '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '2.5rem',
    },
    grid: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '4rem',
      opacity: 0.7,
      cursor: isEditing ? 'pointer' : 'default',
    },
    logoWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '1.5rem',
      fontWeight: '700',
      color: theme?.primary || '#374151',
      transition: 'color 0.3s, opacity 0.3s',
    }
  };

  return (
    <section style={styles.section} onClick={isEditing ? onEdit : undefined}>
      <div style={styles.container}>
        {headline && <h2 style={styles.headline}>{headline}</h2>}
        <div style={styles.grid}>
          {logos.length > 0 ? logos.map((logo, index) => (
            <div 
              key={index} 
              style={styles.logoWrapper}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            >
              <Hexagon size={32} />
              <span>{logo.name}</span>
            </div>
          )) : (
            <div style={{...styles.logoWrapper, opacity: 1}}>
              <span>Add logos to display here</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LogosSection;
