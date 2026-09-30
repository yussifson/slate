import { DocumentAdapter } from '../core/DocumentAdapter';

/**
 * Documents Capability
 * Read-composition layer composing DocumentAdapter.
 * Presents document repository overview, category/type/status breakdowns,
 * and tracks pending electronic signature requests with days-pending analytics.
 */
export const Documents = {
  /**
   * Get document repository overview and distributions.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<{ totalDocuments: number, categoryBreakdown: object, statusBreakdown: object, typeBreakdown: object, totalSizeBytes: number }>}
   */
  async getDocumentOverview(companyId, options = {}) {
    const emptyOverview = {
      totalDocuments: 0,
      categoryBreakdown: {},
      statusBreakdown: {},
      typeBreakdown: {},
      totalSizeBytes: 0
    };

    if (!companyId) return emptyOverview;

    try {
      const documents = await DocumentAdapter.getDocuments(companyId, options);
      if (!documents || documents.length === 0) return emptyOverview;

      const totalDocuments = documents.length;
      const categoryBreakdown = {};
      const statusBreakdown = {};
      const typeBreakdown = {};
      let totalSizeBytes = 0;

      documents.forEach(doc => {
        const cat = doc.category || 'uncategorized';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

        const stat = doc.status || 'draft';
        statusBreakdown[stat] = (statusBreakdown[stat] || 0) + 1;

        const typ = doc.type || 'document';
        typeBreakdown[typ] = (typeBreakdown[typ] || 0) + 1;

        if (doc.fileSize != null && Number(doc.fileSize) > 0) {
          totalSizeBytes += Number(doc.fileSize);
        }
      });

      return {
        totalDocuments,
        categoryBreakdown,
        statusBreakdown,
        typeBreakdown,
        totalSizeBytes
      };
    } catch (err) {
      console.warn('[Documents] Failed to compute document overview:', err);
      return emptyOverview;
    }
  },

  /**
   * Get pending signature requests with days pending and expiration tracking.
   *
   * @param {string} companyId - Tenant company identifier
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<{ id: string, name: string, recipientEmail: string|null, sentByName: string|null, sentAt: string|null, daysPending: number, expiresAt: string|null, status: string, documentId: string|null }>>}
   */
  async getPendingSignatures(companyId, options = {}) {
    if (!companyId) return [];

    try {
      const documents = await DocumentAdapter.getDocuments(companyId, options);
      const signatureRequests = (documents || []).filter(
        d => d.type === 'signature_request' && (d.status || '').toLowerCase() !== 'signed'
      );

      const now = Date.now();

      const pendingList = signatureRequests.map(sr => {
        const sentAtStr = sr.metadata?.sentAt;
        let daysPending = 0;

        if (sentAtStr) {
          const sentTimestamp = new Date(sentAtStr).getTime();
          if (!isNaN(sentTimestamp)) {
            daysPending = Math.max(0, Math.floor((now - sentTimestamp) / (1000 * 60 * 60 * 24)));
          }
        }

        return {
          id: sr.id,
          name: sr.name || 'Signature Request',
          recipientEmail: sr.metadata?.recipientEmail || null,
          sentByName: sr.metadata?.sentByName || null,
          sentAt: sentAtStr || null,
          daysPending,
          expiresAt: sr.metadata?.expiresAt || null,
          status: sr.status || 'pending',
          documentId: sr.metadata?.documentId || null
        };
      });

      // Sort descending by daysPending (longest waiting first)
      pendingList.sort((a, b) => b.daysPending - a.daysPending);

      return pendingList;
    } catch (err) {
      console.warn('[Documents] Failed to compute pending signatures:', err);
      return [];
    }
  }
};

export default Documents;
