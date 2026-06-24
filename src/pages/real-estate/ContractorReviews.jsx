import React, { useState, useEffect } from 'react';
import { useRealEstateAPI } from '../../hooks/useRealEstateAPI';
import ContractorsAPI from '../../api/RealEstateContractors';

export default function ContractorReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useRealEstateAPI();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await ContractorsAPI.getContractorReviews(companyId);
        setReviews(data);
      } catch (error) {
        console.error('Error loading contractor reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const renderStars = (rating) => {
    return '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Contractor Reviews</h1>
        <p className="text-muted-foreground">View feedback and ratings for your contractors</p>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No contractor reviews found
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="border border-border rounded-lg p-6 bg-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{review.review_title}</h3>
                  <p className="text-sm text-muted-foreground">Contractor ID: {review.contractor_id}</p>
                </div>
                <div className="text-right">
                  <div className="text-yellow-500 text-lg">{renderStars(review.rating)}</div>
                  <p className="text-sm font-medium">{review.rating}/5</p>
                </div>
              </div>

              <p className="text-sm mb-4 text-foreground">{review.review_text}</p>

              <div className="grid grid-cols-4 gap-4 text-sm mb-4 p-4 bg-accent rounded">
                <div>
                  <span className="text-muted-foreground">Punctuality</span>
                  <p className="font-medium">{renderStars(review.punctuality_rating)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Quality</span>
                  <p className="font-medium">{renderStars(review.quality_rating)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Professionalism</span>
                  <p className="font-medium">{renderStars(review.professionalism_rating)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Would Rehire</span>
                  <p className="font-medium">{review.would_rehire ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Posted: {new Date(review.created_at).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
