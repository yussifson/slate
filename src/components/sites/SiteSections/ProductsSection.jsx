import React from 'react';
import { ShoppingBag } from 'lucide-react';

const ProductsSection = ({ data = {}, theme = {}, isEditing, onEdit, onDataChange }) => {
  const { headline = 'Our Products', products = [
    { name: 'Premium Widget', price: '$49', description: 'High quality widget for all your needs.' },
    { name: 'Super Gadget', price: '$99', description: 'Advanced features and sleek design.' },
    { name: 'Basic Tool', price: '$19', description: 'Simple, effective, and affordable.' }
  ]} = data;
  
  const primaryColor = theme.primary || '#3b82f6';
  const textColor = theme.text || '#1f2937';
  const bgColor = theme.background || '#ffffff';

  return (
    <section style={{ backgroundColor: bgColor, color: textColor, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 
            style={{ fontSize: '2.5rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '1rem', cursor: isEditing ? 'pointer' : 'default' }}
            onClick={() => isEditing && onEdit && onEdit('headline')}
          >
            <ShoppingBag size={36} color={primaryColor} />
            {headline}
          </h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {products.map((product, index) => (
            <div 
              key={index} 
              style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '1rem', 
                padding: '2rem', 
                transition: 'box-shadow 0.3s, transform 0.3s',
                backgroundColor: '#ffffff',
                cursor: isEditing ? 'pointer' : 'default'
              }}
              onClick={() => isEditing && onEdit && onEdit(`products[${index}]`)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ height: '200px', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#9ca3af', fontSize: '3rem' }}>{product.name[0]}</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>{product.name}</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: primaryColor, marginBottom: '1rem' }}>{product.price}</p>
              <p style={{ color: '#6b7280', lineHeight: '1.5' }}>{product.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
