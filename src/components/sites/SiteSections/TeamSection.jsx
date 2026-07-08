import React from 'react';
import { Linkedin, Twitter, Github } from 'lucide-react';

const TeamSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline = "Our Team", members = [] } = data;

  const styles = {
    section: {
      padding: '5rem 2rem',
      backgroundColor: theme?.background || '#ffffff',
      color: theme?.text || '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
    },
    container: {
      maxWidth: '1200px',
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2.5rem',
      marginTop: '2rem',
    },
    card: {
      padding: '2rem',
      borderRadius: '1rem',
      backgroundColor: theme?.surface || '#f9fafb',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: isEditing ? 'pointer' : 'default',
    },
    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      backgroundColor: theme?.primary || '#3b82f6',
      margin: '0 auto 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '2rem',
      fontWeight: 'bold',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    name: {
      fontSize: '1.25rem',
      fontWeight: '700',
      marginBottom: '0.25rem',
    },
    role: {
      fontSize: '0.875rem',
      color: theme?.secondary || '#6b7280',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '1rem',
    },
    bio: {
      fontSize: '1rem',
      lineHeight: '1.6',
      color: theme?.textLight || '#4b5563',
      marginBottom: '1.5rem',
    },
    socials: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      color: theme?.primary || '#3b82f6',
    }
  };

  return (
    <section style={styles.section} onClick={isEditing ? onEdit : undefined}>
      <div style={styles.container}>
        <h2 style={styles.headline}>{headline}</h2>
        <div style={styles.grid}>
          {members.map((member, index) => (
            <div key={index} style={styles.card}>
              <div style={styles.avatar}>
                {member.name ? member.name.charAt(0) : '?'}
              </div>
              <h3 style={styles.name}>{member.name}</h3>
              <p style={styles.role}>{member.role}</p>
              <p style={styles.bio}>{member.bio}</p>
              <div style={styles.socials}>
                <Twitter size={20} style={{ cursor: 'pointer' }} />
                <Linkedin size={20} style={{ cursor: 'pointer' }} />
                <Github size={20} style={{ cursor: 'pointer' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
