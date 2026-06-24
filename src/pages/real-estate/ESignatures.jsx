import React, { useState, useEffect } from 'react';
import { useRealEstateAPI } from '../../hooks/useRealEstateAPI';
import DocumentsAPI from '../../api/RealEstateDocuments';

export default function ESignatures() {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useRealEstateAPI();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await DocumentsAPI.getESignatures(companyId);
        setSignatures(data);
      } catch (error) {
        console.error('Error loading e-signatures:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">E-Signatures</h1>
        <p className="text-muted-foreground">Manage digital signatures on documents</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="bg-accent">
              <th className="text-left py-3 px-4">Document ID</th>
              <th className="text-left py-3 px-4">Signer Name</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Signature Date</th>
              <th className="text-left py-3 px-4">Expiration</th>
            </tr>
          </thead>
          <tbody>
            {signatures.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-muted-foreground">No e-signatures found</td>
              </tr>
            ) : (
              signatures.map(sig => (
                <tr key={sig.id} className="border-b border-border hover:bg-accent">
                  <td className="py-3 px-4 font-mono text-xs">{sig.document_id.substring(0, 8)}...</td>
                  <td className="py-3 px-4">{sig.signer_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[sig.signature_status] || 'bg-gray-100'}`}>
                      {sig.signature_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{sig.signature_date ? new Date(sig.signature_date).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{sig.expiration_date ? new Date(sig.expiration_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
