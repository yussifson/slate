import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline, email, phone, address } = data || {};
  
  const sectionStyle = {
    backgroundColor: theme?.backgroundColor || '#f8fafc',
    color: theme?.textColor || '#0f172a',
    padding: '96px 24px',
    fontFamily: theme?.fontFamily || 'system-ui, sans-serif',
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    marginTop: '64px',
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    padding: '40px 32px',
    borderRadius: '24px',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  };

  const iconContainerStyle = {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: `${theme?.primaryColor || '#3b82f6'}15`,
    color: theme?.primaryColor || '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  };

  return (
    <section style={sectionStyle} onClick={isEditing ? onEdit : undefined}>
      <div style={containerStyle}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
          {headline || 'Get In Touch'}
        </h2>
        
        <div style={gridStyle}>
          {email !== false && (
            <div style={cardStyle}>
              <div style={iconContainerStyle}>
                <Mail size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Email Us</h3>
              <p style={{ color: theme?.secondaryColor || '#64748b' }}>{email || 'hello@example.com'}</p>
            </div>
          )}
          
          {phone !== false && (
            <div style={cardStyle}>
              <div style={iconContainerStyle}>
                <Phone size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Call Us</h3>
              <p style={{ color: theme?.secondaryColor || '#64748b' }}>{phone || '+1 (555) 123-4567'}</p>
            </div>
          )}

          {address !== false && (
            <div style={cardStyle}>
              <div style={iconContainerStyle}>
                <MapPin size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Visit Us</h3>
              <p style={{ color: theme?.secondaryColor || '#64748b' }}>{address || '123 Main St, City, Country'}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
