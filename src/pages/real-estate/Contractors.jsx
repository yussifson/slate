import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../../hooks/useCompanyId';
import { RealEstateContractors } from '../../api/RealEstateContractors';

export default function Contractors() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await RealEstateContractors.getContractors(companyId);
        setContractors(data);
      } catch (error) {
        console.error('Error loading contractors:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const renderStars = (rating) => {
    return '★'.repeat(Math.floor(rating || 0)) + '☆'.repeat(5 - Math.floor(rating || 0));
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Contractors & Vendors</h1>
        <p className="text-muted-foreground">Manage your approved contractors and service providers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No contractors found
          </div>
        ) : (
          contractors.map(contractor => (
            <div key={contractor.id} className="border border-border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{contractor.contractor_name}</h3>
                  <p className="text-sm text-muted-foreground">{contractor.contractor_type}</p>
                </div>
                {contractor.average_rating && (
                  <div className="text-right">
                    <div className="text-yellow-500 text-sm">{renderStars(contractor.average_rating)}</div>
                    <p className="text-xs text-muted-foreground">{contractor.total_reviews} reviews</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div><span className="text-muted-foreground">Email:</span> {contractor.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {contractor.phone}</div>
                <div><span className="text-muted-foreground">Location:</span> {contractor.city}, {contractor.state}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4 pt-4 border-t border-border">
                <div><span className="text-muted-foreground">Licensed:</span> {contractor.is_licensed ? 'Yes' : 'No'}</div>
                <div><span className="text-muted-foreground">Insured:</span> {contractor.is_insured ? 'Yes' : 'No'}</div>
                <div><span className="text-muted-foreground">Jobs:</span> {contractor.total_jobs_completed}</div>
                <div><span className="text-muted-foreground">Rate:</span> ${contractor.hourly_rate}/hr</div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 border border-border rounded text-sm hover:bg-accent">
                  Request Service
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
