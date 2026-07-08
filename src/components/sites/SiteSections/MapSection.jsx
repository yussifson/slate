import React from 'react';
import { MapPin } from 'lucide-react';

const MapSection = ({ data = {}, theme = {}, isEditing, onEdit, onDataChange }) => {
  const { headline = 'Find Us', address = '123 Business Avenue, Suite 100, San Francisco, CA 94107' } = data;
  
  const primaryColor = theme.primary || '#ec4899';
  const textColor = theme.text || '#1f2937';
  const bgColor = theme.background || '#f9fafb';

  return (
    <section style={{ backgroundColor: bgColor, color: textColor, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 
            style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', cursor: isEditing ? 'pointer' : 'default' }}
            onClick={() => isEditing && onEdit && onEdit('headline')}
          >
            {headline}
          </h2>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#4b5563', fontSize: '1.125rem', cursor: isEditing ? 'pointer' : 'default' }}
            onClick={() => isEditing && onEdit && onEdit('address')}
          >
            <MapPin color={primaryColor} />
            <span>{address}</span>
          </div>
        </div>
        
        <div style={{ height: '450px', backgroundColor: '#e5e7eb', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          {/* Placeholder for actual map implementation */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb' }}>
            <MapPin size={64} color={primaryColor} />
            <p style={{ marginTop: '1rem', color: '#6b7280', fontWeight: '500' }}>Interactive Map View</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
