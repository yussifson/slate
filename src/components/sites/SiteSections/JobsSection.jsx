import React from 'react';
import { Briefcase, MapPin, ArrowRight } from 'lucide-react';

const JobsSection = ({ data = {}, theme = {}, isEditing, onEdit, onDataChange }) => {
  const { headline = 'Open Positions', jobs = [
    { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote' },
    { title: 'Product Manager', department: 'Product', location: 'New York, NY' },
    { title: 'Marketing Specialist', department: 'Marketing', location: 'London, UK' }
  ]} = data;
  
  const primaryColor = theme.primary || '#10b981';
  const textColor = theme.text || '#1f2937';
  const bgColor = theme.background || '#f9fafb';

  return (
    <section style={{ backgroundColor: bgColor, color: textColor, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h2 
            style={{ fontSize: '2.5rem', fontWeight: 'bold', cursor: isEditing ? 'pointer' : 'default' }}
            onClick={() => isEditing && onEdit && onEdit('headline')}
          >
            {headline}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1.125rem', marginTop: '1rem' }}>
            Join our team and help us build the future.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map((job, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.75rem', 
                padding: '1.5rem 2rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                transition: 'all 0.2s',
                cursor: isEditing ? 'pointer' : 'default'
              }}
              onClick={() => isEditing && onEdit && onEdit(`jobs[${index}]`)}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 4px 6px -1px ${primaryColor}20`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>{job.title}</h3>
                <div style={{ display: 'flex', gap: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Briefcase size={16} /> {job.department}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={16} /> {job.location}
                  </span>
                </div>
              </div>
              <div 
                style={{ 
                  color: primaryColor, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontWeight: '500'
                }}
              >
                Apply <ArrowRight size={18} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobsSection;
