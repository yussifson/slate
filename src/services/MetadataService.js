/**
 * Slate V2: Metadata Engine Service
 * 
 * Manages dynamic entity definitions (meta_objects) and typed custom fields (meta_fields)
 */
import { supabase } from '../api/supabaseClient';

const VALID_FIELD_TYPES = new Set([
  'text',
  'number',
  'currency',
  'date',
  'boolean',
  'select',
  'multiselect',
  'party_reference'
]);

export const MetadataService = {
  /**
   * Get all registered business objects for a tenant (including system objects)
   */
  async getObjects(companyId) {
    try {
      const { data, error } = await supabase
        .from('meta_objects')
        .select('*')
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .order('display_name', { ascending: true });

      if (error) {
        console.warn('[MetadataService] getObjects error:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('[MetadataService] Exception in getObjects:', err);
      return [];
    }
  },

  /**
   * Get field definitions for a specific meta_object
   */
  async getFields(objectId, companyId) {
    if (!objectId) return [];

    try {
      const { data, error } = await supabase
        .from('meta_fields')
        .select('*')
        .eq('object_id', objectId)
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .order('label', { ascending: true });

      if (error) {
        console.warn('[MetadataService] getFields error:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('[MetadataService] Exception in getFields:', err);
      return [];
    }
  },

  /**
   * Register a custom field on a business object with strict type and tenant validation
   */
  async createField(companyId, objectId, fieldData) {
    if (!companyId || !objectId || !fieldData.field_key || !fieldData.label) {
      throw new Error('companyId, objectId, field_key, and label are required.');
    }

    const fieldType = fieldData.field_type || 'text';
    if (!VALID_FIELD_TYPES.has(fieldType)) {
      throw new Error(`Invalid field_type '${fieldType}'. Must be one of: ${Array.from(VALID_FIELD_TYPES).join(', ')}`);
    }

    const payload = {
      company_id: companyId,
      object_id: objectId,
      field_key: fieldData.field_key.toLowerCase().trim().replace(/\s+/g, '_'),
      label: fieldData.label,
      field_type: fieldType,
      is_required: Boolean(fieldData.is_required),
      options: fieldData.options || [],
      validation_rules: fieldData.validation_rules || {}
    };

    const { data, error } = await supabase
      .from('meta_fields')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(`Failed to create meta field: ${error.message}`);
    return data;
  }
};
