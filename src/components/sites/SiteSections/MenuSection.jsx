import React from 'react';
import { Utensils } from 'lucide-react';

const MenuSection = ({ data = {}, theme = {}, isEditing, onEdit, onDataChange }) => {
  const { headline = 'Our Menu', categories = [
    { name: 'Starters', items: [{ name: 'Bruschetta', price: '$8', description: 'Grilled bread with garlic and tomatoes' }, { name: 'Calamari', price: '$12', description: 'Crispy fried calamari with marinara' }] },
    { name: 'Mains', items: [{ name: 'Steak Frites', price: '$28', description: 'Grilled ribeye with fries' }, { name: 'Salmon', price: '$24', description: 'Pan-seared salmon with asparagus' }] }
  ]} = data;
  
  const primaryColor = theme.primary || '#eab308';
  const textColor = theme.text || '#1f2937';
  const bgColor = theme.background || '#ffffff';

  return (
    <section style={{ backgroundColor: bgColor, color: textColor, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 
            style={{ fontSize: '2.5rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '1rem', cursor: isEditing ? 'pointer' : 'default' }}
            onClick={() => isEditing && onEdit && onEdit('headline')}
          >
            <Utensils size={36} color={primaryColor} />
            {headline}
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {categories.map((category, catIndex) => (
            <div key={catIndex}>
              <h3 
                style={{ fontSize: '1.75rem', fontWeight: '600', borderBottom: `2px solid ${primaryColor}40`, paddingBottom: '0.5rem', marginBottom: '2rem', cursor: isEditing ? 'pointer' : 'default' }}
                onClick={() => isEditing && onEdit && onEdit(`categories[${catIndex}].name`)}
              >
                {category.name}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {category.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    style={{ cursor: isEditing ? 'pointer' : 'default' }}
                    onClick={() => isEditing && onEdit && onEdit(`categories[${catIndex}].items[${itemIndex}]`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{item.name}</h4>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: primaryColor }}>{item.price}</span>
                    </div>
                    <div style={{ borderBottom: '1px dashed #e5e7eb', marginBottom: '0.5rem' }}></div>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
