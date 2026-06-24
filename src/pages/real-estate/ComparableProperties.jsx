import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../../hooks/useCompanyId';
import { formatCurrency } from '../../utils/formatters';
import IntelligenceAPI from '../../api/RealEstateIntelligence';

export default function ComparableProperties() {
  const [comparables, setComparables] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await IntelligenceAPI.getComparableProperties(companyId);
        setComparables(data);
      } catch (error) {
        console.error('Error loading comparable properties:', error);
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Comparable Properties</h1>
        <p className="text-muted-foreground">Compare properties for valuation and analysis</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="bg-accent">
              <th className="text-left py-3 px-4">Address</th>
              <th className="text-left py-3 px-4">Sale Price</th>
              <th className="text-left py-3 px-4">Price/SqFt</th>
              <th className="text-left py-3 px-4">Beds/Baths</th>
              <th className="text-left py-3 px-4">Year Built</th>
              <th className="text-left py-3 px-4">Days on Market</th>
              <th className="text-left py-3 px-4">Similarity</th>
            </tr>
          </thead>
          <tbody>
            {comparables.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted-foreground">No comparable properties found</td>
              </tr>
            ) : (
              comparables.map(comp => (
                <tr key={comp.id} className="border-b border-border hover:bg-accent">
                  <td className="py-3 px-4 font-medium">{comp.comparable_address}</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(comp.price)}</td>
                  <td className="py-3 px-4">${comp.price_per_sqft}</td>
                  <td className="py-3 px-4">{comp.bedrooms}/{comp.bathrooms}</td>
                  <td className="py-3 px-4">{comp.year_built}</td>
                  <td className="py-3 px-4">{comp.days_on_market} days</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      comp.similarity_score >= 0.8 ? 'bg-green-100 text-green-800' :
                      comp.similarity_score >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(comp.similarity_score * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
