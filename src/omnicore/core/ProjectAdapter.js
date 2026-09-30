import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';

/**
 * ProjectAdapter
 * Normalized read adapter for the 'Project/Matter' primitive.
 * Primary sources: legal_cases, case_pipelines.
 * Deferred/Secondary sources: industry_records (project/initiative), univ_re_developments.
 * Write target: Direct generic project creation via base44 ORM is deferred; vertical project/case tables are used.
 */
export const ProjectAdapter = {
  /**
   * Fetch normalized project and case records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<NormalizedProject>>}
   */
  async getProjects(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch from 'legal_cases' table (primary matters/projects)
    try {
      const cases = await base44.entities.LegalCase.filter({ company_id: companyId });
      (cases || []).forEach(c => {
        normalized.push({
          id: c.id,
          sourceTable: 'legal_cases',
          companyId: c.company_id,
          name: c.title || 'Untitled Project',
          type: c.case_type || 'project',
          status: c.status || 'open',
          priority: c.priority || 'medium',
          assignedTo: c.assigned_lawyer || c.assigned_lawyer_name || null,
          clientId: c.client_id || null,
          startDate: c.filing_date || c.created_at || null,
          targetDate: c.next_hearing_date || null,
          description: c.description || '',
          metadata: {
            caseNumber: c.case_number || null,
            clientName: c.client_name || null,
            opposingParty: c.opposing_party || null,
            courtName: c.court_name || null,
            tags: c.tags || null
          }
        });
      });
    } catch (err) {
      console.warn('[ProjectAdapter] Fetch from legal_cases failed:', err);
    }

    // 2. Fetch from 'case_pipelines' table (pipeline stages and workflow initiatives)
    try {
      const pipelines = await base44.entities.CasePipeline.filter({ company_id: companyId });
      (pipelines || []).forEach(pl => {
        normalized.push({
          id: pl.id,
          sourceTable: 'case_pipelines',
          companyId: pl.company_id,
          name: pl.name || 'Pipeline Initiative',
          type: pl.case_type || pl.category || 'pipeline',
          status: pl.is_active === false ? 'inactive' : 'active',
          priority: 'medium',
          assignedTo: null,
          clientId: null,
          startDate: pl.created_at || null,
          targetDate: null,
          description: pl.description || '',
          metadata: {
            stages: pl.stages || [],
            itemLabel: pl.item_label || null,
            color: pl.color || null,
            isDefault: Boolean(pl.is_default)
          }
        });
      });
    } catch (err) {
      console.warn('[ProjectAdapter] Fetch from case_pipelines failed:', err);
    }

    // 3. Fetch from 'industry_records' for custom vertical initiatives/projects (deferred)
    try {
      if (supabase && typeof supabase.from === 'function') {
        const { data } = await supabase
          .from('industry_records')
          .select('*')
          .eq('company_id', companyId)
          .in('record_type', ['project', 'initiative', 'development']);

        (data || []).forEach(rec => {
          const payload = typeof rec.data === 'string' ? JSON.parse(rec.data || '{}') : (rec.data || {});
          normalized.push({
            id: rec.id,
            sourceTable: 'industry_records',
            companyId: rec.company_id,
            name: payload.name || payload.title || 'Vertical Project',
            type: rec.record_type || 'project',
            status: rec.status || payload.status || 'active',
            priority: payload.priority || 'medium',
            assignedTo: payload.assigned_to || payload.manager || null,
            clientId: payload.client_id || null,
            startDate: payload.start_date || rec.created_at || null,
            targetDate: payload.target_date || payload.deadline || null,
            description: payload.description || '',
            metadata: payload
          });
        });
      }
    } catch (err) {
      // Graceful fallback
    }

    return normalized;
  },

  /**
   * Create a project record.
   * Note: Direct generic project creation via base44 ORM is not supported; projects/matters must be managed via vertical-specific tables (e.g. legal_cases, case_pipelines, industry_records).
   */
  async createProject(companyId, projectData) {
    if (!companyId) throw new Error('Missing companyId');
    throw new Error('[ProjectAdapter] Direct generic project creation via base44 ORM is not implemented; projects/matters must be managed via vertical-specific tables (e.g. legal_cases, case_pipelines).');
  }
};

export default ProjectAdapter;
