import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline, faqs } = data || {};
  const [openIndex, setOpenIndex] = useState(null);

  const sectionStyle = {
    backgroundColor: theme?.backgroundColor || '#ffffff',
    color: theme?.textColor || '#0f172a',
    padding: '96px 24px',
    fontFamily: theme?.fontFamily || 'system-ui, sans-serif',
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
  };

  const itemStyle = {
    borderBottom: '1px solid #e2e8f0',
    padding: '24px 0',
  };

  return (
    <section style={sectionStyle} onClick={isEditing ? onEdit : undefined}>
      <div style={containerStyle}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '48px' }}>
          {headline || 'Frequently Asked Questions'}
        </h2>
        <div>
          {(faqs || [{ question: 'What is this?', answer: 'This is a great product.' }]).map((faq, idx) => (
            <div key={idx} style={itemStyle}>
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.25rem', fontWeight: '500', color: theme?.textColor || '#0f172a',
                  textAlign: 'left', padding: '0'
                }}
              >
                {faq.question}
                {openIndex === idx ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              {openIndex === idx && (
                <p style={{ marginTop: '16px', color: theme?.secondaryColor || '#64748b', lineHeight: '1.6' }}>
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
