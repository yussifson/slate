import React, { useState, useEffect } from 'react';
import { useRealEstateAPI } from '../../hooks/useRealEstateAPI';
import DocumentsAPI from '../../api/RealEstateDocuments';

export default function DocumentTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useRealEstateAPI();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await DocumentsAPI.getDocumentTemplates(companyId);
        setTemplates(data);
      } catch (error) {
        console.error('Error loading document templates:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Document Templates</h1>
        <p className="text-muted-foreground">Manage reusable document templates for your transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No document templates found
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="border border-border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">{template.template_name}</h3>
                <p className="text-sm text-muted-foreground">{template.document_type}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Category:</span> {template.document_category}</div>
                <div><span className="text-muted-foreground">Version:</span> {template.version}</div>
                <div><span className="text-muted-foreground">Signatures Required:</span> {template.required_signatures}</div>
                <div><span className="text-muted-foreground">Status:</span> {template.is_active ? 'Active' : 'Inactive'}</div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Created: {new Date(template.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
