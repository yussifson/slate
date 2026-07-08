import React from 'react';

const GallerySection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline = "Our Gallery", images = [] } = data;

  const styles = {
    section: {
      padding: '5rem 2rem',
      backgroundColor: theme?.background || '#f9fafb',
      color: theme?.text || '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      textAlign: 'center',
    },
    headline: {
      fontSize: '2.5rem',
      fontWeight: '800',
      marginBottom: '3rem',
      letterSpacing: '-0.025em',
      color: theme?.primary || '#111827',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
    },
    imageWrapper: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '1rem',
      cursor: isEditing ? 'pointer' : 'default',
      aspectRatio: '4/3',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.5s ease',
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      display: 'flex',
      alignItems: 'flex-end',
      padding: '1.5rem',
    },
    caption: {
      color: '#ffffff',
      fontSize: '1.125rem',
      fontWeight: '600',
      margin: 0,
    }
  };

  return (
    <section style={styles.section} onClick={isEditing ? onEdit : undefined}>
      <div style={styles.container}>
        <h2 style={styles.headline}>{headline}</h2>
        <div style={styles.grid}>
          {images.map((image, index) => (
            <div 
              key={index} 
              style={styles.imageWrapper}
              onMouseEnter={(e) => {
                e.currentTarget.querySelector('img').style.transform = 'scale(1.1)';
                e.currentTarget.querySelector('.overlay').style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.querySelector('img').style.transform = 'scale(1)';
                e.currentTarget.querySelector('.overlay').style.opacity = '0';
              }}
            >
              <img src={image.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} alt={image.caption || `Gallery image ${index + 1}`} style={styles.img} />
              <div className="overlay" style={styles.overlay}>
                {image.caption && <p style={styles.caption}>{image.caption}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
