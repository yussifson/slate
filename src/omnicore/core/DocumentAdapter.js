import { base44 } from '@/api/base44Client';

/**
 * DocumentAdapter
 * Normalized read/write adapter for the 'Document' primitive.
 * Primary sources: documents, signature_requests, smart_folders.
 * Write target: base44.entities.Document.create (tenant-scoped, RBAC-respecting).
 */
export const DocumentAdapter = {
  /**
   * Fetch normalized document and file records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<NormalizedDocument>>}
   */
  async getDocuments(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch from 'documents' table (primary document repository)
    try {
      const docs = await base44.entities.Document.filter({ company_id: companyId });
      (docs || []).forEach(doc => {
        normalized.push({
          id: doc.id,
          sourceTable: 'documents',
          companyId: doc.company_id,
          name: doc.name || 'Untitled Document',
          type: doc.file_type || 'document',
          fileUrl: doc.file_url || null,
          fileSize: doc.file_size != null ? Number(doc.file_size) : null,
          category: doc.category || 'general',
          status: doc.shared_with_client ? 'shared' : 'draft',
          version: doc.version != null ? String(doc.version) : '1.0',
          caseId: doc.case_id || null,
          clientId: doc.client_id || null,
          uploadedBy: doc.uploaded_by || doc.created_by || null,
          metadata: {
            caseTitle: doc.case_title || null,
            clientName: doc.client_name || null,
            notes: doc.notes || '',
            filingDate: doc.filing_date || null
          }
        });
      });
    } catch (err) {
      console.warn('[DocumentAdapter] Fetch from documents failed:', err);
    }

    // 2. Fetch from 'signature_requests' table (contracts, e-sign workflows)
    try {
      const sigRequests = await base44.entities.SignatureRequest.filter({ company_id: companyId });
      (sigRequests || []).forEach(sr => {
        normalized.push({
          id: sr.id,
          sourceTable: 'signature_requests',
          companyId: sr.company_id,
          name: sr.document_name || 'Signature Request Document',
          type: 'signature_request',
          fileUrl: null,
          fileSize: null,
          category: 'signature_workflow',
          status: sr.status || 'pending',
          version: '1.0',
          caseId: sr.case_id || null,
          clientId: sr.client_id || null,
          uploadedBy: sr.sent_by || null,
          metadata: {
            documentId: sr.document_id || null,
            caseTitle: sr.case_title || null,
            clientName: sr.client_name || null,
            recipientEmail: sr.client_email || null,
            sentByName: sr.sent_by_name || null,
            sentAt: sr.sent_at || null,
            signedAt: sr.signed_at || null,
            expiresAt: sr.expires_at || null
          }
        });
      });
    } catch (err) {
      console.warn('[DocumentAdapter] Fetch from signature_requests failed:', err);
    }

    // 3. Fetch from 'smart_folders' table (document folder structures)
    try {
      const smartFolders = await base44.entities.SmartFolder.filter({ company_id: companyId });
      (smartFolders || []).forEach(sf => {
        normalized.push({
          id: sf.id,
          sourceTable: 'smart_folders',
          companyId: sf.company_id,
          name: sf.name || 'Smart Folder',
          type: 'folder',
          fileUrl: null,
          fileSize: null,
          category: 'folder',
          status: 'active',
          version: '1.0',
          caseId: null,
          clientId: null,
          uploadedBy: null,
          metadata: {
            parentId: sf.parent_id || null,
            color: sf.color || null
          }
        });
      });
    } catch (err) {
      console.warn('[DocumentAdapter] Fetch from smart_folders failed:', err);
    }

    return normalized;
  },

  /**
   * Create a document record in documents table.
   *
   * @param {string} companyId - Target company_id
   * @param {object} documentData - Document payload
   * @returns {Promise<object>} Created record
   */
  async createDocument(companyId, documentData) {
    if (!companyId) throw new Error('Missing companyId');
    if (!documentData || !documentData.name) {
      throw new Error('Document name is required');
    }

    return base44.entities.Document.create({
      company_id: companyId,
      name: documentData.name,
      file_url: documentData.fileUrl || documentData.file_url || null,
      file_type: documentData.fileType || documentData.file_type || 'document',
      file_size: documentData.fileSize != null ? Number(documentData.fileSize) : (documentData.file_size != null ? Number(documentData.file_size) : null),
      category: documentData.category || 'general',
      case_id: documentData.caseId || documentData.case_id || null,
      case_title: documentData.caseTitle || documentData.case_title || null,
      client_id: documentData.clientId || documentData.client_id || null,
      client_name: documentData.clientName || documentData.client_name || null,
      notes: documentData.notes || '',
      version: documentData.version != null ? documentData.version : 1,
      shared_with_client: documentData.sharedWithClient ?? false
    });
  }
};
