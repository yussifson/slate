import React, { useState } from 'react';

const FormSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline = "Contact Us", fields = [], submitText = "Submit", successMessage = "Thank you for your message!" } = data;
  const [submitted, setSubmitted] = useState(false);

  const styles = {
    section: {
      padding: '5rem 2rem',
      backgroundColor: theme?.background || '#f9fafb',
      color: theme?.text || '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    container: {
      maxWidth: '600px',
      margin: '0 auto',
    },
    headline: {
      fontSize: '2.5rem',
      fontWeight: '800',
      marginBottom: '2rem',
      textAlign: 'center',
      letterSpacing: '-0.025em',
      color: theme?.primary || '#111827',
    },
    form: {
      backgroundColor: theme?.surface || '#ffffff',
      padding: '3rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      cursor: isEditing ? 'pointer' : 'default',
    },
    fieldGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#4b5563',
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: `1px solid ${theme?.border || '#d1d5db'}`,
      fontSize: '1rem',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s',
      outline: 'none',
    },
    textarea: {
      width: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: `1px solid ${theme?.border || '#d1d5db'}`,
      fontSize: '1rem',
      fontFamily: 'inherit',
      minHeight: '120px',
      resize: 'vertical',
      outline: 'none',
    },
    button: {
      width: '100%',
      padding: '1rem',
      borderRadius: '0.5rem',
      backgroundColor: theme?.primary || '#3b82f6',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '1.125rem',
      border: 'none',
      cursor: 'pointer',
      marginTop: '1rem',
      transition: 'opacity 0.2s, transform 0.1s',
    },
    successMsg: {
      backgroundColor: '#ecfdf5',
      color: '#065f46',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      textAlign: 'center',
      fontWeight: '600',
      border: '1px solid #a7f3d0',
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEditing) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <section style={styles.section} onClick={isEditing ? onEdit : undefined}>
      <div style={styles.container}>
        <h2 style={styles.headline}>{headline}</h2>
        <div style={styles.form}>
          {submitted ? (
            <div style={styles.successMsg}>{successMessage}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {fields.map((field, index) => (
                <div key={index} style={styles.fieldGroup}>
                  <label style={styles.label}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea 
                      style={styles.textarea} 
                      placeholder={`Enter ${field.label}`}
                      disabled={isEditing}
                    />
                  ) : (
                    <input 
                      type={field.type || 'text'} 
                      style={styles.input} 
                      placeholder={`Enter ${field.label}`}
                      disabled={isEditing}
                    />
                  )}
                </div>
              ))}
              {fields.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '2rem' }}>
                  Add form fields in settings
                </div>
              )}
              <button 
                type="submit" 
                style={styles.button}
                disabled={isEditing}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {submitText}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default FormSection;
