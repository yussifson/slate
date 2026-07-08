import React from 'react';
import { Play } from 'lucide-react';

const VideoSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline = "Watch Our Video", videoUrl, description } = data;

  const styles = {
    section: {
      padding: '6rem 2rem',
      backgroundColor: theme?.surface || '#111827',
      color: theme?.text || '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      textAlign: 'center',
    },
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
    },
    headline: {
      fontSize: '2.5rem',
      fontWeight: '800',
      marginBottom: '1rem',
      letterSpacing: '-0.025em',
      color: '#ffffff',
    },
    description: {
      fontSize: '1.25rem',
      color: '#9ca3af',
      marginBottom: '3rem',
      maxWidth: '600px',
      margin: '0 auto 3rem auto',
      lineHeight: '1.6',
    },
    videoWrapper: {
      position: 'relative',
      aspectRatio: '16/9',
      backgroundColor: '#000',
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      cursor: isEditing ? 'pointer' : 'default',
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: '#ffffff',
    },
    playButton: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: theme?.primary || '#3b82f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem',
      transition: 'transform 0.3s ease',
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <section style={styles.section} onClick={isEditing ? onEdit : undefined}>
      <div style={styles.container}>
        <h2 style={styles.headline}>{headline}</h2>
        {description && <p style={styles.description}>{description}</p>}
        
        <div style={styles.videoWrapper}>
          {embedUrl ? (
            <iframe 
              src={embedUrl} 
              style={styles.iframe}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              title="Video Section"
            />
          ) : (
            <div style={styles.placeholder}>
              <div style={styles.playButton}>
                <Play size={32} fill="white" />
              </div>
              <h3>Add a video URL in settings</h3>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
