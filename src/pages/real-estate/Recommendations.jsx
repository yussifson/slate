import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../../hooks/useCompanyId';
import AnalyticsAPI from '../../api/RealEstateAnalytics';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsAPI.getAgentRecommendations(companyId);
        setRecommendations(data);
      } catch (error) {
        console.error('Error loading recommendations:', error);
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Agent Recommendations</h1>
        <p className="text-muted-foreground">AI-powered recommendations matching clients with agents</p>
      </div>

      <div className="space-y-6">
        {recommendations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No recommendations available
          </div>
        ) : (
          recommendations.map(rec => (
            <div key={rec.id} className="border border-border rounded-lg p-6 bg-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Client: {rec.client_id.substring(0, 12)}</h3>
                  <p className="text-sm text-muted-foreground">Recommendation Type: {rec.recommendation_type}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{(rec.recommendation_score * 100).toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">Match Score</p>
                </div>
              </div>

              <div className="mb-4 p-4 bg-accent rounded">
                <p className="text-sm mb-2">
                  <span className="text-muted-foreground">Recommended Agent:</span>
                  <span className="font-semibold ml-2">{rec.recommended_agent_id.substring(0, 12)}...</span>
                </p>
                <p className="text-sm text-foreground">{rec.recommendation_reason}</p>
              </div>

              {rec.property_id && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm"><span className="text-muted-foreground">Property:</span> {rec.property_id.substring(0, 12)}...</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Recommendation Date</span>
                  <p className="font-medium">{new Date(rec.recommendation_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Client Action</span>
                  <p className="font-medium">{rec.client_action || 'Pending'}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">
                  Send to Client
                </button>
                <button className="flex-1 px-3 py-2 border border-border rounded text-sm hover:bg-accent">
                  Mark Sent
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
