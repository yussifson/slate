import React from 'react';

const TimelineSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline = "Our Journey", items = [] } = data;

  const styles = {
    section: {
      padding: '5rem 2rem',
      backgroundColor: theme?.background || '#ffffff',
      color: theme?.text || '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    container: {
      maxWidth: '800px',
      margin: '0 auto',
    },
    headline: {
      fontSize: '2.5rem',
      fontWeight: '800',
      marginBottom: '4rem',
      textAlign: 'center',
      letterSpacing: '-0.025em',
      color: theme?.primary || '#111827',
    },
    timeline: {
      position: 'relative',
      paddingLeft: '2rem',
      borderLeft: `2px solid ${theme?.border || '#e5e7eb'}`,
      cursor: isEditing ? 'pointer' : 'default',
    },
    item: {
      position: 'relative',
      marginBottom: '3rem',
    },
    dot: {
      position: 'absolute',
      left: '-2.4rem',
      top: '0.25rem',
      width: '1rem',
      height: '1rem',
      borderRadius: '50%',
      backgroundColor: theme?.primary || '#3b82f6',
      border: '4px solid white',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
    },
    year: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: theme?.primary || '#3b82f6',
      marginBottom: '0.5rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.75rem',
      color: theme?.text || '#111827',
    },
    description: {
      fontSize: '1.125rem',
      lineHeight: '1.6',
      color: theme?.textLight || '#4b5563',
    }
  };

  return (
    <section style={styles.section} onClick={isEditing ? onEdit : undefined}>
      <div style={styles.container}>
        <h2 style={styles.headline}>{headline}</h2>
        <div style={styles.timeline}>
          {items.map((item, index) => (
            <div key={index} style={styles.item}>
              <div style={styles.dot} />
              <div style={styles.year}>{item.year}</div>
              <h3 style={styles.title}>{item.title}</h3>
              <p style={styles.description}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
