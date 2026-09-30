/**
 * OmniCore Business Context Pack Factory
 * 
 * Constructs a structured Business Context Pack for an industry vertical,
 * dynamically binding terminology from the central `industries.js` registry.
 */
import { INDUSTRIES, getIndustryTerms } from '../../config/industries.js';

export const createContextPack = ({
  industryKey,
  displayName = null,
  icon = null,
  capabilities = {},
  dashboard = {},
  industrySpecific = {},
  customTerms = null
}) => {
  if (!industryKey) {
    throw new Error('createContextPack: industryKey is required');
  }

  const industryDef = INDUSTRIES[industryKey] || {};

  return {
    industryKey,
    name: displayName || industryDef.name || industryKey,
    icon: icon || industryDef.icon || '💼',
    
    // Dynamic terminology resolution directly from central industries.js
    get terms() {
      if (customTerms) return { ...getIndustryTerms(industryKey), ...customTerms };
      return getIndustryTerms(industryKey);
    },

    getTerm(termKey, educationLevel) {
      const terms = this.terms;
      return terms[termKey] || termKey;
    },

    // Capability relevance configuration for this industry
    capabilities: {
      CustomerManagement: {
        enabled: capabilities?.CustomerManagement?.enabled ?? true,
        mode: capabilities?.CustomerManagement?.mode ?? 'standard',
        emphasis: capabilities?.CustomerManagement?.emphasis ?? 'relationship_management',
        ...capabilities?.CustomerManagement
      },
      Sales: {
        enabled: capabilities?.Sales?.enabled ?? true,
        mode: capabilities?.Sales?.mode ?? 'standard',
        emphasis: capabilities?.Sales?.emphasis ?? 'revenue_and_orders',
        ...capabilities?.Sales
      },
      Finance: {
        enabled: capabilities?.Finance?.enabled ?? true,
        mode: capabilities?.Finance?.mode ?? 'standard',
        emphasis: capabilities?.Finance?.emphasis ?? 'invoicing_and_payments',
        ...capabilities?.Finance
      }
    },

    // Dashboard layout & emphasis configuration
    dashboard: {
      defaultLanding: dashboard?.defaultLanding || '/',
      primaryMetrics: dashboard?.primaryMetrics || [],
      quickActions: dashboard?.quickActions || [],
      ...dashboard
    },

    // Industry-specific concerns, specialized entity flags, and custom field notes
    industrySpecific: {
      domainNotes: industrySpecific?.domainNotes || '',
      customFields: industrySpecific?.customFields || [],
      specializedEntities: industrySpecific?.specializedEntities || [],
      complianceFlags: industrySpecific?.complianceFlags || [],
      ...industrySpecific
    },

    // Structural metadata
    metadata: {
      layer: 'BusinessContext',
      version: '2.0.0-scaffold',
      inert: true
    }
  };
};
