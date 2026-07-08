import React from 'react';
import { Calendar } from 'lucide-react';

const BlogSection = ({ data = {}, theme = {}, isEditing, onEdit, onDataChange }) => {
  const { headline = 'Latest from our Blog', posts = [
    { title: 'The Future of Web Design', date: 'October 12, 2023', excerpt: 'Exploring the latest trends in web design and how they impact user experience.' },
    { title: 'Optimizing React Performance', date: 'September 28, 2023', excerpt: 'Tips and tricks for making your React applications blazingly fast.' },
    { title: 'Understanding CSS Grid', date: 'September 15, 2023', excerpt: 'A comprehensive guide to mastering CSS Grid layouts.' }
  ]} = data;
  
  const primaryColor = theme.primary || '#8b5cf6';
  const textColor = theme.text || '#1f2937';
  const bgColor = theme.background || '#ffffff';

  return (
    <section style={{ backgroundColor: bgColor, color: textColor, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <h2 
            style={{ fontSize: '2.5rem', fontWeight: 'bold', cursor: isEditing ? 'pointer' : 'default' }}
            onClick={() => isEditing && onEdit && onEdit('headline')}
          >
            {headline}
          </h2>
          <button style={{ background: 'none', border: `1px solid ${primaryColor}`, color: primaryColor, padding: '0.5rem 1.5rem', borderRadius: '9999px', fontWeight: '500', cursor: 'pointer' }}>
            View All
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {posts.map((post, index) => (
            <article 
              key={index} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                cursor: isEditing ? 'pointer' : 'default'
              }}
              onClick={() => isEditing && onEdit && onEdit(`posts[${index}]`)}
              onMouseOver={(e) => {
                const img = e.currentTarget.querySelector('div[data-image]');
                if(img) img.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                const img = e.currentTarget.querySelector('div[data-image]');
                if(img) img.style.transform = 'scale(1)';
              }}
            >
              <div style={{ overflow: 'hidden', borderRadius: '1rem', marginBottom: '1.5rem', height: '240px', backgroundColor: '#f3f4f6' }}>
                <div data-image style={{ width: '100%', height: '100%', transition: 'transform 0.5s ease', backgroundColor: `${primaryColor}20` }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                <Calendar size={14} />
                <span>{post.date}</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.3' }}>
                {post.title}
              </h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6', flexGrow: 1 }}>
                {post.excerpt}
              </p>
              <div style={{ marginTop: '1.5rem', color: primaryColor, fontWeight: '600', fontSize: '0.95rem' }}>
                Read Article &rarr;
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
