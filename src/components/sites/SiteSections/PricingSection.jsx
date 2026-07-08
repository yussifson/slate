import React from 'react';
import { Check } from 'lucide-react';

const PricingSection = ({ data, theme, isEditing, onEdit, onDataChange }) => {
  const { headline = "Pricing Plans", plans = [] } = data;

  const styles = {
    section: {
      padding: '5rem 2rem',
      backgroundColor: theme?.background || '#ffffff',
      color: theme?.text || '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center',
    },
    headline: {
      fontSize: '2.5rem',
      fontWeight: '800',
      marginBottom: '3rem',
      letterSpacing: '-0.025em',
      color: theme?.primary || '#111827',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem',
      marginTop: '2rem',
      alignItems: 'center',
    },
    card: (featured) => ({
      padding: '3rem 2rem',
      borderRadius: '1.5rem',
      backgroundColor: featured ? (theme?.primary || '#3b82f6') : (theme?.surface || '#ffffff'),
      color: featured ? '#ffffff' : (theme?.text || '#1f2937'),
      boxShadow: featured ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      transform: featured ? 'scale(1.05)' : 'none',
      border: featured ? 'none' : `1px solid ${theme?.border || '#e5e7eb'}`,
      cursor: isEditing ? 'pointer' : 'default',
      position: 'relative',
      zIndex: featured ? 10 : 1,
    }),
    badge: {
      position: 'absolute',
      top: '-1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: theme?.accent || '#f59e0b',
      color: '#fff',
      padding: '0.25rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    planName: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '1rem',
    },
    priceWrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'baseline',
      marginBottom: '2rem',
    },
    price: {
      fontSize: '3.5rem',
      fontWeight: '800',
      letterSpacing: '-0.025em',
    },
    period: {
      fontSize: '1rem',
      marginLeft: '0.25rem',
      opacity: 0.8,
    },
    featuresList: {
      listStyle: 'none',
      padding: 0,
      margin: '0 0 2rem 0',
      textAlign: 'left',
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1rem',
      fontSize: '1rem',
    },
    button: (featured) => ({
      width: '100%',
      padding: '1rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      fontSize: '1.125rem',
      cursor: 'pointer',
      backgroundColor: featured ? '#ffffff' : (theme?.primary || '#3b82f6'),
      color: featured ? (theme?.primary || '#3b82f6') : '#ffffff',
      border: 'none',
      transition: 'opacity 0.2s',
    })
  };

  return (
    <section style={styles.section} onClick={isEditing ? onEdit : undefined}>
      <div style={styles.container}>
        <h2 style={styles.headline}>{headline}</h2>
        <div style={styles.grid}>
          {plans.map((plan, index) => (
            <div key={index} style={styles.card(plan.featured)}>
              {plan.featured && <div style={styles.badge}>Most Popular</div>}
              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.priceWrapper}>
                <span style={styles.price}>{plan.price}</span>
                {plan.period && <span style={styles.period}>/{plan.period}</span>}
              </div>
              <ul style={styles.featuresList}>
                {plan.features?.map((feature, idx) => (
                  <li key={idx} style={styles.featureItem}>
                    <Check size={20} color={plan.featured ? '#fff' : (theme?.primary || '#3b82f6')} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button style={styles.button(plan.featured)}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
