import React from 'react';
import { MessageCircle } from 'lucide-react';

const ChatSection = ({ data = {}, theme = {}, isEditing, onEdit, onDataChange }) => {
  const { headline = 'Have questions? We are here to help.', buttonText = 'Start a Chat' } = data;
  
  const primaryColor = theme.primary || '#06b6d4';
  const textColor = theme.text || '#ffffff';
  const bgColor = theme.background || '#1f2937';

  return (
    <section style={{ backgroundColor: bgColor, color: textColor, padding: '6rem 2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)` }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', left: '5%', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 70%)` }}></div>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <MessageCircle size={48} color={primaryColor} style={{ margin: '0 auto 2rem auto' }} />
        <h2 
          style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2.5rem', lineHeight: '1.2', cursor: isEditing ? 'pointer' : 'default' }}
          onClick={() => isEditing && onEdit && onEdit('headline')}
        >
          {headline}
        </h2>
        
        <button 
          style={{ 
            backgroundColor: primaryColor, 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '0.5rem', 
            padding: '1.25rem 3rem', 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            boxShadow: `0 10px 15px -3px ${primaryColor}40`,
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onClick={() => isEditing && onEdit && onEdit('buttonText')}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 20px 25px -5px ${primaryColor}60`;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = `0 10px 15px -3px ${primaryColor}40`;
          }}
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
};

export default ChatSection;
