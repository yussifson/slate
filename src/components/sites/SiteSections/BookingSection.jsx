import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

const BookingSection = ({ data = {}, theme = {}, isEditing, onEdit, onDataChange }) => {
  const { headline = 'Book an Appointment', subheadline = 'Schedule a time that works for you', ctaText = 'Book Now' } = data;
  const primaryColor = theme.primary || '#3b82f6';
  const textColor = theme.text || '#1f2937';
  const bgColor = theme.background || '#ffffff';

  return (
    <section style={{ backgroundColor: bgColor, color: textColor, padding: '5rem 2rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
        <h2 
          style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', cursor: isEditing ? 'pointer' : 'default' }}
          onClick={() => isEditing && onEdit && onEdit('headline')}
        >
          {headline}
        </h2>
        <p 
          style={{ fontSize: '1.125rem', color: `${textColor}cc`, marginBottom: '2.5rem', cursor: isEditing ? 'pointer' : 'default' }}
          onClick={() => isEditing && onEdit && onEdit('subheadline')}
        >
          {subheadline}
        </p>
        
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '1rem', padding: '3rem 2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
              <Calendar size={32} color={primaryColor} />
              <span>Select Date</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
              <Clock size={32} color={primaryColor} />
              <span>Choose Time</span>
            </div>
          </div>
          
          <button 
            style={{ 
              backgroundColor: primaryColor, 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '9999px', 
              padding: '1rem 2.5rem', 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'transform 0.2s',
              boxShadow: `0 4px 14px 0 ${primaryColor}40`
            }}
            onClick={() => isEditing && onEdit && onEdit('ctaText')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {ctaText} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
